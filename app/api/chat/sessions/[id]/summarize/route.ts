import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { anthropic } from '@/lib/anthropic/client'
import { sessionSummaryPrompt, contextUpdatePrompt } from '@/lib/anthropic/summarize-prompts'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  // Check if caller is mentor/admin (can summarize any session)
  const { data: callerProfile } = await service
    .from('profiles').select('role').eq('id', user.id).single()
  const isMentorOrAdmin = ['mentor', 'admin'].includes(callerProfile?.role ?? '')

  // Fetch session
  const { data: session } = await service
    .from('chat_sessions')
    .select('id, user_id, messages, summarized_at, updated_at')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isMentorOrAdmin && session.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = (session.messages ?? []) as Array<{ role: string; content: unknown }>
  if (messages.length === 0) return NextResponse.json({ ok: true, skipped: true })

  // Skip if already summarized after last update
  if (
    session.summarized_at &&
    new Date(session.summarized_at) >= new Date(session.updated_at ?? 0)
  ) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const targetUserId = session.user_id

  // Fetch current context
  const profileRes = await service
    .from('candidate_profiles')
    .select('conversation_context')
    .eq('user_id', targetUserId)
    .maybeSingle()

  // Fetch active enrollment + program (separate queries to avoid join type issues)
  const enrollmentRes = await service
    .from('user_programs')
    .select('program_id')
    .eq('user_id', targetUserId)
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

  const currentContext = profileRes.data?.conversation_context ?? null

  // Build conversation text for summarization
  const conversationText = messages
    .filter(m => typeof m.content === 'string' && (m.content as string).trim())
    .map(m => `${m.role === 'user' ? 'Aluno' : 'IA'}: ${m.content}`)
    .join('\n\n')

  if (!conversationText.trim()) return NextResponse.json({ ok: true, skipped: true })

  // Step 1: summarize this session
  const summaryResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: sessionSummaryPrompt(conversationText) }],
  })

  const summary = summaryResponse.content[0].type === 'text'
    ? summaryResponse.content[0].text
    : ''

  if (!summary) return NextResponse.json({ ok: true, skipped: true })

  // Step 2: update rolling context
  const contextResponse = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: contextUpdatePrompt(programName, totalDays, currentContext, summary) }],
  })

  const newContext = contextResponse.content[0].type === 'text'
    ? contextResponse.content[0].text
    : currentContext ?? ''

  // Save everything
  await Promise.all([
    service
      .from('chat_sessions')
      .update({ summary, context_snapshot: newContext, summarized_at: new Date().toISOString() })
      .eq('id', sessionId),
    service
      .from('candidate_profiles')
      .upsert(
        { user_id: targetUserId, conversation_context: newContext, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      ),
  ])

  return NextResponse.json({ ok: true })
}
