// Auto-generate with: npx supabase gen types typescript --local > types/database.ts
// Placeholder — replace after running Supabase migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Relationships: []
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'bootcamp' | 'mentoria' | 'mentor' | 'admin'
          abacatepay_customer_id: string | null
          abacatepay_subscription_id: string | null
          abacatepay_billing_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'bootcamp' | 'mentoria' | 'mentor' | 'admin'
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          abacatepay_billing_id?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'bootcamp' | 'mentoria' | 'mentor' | 'admin'
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          abacatepay_billing_id?: string | null
          updated_at?: string
        }
      }
      candidate_profiles: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          extracted_profile: string | null
          target_role: string | null
          seniority: string | null
          years_experience: number | null
          tech_stack: string[] | null
          target_regions: string[] | null
          work_preference: 'remote' | 'relocation' | 'both' | null
          target_sectors: string[] | null
          value_proposition: string | null
          value_proposition_alternatives: string[] | null
          linkedin_headline: string | null
          linkedin_about: string | null
          ai_fluency_statements: string[] | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string
          negotiation_scripts: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          extracted_profile?: string | null
          target_role?: string | null
          seniority?: string | null
          years_experience?: number | null
          tech_stack?: string[] | null
          target_regions?: string[] | null
          work_preference?: 'remote' | 'relocation' | 'both' | null
          target_sectors?: string[] | null
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          linkedin_headline?: string | null
          linkedin_about?: string | null
          ai_fluency_statements?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          negotiation_scripts?: Json | null
        }
        Update: {
          extracted_profile?: string | null
          target_role?: string | null
          seniority?: string | null
          years_experience?: number | null
          tech_stack?: string[] | null
          target_regions?: string[] | null
          work_preference?: 'remote' | 'relocation' | 'both' | null
          target_sectors?: string[] | null
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          linkedin_headline?: string | null
          linkedin_about?: string | null
          ai_fluency_statements?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string
          negotiation_scripts?: Json | null
          updated_at?: string
        }
      }
      keywords: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          word: string
          frequency: number
          source_job_id: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          word: string
          frequency?: number
          source_job_id?: string | null
        }
        Update: {
          word?: string
          frequency?: number
          source_job_id?: string | null
        }
      }
      jobs: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          company_name: string
          role_title: string
          job_description: string | null
          source_url: string | null
          status: 'to_analyse' | 'analysing' | 'applied' | 'interviewing' | 'offer' | 'discarded'
          fit_score: number | null
          strong_keywords: string[] | null
          weak_keywords: string[] | null
          apply_recommendation: boolean | null
          analysis_notes: string | null
          applied_at: string | null
          cv_version_id: string | null
          cover_note: string | null
          interview_notes: string | null
          offer_details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          company_name: string
          role_title: string
          job_description?: string | null
          source_url?: string | null
          status?: 'to_analyse' | 'analysing' | 'applied' | 'interviewing' | 'offer' | 'discarded'
          fit_score?: number | null
          strong_keywords?: string[] | null
          weak_keywords?: string[] | null
          apply_recommendation?: boolean | null
          analysis_notes?: string | null
          applied_at?: string | null
          cv_version_id?: string | null
          cover_note?: string | null
          interview_notes?: string | null
          offer_details?: string | null
        }
        Update: {
          company_name?: string
          role_title?: string
          job_description?: string | null
          source_url?: string | null
          status?: 'to_analyse' | 'analysing' | 'applied' | 'interviewing' | 'offer' | 'discarded'
          fit_score?: number | null
          strong_keywords?: string[] | null
          weak_keywords?: string[] | null
          apply_recommendation?: boolean | null
          analysis_notes?: string | null
          applied_at?: string | null
          cv_version_id?: string | null
          cover_note?: string | null
          interview_notes?: string | null
          offer_details?: string | null
          updated_at?: string
        }
      }
      contacts: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          name: string
          role: string | null
          company: string
          linkedin_url: string | null
          outreach_message: string | null
          outreach_sent_at: string | null
          response_received: boolean
          follow_up_due_at: string | null
          notes: string | null
          related_job_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          company: string
          role?: string | null
          linkedin_url?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          response_received?: boolean
          follow_up_due_at?: string | null
          notes?: string | null
          related_job_id?: string | null
        }
        Update: {
          name?: string
          company?: string
          role?: string | null
          linkedin_url?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          response_received?: boolean
          follow_up_due_at?: string | null
          notes?: string | null
          related_job_id?: string | null
          updated_at?: string
        }
      }
      cv_versions: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          name: string
          generated_by: 'manual' | 'ai'
          is_active: boolean
          content: Json
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          generated_by?: 'manual' | 'ai'
          is_active?: boolean
          content: Json
        }
        Update: {
          name?: string
          generated_by?: 'manual' | 'ai'
          is_active?: boolean
          content?: Json
        }
      }
      day_activities: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          program_enrollment_id: string | null
          day_number: number
          status: 'pending' | 'in_progress' | 'done' | 'skipped'
          conversation_log: Json | null
          checklist: Json | null
          outputs: Json | null
          jobs_applied_ids: string[] | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          day_number: number
          program_enrollment_id?: string | null
          status?: 'pending' | 'in_progress' | 'done' | 'skipped'
          conversation_log?: Json | null
          checklist?: Json | null
          outputs?: Json | null
          jobs_applied_ids?: string[] | null
          completed_at?: string | null
        }
        Update: {
          program_enrollment_id?: string | null
          status?: 'pending' | 'in_progress' | 'done' | 'skipped'
          conversation_log?: Json | null
          checklist?: Json | null
          outputs?: Json | null
          jobs_applied_ids?: string[] | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      programs: {
        Relationships: []
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          total_days: number
          week_themes: Json
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          name: string
          description?: string | null
          total_days?: number
          week_themes?: Json
          is_published?: boolean
          created_by?: string | null
        }
        Update: {
          slug?: string
          name?: string
          description?: string | null
          total_days?: number
          week_themes?: Json
          is_published?: boolean
          created_by?: string | null
          updated_at?: string
        }
      }
      program_days: {
        Relationships: []
        Row: {
          id: string
          program_id: string
          day_number: number
          week_number: number
          name: string
          description: string | null
          cards: Json
          ai_instructions: string | null
          ai_model: string
          ai_max_tokens: number
          created_at: string
          updated_at: string
        }
        Insert: {
          program_id: string
          day_number: number
          week_number: number
          name: string
          description?: string | null
          cards?: Json
          ai_instructions?: string | null
          ai_model?: string
          ai_max_tokens?: number
        }
        Update: {
          week_number?: number
          name?: string
          description?: string | null
          cards?: Json
          ai_instructions?: string | null
          ai_model?: string
          ai_max_tokens?: number
          updated_at?: string
        }
      }
      user_programs: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          program_id: string
          enrolled_by: string | null
          status: 'active' | 'completed' | 'paused' | 'cancelled'
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          program_id: string
          enrolled_by?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          enrolled_by?: string | null
          status?: 'active' | 'completed' | 'paused' | 'cancelled'
          completed_at?: string | null
          updated_at?: string
        }
      }
      token_balance: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          tokens_total: number
          tokens_used: number
          expires_at: string
          product_type: string
          source_payment_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          tokens_total: number
          tokens_used?: number
          expires_at: string
          product_type: string
          source_payment_id?: string | null
          is_active?: boolean
        }
        Update: {
          tokens_total?: number
          tokens_used?: number
          expires_at?: string
          product_type?: string
          source_payment_id?: string | null
          is_active?: boolean
          updated_at?: string
        }
      }
      token_usage: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          balance_id: string
          tokens_consumed: number
          interaction_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          user_id: string
          balance_id: string
          tokens_consumed: number
          interaction_type: string
          metadata?: Json | null
        }
        Update: {
          tokens_consumed?: number
          interaction_type?: string
          metadata?: Json | null
        }
      }
      interview_prep: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          performance_map: Json | null
          star_stories: Json[] | null
          soft_skills: Json[] | null
          technical_gaps: string[] | null
          simulation_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          performance_map?: Json | null
          star_stories?: Json[] | null
          soft_skills?: Json[] | null
          technical_gaps?: string[] | null
          simulation_notes?: string | null
        }
        Update: {
          performance_map?: Json | null
          star_stories?: Json[] | null
          soft_skills?: Json[] | null
          technical_gaps?: string[] | null
          simulation_notes?: string | null
          updated_at?: string
        }
      }
      mentor_actions: {
        Relationships: []
        Row: {
          id: string
          mentor_id: string
          target_user_id: string
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          mentor_id: string
          target_user_id: string
          action: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          metadata?: Json | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      consume_tokens: {
        Args: {
          p_user_id: string
          p_tokens: number
          p_interaction_type: string
          p_metadata?: Json
        }
        Returns: Json
      }
    }
  }
}
