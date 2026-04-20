import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { recordTokenUsage } from '@/lib/anthropic/check-tokens'
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Tool definitions ─────────────────────────────────────────────────────────

const MENTOR_TOOLS: Anthropic.Tool[] = [
  {
    name: 'save_action_plan',
    description: 'Salva um plano de ação para o aluno vinculado a um enrollment específico.',
    input_schema: {
      type: 'object' as const,
      properties: {
        enrollment_id: { type: 'string', description: 'ID do enrollment (user_programs.id) — use os IDs listados no contexto' },
        title:         { type: 'string', description: 'Título curto do plano' },
        content:       { type: 'string', description: 'Conteúdo do plano em markdown' },
      },
      required: ['enrollment_id', 'title', 'content'],
    },
  },
  {
    name: 'grant_tokens',
    description: 'Concede tokens ao aluno.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tokens:        { type: 'number', description: 'Quantidade de tokens a conceder (ex: 100000)' },
        validity_days: { type: 'number', description: 'Validade em dias (ex: 30, 90, 365)' },
        reason:        { type: 'string', description: 'Motivo da concessão (opcional)' },
        product_type:  { type: 'string', description: 'Tipo: manual_grant | bootcamp | mentoria | pack_starter | pack_pro' },
      },
      required: ['tokens', 'validity_days'],
    },
  },
  {
    name: 'enroll_in_program',
    description: 'Enrolla o aluno em um programa publicado. Use os IDs da lista de programas disponíveis no contexto.',
    input_schema: {
      type: 'object' as const,
      properties: {
        program_id: { type: 'string', description: 'ID do programa (programs.id)' },
      },
      required: ['program_id'],
    },
  },
  {
    name: 'change_role',
    description: 'Altera o papel/acesso do aluno na plataforma.',
    input_schema: {
      type: 'object' as const,
      properties: {
        role: {
          type: 'string',
          enum: ['pending', 'student', 'mentor', 'admin'],
          description: 'Novo papel: pending (sem acesso), student (acesso de aluno), mentor, admin',
        },
      },
      required: ['role'],
    },
  },
]

// ── Tool executor ─────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  save_action_plan: 'Salvando plano de ação',
  grant_tokens:     'Concedendo tokens',
  enroll_in_program:'Enrollando no programa',
  change_role:      'Alterando papel do aluno',
}

async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string,
  callerId: string,
  service: SupabaseClient,
): Promise<string> {
  try {
    if (toolName === 'save_action_plan') {
      const { enrollment_id, title, content } = input as { enrollment_id: string; title: string; content: string }
      const { error } = await service.from('action_notes').insert({
        user_id: userId,
        program_enrollment_id: enrollment_id,
        title,
        content,
        type: 'plan',
        checklist: [],
        completed: false,
      })
      if (error) return `Erro ao salvar plano: ${error.message}`
      await service.from('mentor_actions').insert({
        mentor_id: callerId, target_user_id: userId,
        action: 'action_plan_saved',
        metadata: { enrollment_id, title },
      })
      return `Plano "${title}" salvo com sucesso.`
    }

    if (toolName === 'grant_tokens') {
      const { tokens, validity_days, reason, product_type } = input as {
        tokens: number; validity_days: number; reason?: string; product_type?: string
      }
      const { error } = await service.from('token_balance').insert({
        user_id: userId,
        tokens_total: tokens,
        tokens_used: 0,
        expires_at: new Date(Date.now() + validity_days * 86_400_000).toISOString(),
        product_type: product_type ?? 'manual_grant',
        source_payment_id: `manual_${callerId}_${Date.now()}`,
        is_active: true,
      })
      if (error) return `Erro ao conceder tokens: ${error.message}`
      await service.from('mentor_actions').insert({
        mentor_id: callerId, target_user_id: userId,
        action: 'token_grant',
        metadata: { tokens, validity_days, reason: reason ?? null, product_type: product_type ?? 'manual_grant' },
      })
      return `${tokens.toLocaleString()} tokens concedidos com validade de ${validity_days} dias.`
    }

    if (toolName === 'enroll_in_program') {
      const { program_id } = input as { program_id: string }
      const { data: program } = await service.from('programs').select('id, name').eq('id', program_id).eq('is_published', true).single()
      if (!program) return 'Programa não encontrado ou não publicado.'

      const { data: existing } = await service.from('user_programs')
        .select('id, status').eq('user_id', userId).eq('program_id', program_id).single()

      if (existing?.status === 'active') return `Aluno já está enrollado em "${program.name}".`

      if (existing) {
        await service.from('user_programs').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', existing.id)
      } else {
        await service.from('user_programs').insert({
          user_id: userId, program_id, status: 'active', started_at: new Date().toISOString(),
        })
      }
      await service.from('mentor_actions').insert({
        mentor_id: callerId, target_user_id: userId,
        action: 'enrollment',
        metadata: { program_id, program_name: program.name },
      })
      return `Aluno enrollado em "${program.name}" com sucesso.`
    }

    if (toolName === 'change_role') {
      const { role } = input as { role: string }
      const validRoles = ['pending', 'student', 'mentor', 'admin']
      if (!validRoles.includes(role)) return `Papel inválido: ${role}`
      const { error } = await service.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId)
      if (error) return `Erro ao alterar papel: ${error.message}`
      await service.from('mentor_actions').insert({
        mentor_id: callerId, target_user_id: userId,
        action: 'role_change',
        metadata: { role },
      })
      return `Papel do aluno alterado para "${role}".`
    }

    return `Tool desconhecida: ${toolName}`
  } catch (err) {
    return `Erro inesperado: ${String(err)}`
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildStudentSystemPrompt(student: Record<string, unknown>): string {
  const p  = student.profile  as Record<string, unknown> | null
  const c  = student.candidate as Record<string, unknown> | null
  const days = (student.days as { status: string; day_number: number }[]) ?? []
  const jobs = (student.jobs as { status: string; role_title: string; company_name: string; fit_score: number | null }[]) ?? []
  const enrollments = (student.enrollments as { id: string; status: string; program: { id: string; name: string; total_days: number } }[]) ?? []
  const availablePrograms = (student.availablePrograms as { id: string; name: string }[]) ?? []
  const balances = (student.tokenBalances as { is_active: boolean; tokens_total: number; tokens_used: number }[]) ?? []
  const interviewPrep = student.interviewPrep as Record<string, unknown> | null

  const completedDays = days.filter(d => d.status === 'done').length
  const tokensTotal   = balances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_total, 0)
  const tokensUsed    = balances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_used, 0)
  const tokensLeft    = tokensTotal - tokensUsed
  const applied       = jobs.filter(j => ['applied', 'interviewing', 'offer'].includes(j.status)).length
  const interviews    = jobs.filter(j => ['interviewing', 'offer'].includes(j.status)).length

  return `Você é um analista de carreira da TNG com poderes de ação. Você pode analisar o aluno E executar ações diretamente (salvar planos, conceder tokens, enrollar em programas, alterar papel).

Seja direto e específico. Baseie suas respostas nos dados abaixo. Quando executar uma ação, confirme o que foi feito.

---

## Aluno

- **Nome:** ${p?.full_name ?? 'Sem nome'}
- **Papel atual:** ${p?.role ?? '—'}
- **Cadastro:** ${p?.created_at ? new Date(p.created_at as string).toLocaleDateString('pt-BR') : '—'}

## Enrollments do aluno (use estes IDs para save_action_plan)

${enrollments.length === 0 ? '- Nenhum enrollment encontrado.' : enrollments.map(e =>
  `- ID: ${e.id} | Programa: ${e.program.name} | Status: ${e.status} | ${completedDays}/${e.program.total_days} dias`
).join('\n')}

## Programas disponíveis para enrollment (use estes IDs para enroll_in_program)

${availablePrograms.length === 0 ? '- Nenhum programa publicado.' : availablePrograms.map(p =>
  `- ID: ${p.id} | Nome: ${p.name}`
).join('\n')}

## Perfil candidato

${!c ? '- Perfil não criado ainda.' : `
- **Cargo alvo:** ${c.target_role ?? '—'}
- **Senioridade:** ${c.seniority ?? '—'} · ${c.years_experience ?? '—'} anos de experiência
- **Stack:** ${(c.tech_stack as string[] | null)?.join(', ') ?? '—'}
- **Preferência:** ${c.work_preference ?? '—'} · ${(c.target_regions as string[] | null)?.join(', ') ?? '—'}
- **Proposta de valor:** ${c.value_proposition ?? 'Não definida'}
`.trim()}

## Progresso

- ${completedDays} dias concluídos
- Dias em progresso: ${days.filter(d => d.status === 'in_progress').length}

## Pipeline de vagas

- Total analisadas: ${jobs.length} | Candidaturas: ${applied} | Entrevistas: ${interviews}
- Taxa de resposta: ${applied > 0 ? Math.round((interviews / applied) * 100) : 0}%

## Tokens

- Restantes: ${tokensLeft.toLocaleString()} de ${tokensTotal.toLocaleString()}
- Consumido: ${tokensTotal > 0 ? Math.round((tokensUsed / tokensTotal) * 100) : 0}%

## Preparação para entrevistas

${interviewPrep?.star_stories && Array.isArray(interviewPrep.star_stories) && interviewPrep.star_stories.length > 0
  ? `- ${interviewPrep.star_stories.length} STAR stories: ${(interviewPrep.star_stories as { title: string }[]).map(s => s.title).join(', ')}`
  : '- Nenhuma STAR story registrada.'}
`
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function getCallerOrNull(supabase: Awaited<ReturnType<typeof createServerClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) return null
  return user
}

// ── GET — load session ────────────────────────────────────────────────────────

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

// ── POST — chat with tool use ─────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const caller = await getCallerOrNull(supabase)
  if (!caller) return new Response('Unauthorized', { status: 401 })

  const { userId, messages, sessionId } = await req.json()
  if (!userId || !messages) {
    return Response.json({ error: 'missing_params' }, { status: 400 })
  }

  const service = createServiceClient()

  const [profileRes, candidateRes, daysRes, jobsRes, balancesRes, interviewRes, enrollmentsRes, programsRes] =
    await Promise.all([
      service.from('profiles').select('id, full_name, role, created_at').eq('id', userId).single(),
      service.from('candidate_profiles').select('*').eq('user_id', userId).single(),
      service.from('day_activities').select('day_number, status').eq('user_id', userId),
      service.from('jobs').select('id, role_title, company_name, status, fit_score').eq('user_id', userId),
      service.from('token_balance').select('tokens_total, tokens_used, is_active').eq('user_id', userId).eq('is_active', true),
      service.from('interview_prep').select('star_stories, technical_gaps').eq('user_id', userId).single(),
      service.from('user_programs').select('id, status, program:programs(id, name, total_days)').eq('user_id', userId),
      service.from('programs').select('id, name').eq('is_published', true).order('name'),
    ])

  const student = {
    profile:           profileRes.data,
    candidate:         candidateRes.data ?? null,
    days:              daysRes.data ?? [],
    jobs:              jobsRes.data ?? [],
    tokenBalances:     balancesRes.data ?? [],
    interviewPrep:     interviewRes.data ?? null,
    enrollments:       enrollmentsRes.data ?? [],
    availablePrograms: programsRes.data ?? [],
  }

  const systemPrompt = buildStudentSystemPrompt(student as Record<string, unknown>)
  const anthropic = new Anthropic()
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

      let currentMessages: Anthropic.MessageParam[] = messages
      let sessionSaved = false
      let assistantContent = ''
      let totalInputTokens  = 0
      let totalOutputTokens = 0

      try {
        // Agentic loop — continues until no more tool calls
        while (true) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            system: systemPrompt,
            tools: MENTOR_TOOLS,
            messages: currentMessages,
          })

          totalInputTokens  += response.usage.input_tokens
          totalOutputTokens += response.usage.output_tokens

          // Stream any text content
          for (const block of response.content) {
            if (block.type === 'text') {
              assistantContent += block.text
              // Stream word by word for a smoother feel
              send({ text: block.text })
            }
          }

          // Append assistant turn to message history
          currentMessages = [...currentMessages, { role: 'assistant', content: response.content }]

          // No tool calls — done
          if (response.stop_reason !== 'tool_use') break

          // Execute tool calls
          const toolResults: Anthropic.ToolResultBlockParam[] = []
          for (const block of response.content) {
            if (block.type !== 'tool_use') continue

            send({ tool: block.name, status: 'running', label: TOOL_LABELS[block.name] ?? block.name })

            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>,
              userId,
              caller.id,
              service,
            )

            send({ tool: block.name, status: 'done', result })
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
          }

          currentMessages = [...currentMessages, { role: 'user', content: toolResults }]
        }

        await recordTokenUsage(
          caller.id,
          totalInputTokens + totalOutputTokens,
          'mentor_student_chat',
          { student_user_id: userId },
          'claude-sonnet-4-6',
          totalInputTokens,
          totalOutputTokens,
        )

        // Persist session
        const finalMessages = [...messages, { role: 'assistant', content: assistantContent }]

        if (sessionId) {
          await service.from('chat_sessions')
            .update({ messages: finalMessages, updated_at: new Date().toISOString() })
            .eq('id', sessionId)
        } else if (!sessionSaved) {
          sessionSaved = true
          const { data: newSession } = await service.from('chat_sessions').insert({
            user_id: caller.id,
            target_user_id: userId,
            mode: 'mentor',
            title: `Chat — ${profileRes.data?.full_name ?? userId}`,
            messages: finalMessages,
          }).select('id').single()

          if (newSession) send({ sessionId: newSession.id })
        }
      } catch (err) {
        console.error('[mentor/student-chat] error', err)
      } finally {
        send({ done: true })
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
