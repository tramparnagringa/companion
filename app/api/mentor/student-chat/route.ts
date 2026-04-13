import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function buildStudentSystemPrompt(student: Record<string, unknown>): string {
  const p  = student.profile  as Record<string, unknown> | null
  const c  = student.candidate as Record<string, unknown> | null
  const days = (student.days as { status: string; day_number: number }[]) ?? []
  const jobs = (student.jobs as { status: string; role_title: string; company_name: string; fit_score: number | null }[]) ?? []
  const enrollments = (student.enrollments as { status: string; program: { name: string; total_days: number } }[]) ?? []
  const balances = (student.tokenBalances as { is_active: boolean; tokens_total: number; tokens_used: number }[]) ?? []
  const interviewPrep = student.interviewPrep as Record<string, unknown> | null

  const completedDays = days.filter(d => d.status === 'done').length
  const tokensTotal   = balances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_total, 0)
  const tokensUsed    = balances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_used, 0)
  const tokensLeft    = tokensTotal - tokensUsed
  const applied       = jobs.filter(j => ['applied', 'interviewing', 'offer'].includes(j.status)).length
  const interviews    = jobs.filter(j => ['interviewing', 'offer'].includes(j.status)).length

  return `Você é um analista de carreira da TNG. Você tem acesso ao perfil completo do candidato abaixo e pode ajudar mentores e admins a entender melhor esse aluno, identificar pontos de atenção, e sugerir próximos passos.

Seja direto e específico. Baseie suas respostas exclusivamente nos dados abaixo. Se uma informação não estiver disponível, diga claramente.

---

## Aluno

- **Nome:** ${p?.full_name ?? 'Sem nome'}
- **Plano:** ${p?.role ?? '—'}
- **Cadastro:** ${p?.created_at ? new Date(p.created_at as string).toLocaleDateString('pt-BR') : '—'}

## Programas enrollados

${enrollments.length === 0 ? '- Nenhum programa encontrado.' : enrollments.map(e =>
  `- ${e.program.name} — ${e.status} — ${completedDays}/${e.program.total_days} dias concluídos`
).join('\n')}

## Perfil candidato

${!c ? '- Perfil não criado ainda.' : `
- **Cargo alvo:** ${c.target_role ?? '—'}
- **Senioridade:** ${c.seniority ?? '—'} · ${c.years_experience ?? '—'} anos de experiência
- **Stack:** ${(c.tech_stack as string[] | null)?.join(', ') ?? '—'}
- **Preferência:** ${c.work_preference ?? '—'} · ${(c.target_regions as string[] | null)?.join(', ') ?? '—'}
- **Proposta de valor:** ${c.value_proposition ?? 'Não definida'}
- **LinkedIn headline:** ${c.linkedin_headline ?? 'Não definida'}
`.trim()}

## Progresso

- ${completedDays} dias concluídos
- Dias em progresso: ${days.filter(d => d.status === 'in_progress').length}

## Pipeline de vagas

- Total analisadas: ${jobs.length}
- Candidaturas: ${applied}
- Entrevistas: ${interviews}
- Taxa de resposta: ${applied > 0 ? Math.round((interviews / applied) * 100) : 0}%
${jobs.filter(j => j.status === 'interviewing' || j.status === 'offer').map(j =>
  `- Em entrevista: ${j.role_title} @ ${j.company_name}${j.fit_score ? ` (fit ${j.fit_score}%)` : ''}`
).join('\n')}

## Tokens

- Restantes: ${tokensLeft.toLocaleString()} de ${tokensTotal.toLocaleString()}
- Consumido: ${tokensTotal > 0 ? Math.round((tokensUsed / tokensTotal) * 100) : 0}%

## Preparação para entrevistas

${interviewPrep?.star_stories && Array.isArray(interviewPrep.star_stories) && interviewPrep.star_stories.length > 0
  ? `- ${interviewPrep.star_stories.length} STAR stories registradas: ${(interviewPrep.star_stories as { title: string }[]).map(s => s.title).join(', ')}`
  : '- Nenhuma STAR story registrada ainda.'}
${interviewPrep?.technical_gaps && Array.isArray(interviewPrep.technical_gaps) && interviewPrep.technical_gaps.length > 0
  ? `- Gaps técnicos identificados: ${(interviewPrep.technical_gaps as string[]).join(', ')}`
  : ''}
`
}

async function getCallerOrNull(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) return null
  return user
}

// GET — load existing session messages for a student
export async function GET(req: Request) {
  const supabase = await createServerClient()
  const caller = await getCallerOrNull(supabase)
  if (!caller) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'missing_params' }, { status: 400 })

  const service = createServiceClient()
  const { data: session } = await service
    .from('chat_sessions')
    .select('id, messages')
    .eq('user_id', caller.id)
    .eq('mode', 'mentor')
    .eq('target_user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  return Response.json({
    sessionId: session?.id ?? null,
    messages: session?.messages ?? [],
  })
}

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const caller = await getCallerOrNull(supabase)
  if (!caller) return new Response('Unauthorized', { status: 401 })

  const { userId, messages, sessionId } = await req.json()
  if (!userId || !messages) {
    return Response.json({ error: 'missing_params' }, { status: 400 })
  }

  // Fetch student data
  const service = createServiceClient()
  const [profileRes, candidateRes, daysRes, jobsRes, balancesRes, interviewRes, enrollmentsRes] =
    await Promise.all([
      service.from('profiles').select('id, full_name, role, created_at').eq('id', userId).single(),
      service.from('candidate_profiles').select('*').eq('user_id', userId).single(),
      service.from('day_activities').select('day_number, status').eq('user_id', userId),
      service.from('jobs').select('id, role_title, company_name, status, fit_score').eq('user_id', userId),
      service.from('token_balance').select('tokens_total, tokens_used, is_active').eq('user_id', userId).eq('is_active', true),
      service.from('interview_prep').select('star_stories, technical_gaps').eq('user_id', userId).single(),
      service.from('user_programs').select('id, status, program:programs(name, total_days)').eq('user_id', userId),
    ])

  const student = {
    profile:       profileRes.data,
    candidate:     candidateRes.data ?? null,
    days:          daysRes.data ?? [],
    jobs:          jobsRes.data ?? [],
    tokenBalances: balancesRes.data ?? [],
    interviewPrep: interviewRes.data ?? null,
    enrollments:   enrollmentsRes.data ?? [],
  }

  const systemPrompt = buildStudentSystemPrompt(student as Record<string, unknown>)
  const anthropic = new Anthropic()

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      let assistantContent = ''

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          assistantContent += event.delta.text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
        }
        if (event.type === 'message_stop') {
          // Save the full conversation (user messages + new assistant reply)
          const updatedMessages = [
            ...messages,
            { role: 'assistant', content: assistantContent },
          ]

          if (sessionId) {
            await service
              .from('chat_sessions')
              .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
              .eq('id', sessionId)
          } else {
            const { data: newSession } = await service
              .from('chat_sessions')
              .insert({
                user_id: caller.id,
                target_user_id: userId,
                mode: 'mentor',
                title: `Chat — ${profileRes.data?.full_name ?? userId}`,
                messages: updatedMessages,
              })
              .select('id')
              .single()

            if (newSession) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ sessionId: newSession.id })}\n\n`))
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
