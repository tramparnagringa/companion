/**
 * Seed script — inserts the TNG Bootcamp as the default program in the DB.
 *
 * Run AFTER applying migration 007_programs.sql and BEFORE 008_backfill_enrollments.sql:
 *   npx tsx supabase/seed-bootcamp.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ── Inline imports from lib/ (avoids path alias issues in seed context) ─────
// We import the raw data here. If the files move, update accordingly.
import { DAYS, WEEK_THEMES } from '../lib/days'
import { DAY_INSTRUCTIONS, getDayModelConfig } from '../lib/anthropic/system-prompts'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seed() {
  console.log('Seeding TNG Bootcamp program...')

  // ── 1. Upsert the program ──────────────────────────────────────────────────
  const { data: program, error: programError } = await supabase
    .from('programs')
    .upsert(
      {
        slug: 'tng-bootcamp',
        name: 'Bootcamp Trampar na Gringa',
        description: 'O programa completo de 30 dias para profissionais brasileiros conquistarem vagas internacionais.',
        total_days: 30,
        week_themes: WEEK_THEMES,
        is_published: true,
        created_by: null,
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (programError || !program) {
    console.error('Failed to upsert program:', programError)
    process.exit(1)
  }

  console.log(`Program upserted: ${program.id}`)

  // ── 2. Upsert program_days ─────────────────────────────────────────────────
  const programDays = DAYS.map((day) => {
    const modelConfig = getDayModelConfig('task', day.number)
    return {
      program_id: program.id,
      day_number: day.number,
      week_number: day.week,
      name: day.name,
      description: day.description,
      cards: day.cards,
      ai_instructions: DAY_INSTRUCTIONS[day.number] ?? null,
      ai_model: modelConfig.model,
      ai_max_tokens: modelConfig.max_tokens,
    }
  })

  const { error: daysError } = await supabase
    .from('program_days')
    .upsert(programDays, { onConflict: 'program_id,day_number' })

  if (daysError) {
    console.error('Failed to upsert program_days:', daysError)
    process.exit(1)
  }

  console.log(`Seeded ${programDays.length} program days.`)
  console.log('Done. Run migration 008_backfill_enrollments.sql next.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
