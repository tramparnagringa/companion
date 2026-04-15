export interface CVBullet {
  text: string
  ai_generated: boolean
}

export interface CVExperience {
  role: string
  company: string
  location?: string
  period: string
  bullets: CVBullet[]
}

export interface CVSkillCategory {
  area: string
  items: string[]
}

export interface CVContent {
  personal: {
    full_name: string
    position: string
    location: string
    email: string
    phone: string
    linkedin: string
    github?: string
    website?: string
  }
  summary: string[]
  skills: {
    primary: CVSkillCategory
    adjacent: CVSkillCategory[]
  }
  experience: CVExperience[]
  education: Array<{ degree: string; institution: string; year: string }>
  optional?: {
    languages?: Array<{ name: string; level: string }>
    projects?: Array<{ name: string; url?: string; description: string }>
    awards?: string[]
  }
}

export const EMPTY_CV: CVContent = {
  personal: {
    full_name: '',
    position: '',
    location: '',
    email: '',
    phone: '',
    linkedin: '',
  },
  summary: [''],
  skills: {
    primary: { area: 'Technical Skills', items: [] },
    adjacent: [],
  },
  experience: [],
  education: [],
}
