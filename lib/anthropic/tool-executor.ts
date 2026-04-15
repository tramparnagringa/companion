/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js'
import type Anthropic from '@anthropic-ai/sdk'
import type { Database } from '@/types/database'

export async function executeToolCall(
  block: Anthropic.ToolUseBlock,
  userId: string,
  supabase: SupabaseClient<Database>,
  sessionId?: string
) {
  const input = block.input as Record<string, unknown>

  switch (block.name) {
    case 'get_profile': {
      const [{ data, error }, { data: profileRow }] = await Promise.all([
        supabase.from('candidate_profiles').select('*').eq('user_id', userId).single(),
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
      ])
      if (error && error.code !== 'PGRST116') console.error('[tool:get_profile]', error)
      return data
        ? { ...data, full_name: profileRow?.full_name ?? null }
        : { user_id: userId, full_name: profileRow?.full_name ?? null, message: 'No profile yet' }
    }

    case 'update_profile': {
      const fields = input.fields as Record<string, unknown>
      const { full_name, ...candidateFields } = fields

      // Save full_name to profiles table if provided
      if (full_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: full_name as string, updated_at: new Date().toISOString() })
          .eq('id', userId)
        if (profileError) console.error('[tool:update_profile/full_name]', profileError)
      }

      const { data, error } = await supabase
        .from('candidate_profiles')
        .upsert({ user_id: userId, ...candidateFields, updated_at: new Date().toISOString() } as any, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) {
        console.error('[tool:update_profile]', error)
        return { error: error.message }
      }
      return data
    }

    case 'add_keywords': {
      const keywords = input.keywords as string[]
      const sourceJobId = input.source_job_id as string | undefined

      for (const word of keywords) {
        const { data: existing } = await supabase
          .from('keywords')
          .select('id, frequency')
          .eq('user_id', userId)
          .eq('word', word.toLowerCase())
          .maybeSingle()

        if (existing) {
          await supabase
            .from('keywords')
            .update({ frequency: (existing.frequency ?? 1) + 1 })
            .eq('id', existing.id)
        } else {
          const { error } = await supabase.from('keywords').insert({
            user_id: userId,
            word: word.toLowerCase(),
            frequency: 1,
            source_job_id: sourceJobId ?? null,
          })
          if (error) console.error('[tool:add_keywords]', word, error)
        }
      }
      return { added: keywords.length }
    }

    case 'create_job': {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          user_id: userId,
          company_name: input.company_name as string,
          role_title:   input.role_title as string,
          job_description:      (input.job_description as string | undefined)      ?? null,
          source_url:           (input.source_url as string | undefined)           ?? null,
          status:               (input.status as any)                              ?? 'to_analyse',
          fit_score:            (input.fit_score as number | undefined)            ?? null,
          strong_keywords:      (input.strong_keywords as string[] | undefined)    ?? null,
          weak_keywords:        (input.weak_keywords as string[] | undefined)      ?? null,
          apply_recommendation: (input.apply_recommendation as boolean | undefined) ?? null,
          analysis_notes:       (input.analysis_notes as string | undefined)       ?? null,
        })
        .select()
        .single()
      if (error) {
        console.error('[tool:create_job]', error)
        return { error: error.message }
      }
      return data
    }

    case 'update_job_status': {
      const { data, error } = await supabase
        .from('jobs')
        .update({
          status:     input.status as any,
          applied_at: input.applied_at as string | undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.job_id as string)
        .eq('user_id', userId)
        .select()
        .single()
      if (error) {
        console.error('[tool:update_job_status]', error)
        return { error: error.message }
      }
      return data
    }

    case 'get_jobs': {
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit((input.limit as number) ?? 10)

      if (input.status) {
        query = query.eq('status', input.status as any)
      }

      const { data, error } = await query
      if (error) console.error('[tool:get_jobs]', error)
      return data ?? []
    }

    case 'save_cv_bullets': {
      const { data: activeCV, error: cvError } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cvError || !activeCV) return { error: 'No active CV found' }

      const content = activeCV.content as Record<string, unknown>
      const experience = (content.experience as Record<string, unknown>[]) ?? []
      const idx = input.experience_index as number

      if (experience[idx]) {
        experience[idx].bullets = input.bullets
      }

      const updatedContent = { ...content, experience } as any

      const { error } = await supabase
        .from('cv_versions')
        .update({ content: updatedContent })
        .eq('id', activeCV.id)
      if (error) { console.error('[tool:save_cv_bullets]', error); return { error: error.message } }
      return { updated: true }
    }

    case 'get_cv_draft': {
      const { data, error } = await supabase
        .from('cv_versions')
        .select('content')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) return { error: error.message }
      if (!data) return { error: 'No active CV found' }
      return data.content
    }

    case 'update_cv_section': {
      const { data: activeCV, error: cvError } = await supabase
        .from('cv_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cvError || !activeCV) return { error: 'No active CV found' }

      const content = (activeCV.content ?? {}) as Record<string, unknown>
      const section = input.section as string

      let updatedSection: unknown

      if (section === 'experience' && input.experience_index !== undefined && input.bullets) {
        // Targeted bullet update for a specific experience entry
        const experience = ((content.experience ?? []) as Record<string, unknown>[])
        const idx = input.experience_index as number
        if (experience[idx]) {
          experience[idx] = { ...experience[idx], bullets: input.bullets }
        }
        updatedSection = experience
      } else if (section === 'summary') {
        if (Array.isArray(input.patch)) {
          updatedSection = input.patch
        } else if (typeof input.patch === 'string') {
          try {
            const parsed = JSON.parse(input.patch)
            updatedSection = Array.isArray(parsed) ? parsed : [input.patch]
          } catch {
            updatedSection = [input.patch]
          }
        } else {
          updatedSection = input.patch
        }
      } else {
        // Deep merge patch into existing section
        // Normalise patch: the AI may send a JSON-encoded string instead of a parsed value
        let patch = input.patch
        if (typeof patch === 'string' && (patch.trim().startsWith('[') || patch.trim().startsWith('{'))) {
          try { patch = JSON.parse(patch) } catch { /* use raw string */ }
        }
        const existing = content[section]
        if (Array.isArray(existing) && Array.isArray(patch)) {
          updatedSection = patch
        } else if (existing && typeof existing === 'object' && !Array.isArray(existing) &&
                   patch && typeof patch === 'object' && !Array.isArray(patch)) {
          updatedSection = { ...(existing as object), ...(patch as object) }
        } else {
          updatedSection = patch
        }
      }

      const updatedContent = { ...content, [section]: updatedSection }

      const { error: updateError } = await supabase
        .from('cv_versions')
        .update({ content: updatedContent as any })
        .eq('id', activeCV.id)

      if (updateError) {
        console.error('[tool:update_cv_section]', updateError)
        return { error: updateError.message }
      }
      return { updated: true, section }
    }

    case 'save_linkedin_content': {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .upsert({
          user_id:           userId,
          linkedin_headline: input.headline as string | undefined,
          linkedin_about:    input.about    as string | undefined,
          updated_at:        new Date().toISOString(),
        } as any, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) {
        console.error('[tool:save_linkedin_content]', error)
        return { error: error.message }
      }
      return data
    }

    case 'save_contact': {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: userId,
          name:    input.name    as string,
          company: input.company as string,
          role:              (input.role as string | undefined)             ?? null,
          linkedin_url:      (input.linkedin_url as string | undefined)    ?? null,
          outreach_message:  (input.outreach_message as string | undefined) ?? null,
          follow_up_due_at:  (input.follow_up_due_at as string | undefined) ?? null,
          related_job_id:    (input.related_job_id as string | undefined)  ?? null,
        })
        .select()
        .single()
      if (error) {
        console.error('[tool:save_contact]', error)
        return { error: error.message }
      }
      return data
    }

    case 'get_day_context': {
      const { data, error } = await supabase
        .from('day_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('day_number', input.day_number as number)
        .single()
      if (error && error.code !== 'PGRST116') console.error('[tool:get_day_context]', error)
      return data ?? { message: 'No activity for this day yet' }
    }

    case 'save_day_output': {
      const { data, error } = await supabase
        .from('day_activities')
        .upsert({
          user_id:    userId,
          day_number: input.day_number as number,
          outputs:    input.outputs   as any,
          status:     input.status    as any,
          completed_at: input.status === 'done' ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,day_number' })
        .select()
        .single()
      if (error) {
        console.error('[tool:save_day_output]', error)
        return { error: error.message }
      }
      return data
    }

    case 'save_star_story': {
      const { data: existing } = await supabase
        .from('interview_prep')
        .select('id, star_stories')
        .eq('user_id', userId)
        .maybeSingle()

      const stories = ((existing?.star_stories ?? []) as any[]).concat([input])

      const { data, error } = await supabase
        .from('interview_prep')
        .upsert({
          user_id:     userId,
          star_stories: stories as any,
        } as any, { onConflict: 'user_id' })
        .select()
        .single()
      if (error) {
        console.error('[tool:save_star_story]', error)
        return { error: error.message }
      }
      return data
    }

    case 'get_application_stats': {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('status')
        .eq('user_id', userId)

      if (error) console.error('[tool:get_application_stats]', error)
      if (!jobs) return {}

      const total      = jobs.length
      const applied    = jobs.filter(j => j.status === 'applied').length
      const interviews = jobs.filter(j => j.status === 'interviewing').length
      const offers     = jobs.filter(j => j.status === 'offer').length

      return {
        total,
        applied,
        interviews,
        offers,
        response_rate: applied > 0 ? Math.round((interviews / applied) * 100) : 0,
      }
    }

    case 'save_action_note': {
      const rawChecklist = (input.checklist as Array<{ label: string }> | undefined) ?? []
      const checklist = rawChecklist.map(item => ({
        id: crypto.randomUUID(),
        label: item.label,
        done: false,
      }))

      const { data, error } = await supabase
        .from('action_notes' as any)
        .insert({
          user_id:    userId,
          session_id: sessionId ?? null,
          title:      input.title      as string,
          content:    input.content    as string,
          type:       (input.type      as string) ?? 'note',
          day_number: (input.day_number as number | undefined) ?? null,
          checklist,
        })
        .select()
        .single()
      if (error) {
        console.error('[tool:save_action_note]', error)
        return { error: error.message }
      }
      return data
    }

    default:
      return { error: `Unknown tool: ${block.name}` }
  }
}
