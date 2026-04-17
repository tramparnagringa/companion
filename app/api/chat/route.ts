import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkTokenBalance, recordTokenUsage } from '@/lib/anthropic/check-tokens'
import { buildSystemPrompt, getDayModelConfig } from '@/lib/anthropic/system-prompts'
import { ALL_TOOLS } from '@/lib/anthropic/tools'
import { executeToolCall } from '@/lib/anthropic/tool-executor'
import { TOKEN_COSTS } from '@/lib/tokens'
import { getActiveEnrollment, getDayForUser, getEnrollmentBySlug, getProgramDay } from '@/lib/programs'

export async function POST(req: Request) {
  let supabase: Awaited<ReturnType<typeof createServerClient>>
  let userId: string
  let messages: Anthropic.MessageParam[]
  let mode: 'task' | 'mentor' | 'cv'
  let dayNumber: number | undefined
  let sessionId: string | undefined
  let slug: string | undefined

  try {
    supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })
    userId = user.id

    const body = await req.json()
    messages  = body.messages
    mode      = body.mode === 'mentor' ? 'mentor' : body.mode === 'cv' ? 'cv' : 'task'
    dayNumber = body.dayNumber
    slug      = body.slug as string | undefined
    sessionId = body.sessionId as string | undefined

    const cost = mode === 'mentor' ? TOKEN_COSTS.mentor_message : TOKEN_COSTS.cv_rewrite ?? TOKEN_COSTS.chat_message
    const { allowed } = await checkTokenBalance(userId, cost)
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

  const [{ data: candidateProfile }, programDay] = await Promise.all([
    supabase!.from('candidate_profiles').select('*').eq('user_id', userId!).single(),
    mode === 'task' && dayNumber !== undefined && enrollment
      ? getProgramDay(enrollment.program_id, dayNumber, supabase!)
      : mode === 'task' && dayNumber !== undefined
        ? getDayForUser(userId!, dayNumber, supabase!)
        : Promise.resolve(null),
  ])

  const systemPrompt = buildSystemPrompt(mode!, dayNumber, candidateProfile, programDay?.ai_instructions)
  const { model: dayModel, max_tokens: dayMaxTokens } = programDay
    ? { model: programDay.ai_model, max_tokens: programDay.ai_max_tokens }
    : getDayModelConfig(mode!, dayNumber)

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
            const result = await executeToolCall(toolBlock, userId!, supabase!, sessionId, enrollment?.id)
            if (!cancelled) controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'tool_result', tool: toolBlock.name })}\n\n`)
            )
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

        const interactionType = mode === 'mentor' ? 'mentor' : mode === 'cv' ? 'cv_rewrite' : 'chat'
        await recordTokenUsage(
          userId!,
          totalInputTokens + totalOutputTokens,
          interactionType,
          { day_number: dayNumber },
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
