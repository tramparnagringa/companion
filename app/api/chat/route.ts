import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkTokenBalance, recordTokenUsage } from '@/lib/anthropic/check-tokens'
import { buildSystemPrompt, type JobContext, type RecentContext } from '@/lib/anthropic/system-prompts'
import { ALL_TOOLS } from '@/lib/anthropic/tools'
import { executeToolCall } from '@/lib/anthropic/tool-executor'
import { getActiveEnrollment, getDayForUser, getEnrollmentBySlug, getProgramDay } from '@/lib/programs'
import { AI_MODELS, MAX_TOKENS } from '@/lib/anthropic/models'

export async function POST(req: Request) {
  let supabase: Awaited<ReturnType<typeof createServerClient>>
  let userId: string
  let messages: Anthropic.MessageParam[]
  let mode: 'task' | 'mentor' | 'cv' | 'reflect'
  let dayNumber: number | undefined
  let sessionId: string | undefined
  let slug: string | undefined
  let jobContext: JobContext | undefined

  try {
    supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })
    userId = user.id

    const body = await req.json()
    messages   = body.messages
    mode       = body.mode === 'mentor' ? 'mentor' : body.mode === 'cv' ? 'cv' : body.mode === 'reflect' ? 'reflect' : 'task'
    dayNumber  = body.dayNumber
    slug       = body.slug as string | undefined
    sessionId  = body.sessionId as string | undefined
    jobContext = body.jobContext as JobContext | undefined

    const { allowed } = await checkTokenBalance(userId)
    if (!allowed) {
      return Response.json({ error: 'token_limit_reached' }, { status: 402 })
    }
  } catch (err) {
    console.error('[chat/route] setup error', err)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }

  const enrollment = slug
    ? await getEnrollmentBySlug(userId!, slug, supabase!)
    : await getActiveEnrollment(userId!, supabase!)

  const [{ data: candidateProfile }, programDay, recentSessionsResult, recentNotesResult] = await Promise.all([
    supabase!.from('candidate_profiles').select('*').eq('user_id', userId!).single(),
    mode === 'task' && dayNumber !== undefined && enrollment
      ? getProgramDay(enrollment.program_id, dayNumber, supabase!)
      : mode === 'task' && dayNumber !== undefined
        ? getDayForUser(userId!, dayNumber, supabase!)
        : Promise.resolve(null),
    supabase!
      .from('chat_sessions' as any)
      .select('title, mode, day_number, updated_at')
      .eq('user_id', userId!)
      .not('title', 'is', null)
      .neq('title', 'Nova conversa')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase!
      .from('action_notes' as any)
      .select('title, content, type, completed, created_at')
      .eq('user_id', userId!)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const recentSessions = (recentSessionsResult.data ?? []) as unknown as RecentContext['recentSessions']
  const recentNotes    = (recentNotesResult.data    ?? []) as unknown as RecentContext['recentNotes']
  const recentContext: RecentContext | null =
    recentSessions.length > 0 || recentNotes.length > 0
      ? { recentSessions, recentNotes }
      : null

  const systemPrompt = buildSystemPrompt(mode!, dayNumber, candidateProfile, programDay?.ai_instructions, jobContext, recentContext)
  const dayModel     = AI_MODELS.CHAT_DAY
  const dayMaxTokens = mode === 'cv' ? MAX_TOKENS.CHAT_CV : MAX_TOKENS.CHAT_STANDARD

  const anthropic = new Anthropic()
  const encoder   = new TextEncoder()

  let cancelled = false

  const readable = new ReadableStream({
    cancel() { cancelled = true },
    async start(controller) {
      let totalInputTokens  = 0
      let totalOutputTokens = 0
      let currentMessages: Anthropic.MessageParam[] = messages!

      try {
        while (true) {
          if (cancelled) break
          const { model, max_tokens } = { model: dayModel, max_tokens: dayMaxTokens }

          const cachedTools = [
            ...ALL_TOOLS.slice(0, -1),
            { ...ALL_TOOLS[ALL_TOOLS.length - 1], cache_control: { type: 'ephemeral' as const } },
          ]

          const stream = anthropic.messages.stream({
            model,
            max_tokens,
            system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
            tools: cachedTools,
            messages: currentMessages,
          })

          for await (const event of stream) {
            if (event.type === 'message_start') {
              totalInputTokens += event.message.usage.input_tokens
            }
            if (event.type === 'message_delta') {
              totalOutputTokens = event.usage.output_tokens
            }
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              if (!cancelled) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
            }
          }

          const finalMsg       = await stream.finalMessage()
          const assistantContent = finalMsg.content
          const toolBlocks     = assistantContent.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
          )

          if (toolBlocks.length === 0) break

          const toolResults: Anthropic.ToolResultBlockParam[] = []

          for (const toolBlock of toolBlocks) {
            // Only scope the plan to an enrollment when the chat has explicit program context (slug).
            // Free Mentor IA chats (no slug) produce "general" plans with no enrollment.
            const enrollmentId = slug ? enrollment?.id : undefined
            const result = await executeToolCall(toolBlock, userId!, supabase!, sessionId, enrollmentId)
            if (!cancelled) {
              const extra: Record<string, unknown> = {}
              if (toolBlock.name === 'save_action_note' && result && typeof result === 'object') {
                extra.title = (result as Record<string, unknown>).title ?? null
              }
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', tool: toolBlock.name, ...extra })}\n\n`)
              )
            }
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolBlock.id,
              content: JSON.stringify(result ?? {}),
            })
          }

          currentMessages = [
            ...currentMessages,
            { role: 'assistant', content: assistantContent },
            { role: 'user',      content: toolResults },
          ]
        }

        const interactionType = mode === 'mentor' ? 'mentor' : mode === 'cv' ? 'cv_rewrite' : mode === 'reflect' ? 'reflect' : dayNumber !== undefined ? 'day_activity' : 'chat'
        await recordTokenUsage(
          userId!,
          totalInputTokens + totalOutputTokens,
          interactionType,
          {
            day_number:  dayNumber       ?? null,
            program_id:  enrollment?.program_id   ?? null,
            enrollment_id: enrollment?.id ?? null,
          },
          dayModel,
          totalInputTokens,
          totalOutputTokens
        )

        if (!cancelled) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } catch (err) {
        console.error('[chat/route] stream error', err)
        if (!cancelled) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`))
          controller.close()
        }
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
