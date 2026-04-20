import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { recordTokenUsage } from '@/lib/anthropic/check-tokens'

const anthropic = new Anthropic()

function fmtTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return String(n)
}

async function buildStudentContext(studentId: string): Promise<string> {
  const service = createServiceClient()

  const [profileRes, candidateRes, activitiesRes, jobsRes, balancesRes] = await Promise.all([
    service.from('profiles').select('full_name, role').eq('id', studentId).single(),
    service.from('candidate_profiles')
      .select('target_role, seniority, tech_stack, target_regions, work_preference, value_proposition, salary_min, salary_max, salary_currency')
      .eq('user_id', studentId).single(),
    service.from('day_activities').select('day_number, status, updated_at').eq('user_id', studentId),
    service.from('jobs').select('status').eq('user_id', studentId),
    service.from('token_balance')
      .select('tokens_total, tokens_used')
      .eq('user_id', studentId).eq('is_active', true)
      .gt('expires_at', new Date().toISOString()),
  ])

  const p  = profileRes.data
  const c  = candidateRes.data
  const acts = activitiesRes.data ?? []
  const jobs = jobsRes.data ?? []
  const bals = balancesRes.data ?? []

  const completed  = acts.filter(a => a.status === 'done').length
  const lastAct    = [...acts].sort((a, b) => new Date(b.updated_at ?? '').getTime() - new Date(a.updated_at ?? '').getTime())[0]
  const tokensLeft = bals.reduce((s, b) => s + b.tokens_total - b.tokens_used, 0)

  const applied      = jobs.filter(j => ['applied','interviewing','offer'].includes(j.status ?? '')).length
  const interviewing = jobs.filter(j => ['interviewing','offer'].includes(j.status ?? '')).length
  const offers       = jobs.filter(j => j.status === 'offer').length

  const salaryStr = c?.salary_min
    ? `$${c.salary_min/1000}k–$${(c.salary_max ?? 0)/1000}k ${c.salary_currency ?? 'USD'}`
    : 'não definida'

  const h = lastAct ? (Date.now() - new Date(lastAct.updated_at ?? '').getTime()) / 3_600_000 : Infinity
  const activityStr = !lastAct ? 'nunca acessou' : h < 2 ? 'ativo agora' : h < 24 ? `${Math.round(h)}h atrás` : `${Math.floor(h/24)}d atrás`

  return `DOSSIER DO ALUNO:
Nome: ${p?.full_name ?? 'Sem nome'} | Tipo: ${p?.role ?? '?'}
Cargo-alvo: ${c?.target_role ?? 'não definido'} (${c?.seniority ?? '?'})
Stack: ${c?.tech_stack?.join(', ') ?? 'não definida'}
Mercado: ${c?.target_regions?.join(', ') ?? 'não definido'} | Preferência: ${c?.work_preference ?? '?'}
Proposta de valor: ${c?.value_proposition ?? 'não definida'}
Pretensão: ${salaryStr}

PROGRESSO:
Dias completos: ${completed}/30 | Última atividade: ${activityStr}
Candidaturas: ${applied} aplicadas | ${interviewing} entrevistas | ${offers} oferta(s)
Tokens restantes: ${fmtTokens(tokensLeft)}`
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { messages, studentId } = await req.json() as {
    messages: Anthropic.MessageParam[]
    studentId: string
  }

  if (!studentId || !messages?.length) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }

  const studentContext = await buildStudentContext(studentId)

  const system = `Você é o assistente da área do mentor no TNG Companion — plataforma que ajuda profissionais brasileiros a conseguirem vagas internacionais.

${studentContext}

SUAS CAPACIDADES:
- Analisar o progresso e situação do aluno com base no dossier
- Sugerir ações concretas para o mentor
- Criar planos personalizados (quando solicitado, gere um plano estruturado por semana/dia)
- Orientar sobre concessão de tokens, extensão de acesso, abordagem ao aluno
- Responder perguntas sobre o aluno

REGRAS:
- Responda sempre em Português
- Seja direto e prático — sem rodeios
- Use o dossier em todas as respostas, personalize para este aluno específico
- Respostas curtas (máx 3 parágrafos) exceto planos e análises detalhadas
- Quando criar um plano, use formato claro: **Semana X — Tema** / Dia N: tarefa`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system,
          messages,
        })

        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }
          if (event.type === 'message_stop') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          }
        }

        const finalMsg = await stream.finalMessage()
        const input  = finalMsg.usage.input_tokens
        const output = finalMsg.usage.output_tokens
        await recordTokenUsage(user.id, input + output, 'mentor_chat', {}, 'claude-sonnet-4-6', input, output)
      } catch (err) {
        console.error('[mentor/chat] stream error', err)
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
