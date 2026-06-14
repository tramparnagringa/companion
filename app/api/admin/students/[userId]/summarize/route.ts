import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { anthropic } from '@/lib/anthropic/client'
import { sessionSummaryPrompt, contextUpdatePrompt } from '@/lib/anthropic/summarize-prompts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: caller } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params
  const service = createServiceClient()

  // Find sessions needing summarization (oldest first so context accumulates correctly)
  const { data: sessions } = await service
    .from('chat_sessions')
    .select('id, messages, summarized_at, updated_at')
    .eq('user_id', userId)
    .not('messages', 'eq', '[]')
    .order('created_at', { ascending: true })

  if (!sessions?.length) return NextResponse.json({ ok: true, sessionsProcessed: 0 })

  const pending = sessions.filter(s =>
    !s.summarized_at || new Date(s.summarized_at) < new Date(s.updated_at ?? 0)
  )

  if (!pending.length) return NextResponse.json({ ok: true, sessionsProcessed: 0 })

  // Fetch program info for this student (separate queries — no JOIN type issues)
  const enrollmentRes = await service
    .from('user_programs')
    .select('program_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  let programName = 'programa de carreira'
  let totalDays = 30
  if (enrollmentRes.data?.program_id) {
    const programRes = await service
      .from('programs')
      .select('name, total_days')
      .eq('id', enrollmentRes.data.program_id)
      .single()
    if (programRes.data) {
      programName = programRes.data.name
      totalDays = programRes.data.total_days
    }
  }

  // Fetch current context once — will update it after each session
  const profileRes = await service
    .from('candidate_profiles')
    .select('conversation_context')
    .eq('user_id', userId)
    .maybeSingle()

  let currentContext: string | null = profileRes.data?.conversation_context ?? null

  let processed = 0

  for (const session of pending) {
    const messages = (session.messages ?? []) as Array<{ role: string; content: unknown }>

    const conversationText = messages
      .filter(m => typeof m.content === 'string' && (m.content as string).trim())
      .map(m => `${m.role === 'user' ? 'Aluno' : 'IA'}: ${m.content}`)
      .join('\n\n')

    if (!conversationText.trim()) continue

    try {
      // Step 1: summarize this session
      const summaryResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [{ role: 'user', content: sessionSummaryPrompt(conversationText) }],
      })

      const summary = summaryResponse.content[0].type === 'text'
        ? summaryResponse.content[0].text
        : ''

      if (!summary) continue

      // Step 2: update rolling context
      const contextResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: contextUpdatePrompt(programName, totalDays, currentContext, summary) }],
      })

      const newContext = contextResponse.content[0].type === 'text'
        ? contextResponse.content[0].text
        : currentContext ?? ''

      // Save session summary + snapshot
      await service
        .from('chat_sessions')
        .update({ summary, context_snapshot: newContext, summarized_at: new Date().toISOString() })
        .eq('id', session.id)

      // Upsert rolling context (update if exists, insert if not)
      await service
        .from('candidate_profiles')
        .upsert(
          { user_id: userId, conversation_context: newContext, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )

      currentContext = newContext
      processed++
    } catch {
      // Continue with remaining sessions even if one fails
    }
  }

  return NextResponse.json({ ok: true, sessionsProcessed: processed })
}
