import type Anthropic from '@anthropic-ai/sdk'

export const ALL_TOOLS: Anthropic.Tool[] = [
  // ── PROFILE ──
  {
    name: 'get_profile',
    description: 'Fetches the full candidate profile. Call at the start of every conversation.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'update_profile',
    description: 'Updates fields in the candidate profile. Only use the exact field names listed below — do not invent new ones.',
    input_schema: {
      type: 'object',
      properties: {
        fields: {
          type: 'object',
          description: 'Fields to update. Use only these exact keys:',
          properties: {
            full_name:                      { type: 'string',  description: 'Candidate full name — extract from CV header or LinkedIn on Day 1' },
            extracted_profile:              { type: 'string',  description: 'Raw CV analysis output from Day 1' },
            target_role:                    { type: 'string',  description: 'e.g. "Senior Product Manager"' },
            seniority:                      { type: 'string',  description: 'e.g. "Senior", "Mid", "Lead"' },
            years_experience:               { type: 'number',  description: 'Total years of professional experience' },
            tech_stack:                     { type: 'array',   items: { type: 'string' }, description: 'e.g. ["React","Node.js","AWS"]' },
            target_regions:                 { type: 'array',   items: { type: 'string' }, description: 'e.g. ["EU","UK","Canada"]' },
            work_preference:                { type: 'string',  enum: ['remote','relocation','both'] },
            target_sectors:                 { type: 'array',   items: { type: 'string' }, description: 'e.g. ["Fintech","SaaS","HealthTech"]' },
            value_proposition:              { type: 'string',  description: 'Core value proposition statement' },
            value_proposition_alternatives: { type: 'array',   items: { type: 'string' } },
            linkedin_headline:              { type: 'string' },
            linkedin_about:                 { type: 'string' },
            ai_fluency_statements:          { type: 'array',   items: { type: 'string' } },
            salary_min:                     { type: 'number',  description: 'Minimum acceptable salary (in salary_currency)' },
            salary_max:                     { type: 'number',  description: 'Maximum target salary' },
            salary_currency:                { type: 'string',  description: 'e.g. "USD", "EUR"' },
            negotiation_scripts:            { type: 'object',  description: '{ redirect, range, anchor }' },
          },
          additionalProperties: false,
        },
      },
      required: ['fields'],
    },
  },

  // ── KEYWORDS ──
  {
    name: 'add_keywords',
    description: 'Adds keywords to the candidate bank. Increments frequency if already present.',
    input_schema: {
      type: 'object',
      properties: {
        keywords: { type: 'array', items: { type: 'string' } },
        source_job_id: { type: 'string', description: 'Source job ID, if available.' },
      },
      required: ['keywords'],
    },
  },

  // ── JOBS ──
  {
    name: 'create_job',
    description: 'Creates a new entry in the Application Board after job analysis.',
    input_schema: {
      type: 'object',
      properties: {
        company_name:         { type: 'string' },
        role_title:           { type: 'string' },
        job_description:      { type: 'string' },
        source_url:           { type: 'string' },
        status:               { type: 'string', enum: ['to_analyse','analysing','applied','interviewing','offer','discarded'] },
        fit_score:            { type: 'number' },
        strong_keywords:      { type: 'array', items: { type: 'string' } },
        weak_keywords:        { type: 'array', items: { type: 'string' } },
        apply_recommendation: { type: 'boolean' },
        analysis_notes:       { type: 'string' },
      },
      required: ['company_name', 'role_title', 'status'],
    },
  },
  {
    name: 'update_job_status',
    description: 'Updates a job status on the board.',
    input_schema: {
      type: 'object',
      properties: {
        job_id:     { type: 'string' },
        status:     { type: 'string', enum: ['to_analyse','analysing','applied','interviewing','offer','discarded'] },
        applied_at: { type: 'string', description: 'ISO date string if status = applied' },
      },
      required: ['job_id', 'status'],
    },
  },
  {
    name: 'get_jobs',
    description: "Lists the candidate's jobs, optionally filtered by status.",
    input_schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        limit:  { type: 'number' },
      },
    },
  },

  // ── CV ──
  {
    name: 'save_cv_bullets',
    description: 'Saves rewritten bullet points for a work experience entry.',
    input_schema: {
      type: 'object',
      properties: {
        experience_index: { type: 'number' },
        bullets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text:         { type: 'string' },
              ai_generated: { type: 'boolean' },
            },
          },
        },
        create_new_version: { type: 'boolean' },
        version_name:       { type: 'string' },
      },
      required: ['experience_index', 'bullets'],
    },
  },
  {
    name: 'save_linkedin_content',
    description: 'Saves the LinkedIn headline and about section.',
    input_schema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        about:    { type: 'string' },
      },
    },
  },

  // ── CONTACTS ──
  {
    name: 'save_contact',
    description: 'Saves a recruiter or professional contacted during networking.',
    input_schema: {
      type: 'object',
      properties: {
        name:              { type: 'string' },
        role:              { type: 'string' },
        company:           { type: 'string' },
        linkedin_url:      { type: 'string' },
        outreach_message:  { type: 'string' },
        follow_up_due_at:  { type: 'string' },
        related_job_id:    { type: 'string' },
      },
      required: ['name', 'company'],
    },
  },

  // ── DAYS ──
  {
    name: 'get_day_context',
    description: 'Fetches what was done on a previous day.',
    input_schema: {
      type: 'object',
      properties: { day_number: { type: 'number' } },
      required: ['day_number'],
    },
  },
  {
    name: 'save_day_output',
    description: 'Saves the output generated on a given day.',
    input_schema: {
      type: 'object',
      properties: {
        day_number: { type: 'number' },
        outputs:    { type: 'object' },
        status:     { type: 'string', enum: ['in_progress', 'done'] },
      },
      required: ['day_number', 'status'],
    },
  },

  // ── INTERVIEW PREP ──
  {
    name: 'save_star_story',
    description: 'Saves a structured STAR story for interview preparation.',
    input_schema: {
      type: 'object',
      properties: {
        title:             { type: 'string' },
        situation:         { type: 'string' },
        task:              { type: 'string' },
        action:            { type: 'string' },
        result:            { type: 'string' },
        questions_covered: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'situation', 'task', 'action', 'result'],
    },
  },

  // ── ANALYTICS ──
  {
    name: 'get_application_stats',
    description: 'Returns application statistics: total count, response rate, most common stage.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },

  // ── NOTES / PLANS ──
  {
    name: 'save_action_note',
    description: `Saves a structured note, plan, or action items from the current conversation.

IMPORTANT — plan confirmation flow:
1. Present the plan to the user in the chat first.
2. Ask: "Esse plano faz sentido pra você? Quer ajustar algum passo antes de salvar?"
3. Incorporate any feedback.
4. Only then call save_action_note.

Use checklist for any type='plan' or type='action_items' — each step becomes a checkbox the user can tick in the Plans page.`,
    input_schema: {
      type: 'object',
      properties: {
        title:      { type: 'string', description: 'Short descriptive title for the note' },
        content:    { type: 'string', description: 'Full content in markdown (context, rationale, notes)' },
        type:       { type: 'string', enum: ['plan', 'note', 'summary', 'action_items'], description: '"plan" for step-by-step plans, "summary" for day summaries, "action_items" for to-do lists, "note" for general insights' },
        day_number: { type: 'number', description: 'Day number if this note is related to a specific bootcamp day' },
        checklist: {
          type: 'array',
          description: 'Ordered list of actionable steps. Required for type=plan and type=action_items.',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'Concise action step, e.g. "Atualizar headline do LinkedIn"' },
            },
            required: ['label'],
          },
        },
      },
      required: ['title', 'content', 'type'],
    },
  },
]
