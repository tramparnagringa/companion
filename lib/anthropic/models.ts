export const AI_MODELS = {
  DEFAULT:  'claude-sonnet-4-6',
  CHAT_DAY: 'claude-haiku-4-5-20251001',
} as const

export const MAX_TOKENS = {
  CHAT_STANDARD:    1200,
  CHAT_CV:          2048,
  JOB_ANALYSIS:     1024,
  INTERVIEW_PREP:   2048,
  MENTOR_CHAT:      1024,
  MENTOR_STUDENT:   2048,
  ARENA_SESSION:    512,
  ARENA_DEBRIEF:    4096,
  PROGRAM_DAY:      1024,
  PROGRAM_GENERATE: 8000,
} as const
