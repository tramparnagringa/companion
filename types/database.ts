export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          role: string | null
          abacatepay_customer_id: string | null
          abacatepay_subscription_id: string | null
          abacatepay_billing_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          abacatepay_billing_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          abacatepay_billing_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          total_days: number
          week_themes: Json | null
          is_published: boolean | null
          created_by: string | null
          token_allocation: number | null
          credit_ratio: number | null
          price_brl: number | null
          duration_days: number | null
          validity_days: number | null
          abacatepay_product_id: string | null
          store_visible: boolean
          display_order: number
          features: string[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          total_days?: number
          week_themes?: Json | null
          is_published?: boolean | null
          created_by?: string | null
          token_allocation?: number | null
          credit_ratio?: number | null
          price_brl?: number | null
          duration_days?: number | null
          validity_days?: number | null
          abacatepay_product_id?: string | null
          store_visible?: boolean
          display_order?: number
          features?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          total_days?: number
          week_themes?: Json | null
          is_published?: boolean | null
          created_by?: string | null
          token_allocation?: number | null
          credit_ratio?: number | null
          price_brl?: number | null
          duration_days?: number | null
          validity_days?: number | null
          abacatepay_product_id?: string | null
          store_visible?: boolean
          display_order?: number
          features?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_days: {
        Row: {
          id: string
          program_id: string
          day_number: number
          week_number: number
          name: string
          description: string | null
          cards: Json | null
          ai_instructions: string | null
          ai_model: string | null
          ai_max_tokens: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          program_id: string
          day_number: number
          week_number: number
          name: string
          description?: string | null
          cards?: Json | null
          ai_instructions?: string | null
          ai_model?: string | null
          ai_max_tokens?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          program_id?: string
          day_number?: number
          week_number?: number
          name?: string
          description?: string | null
          cards?: Json | null
          ai_instructions?: string | null
          ai_model?: string | null
          ai_max_tokens?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_programs: {
        Row: {
          id: string
          user_id: string
          program_id: string
          status: string | null
          current_day: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          status?: string | null
          current_day?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string
          status?: string | null
          current_day?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      candidate_profiles: {
        Row: {
          id: string
          user_id: string
          extracted_profile: string | null
          target_role: string | null
          seniority: string | null
          years_experience: number | null
          tech_stack: string[] | null
          target_regions: string[] | null
          work_preference: string | null
          target_sectors: string[] | null
          value_proposition: string | null
          value_proposition_alternatives: string[] | null
          linkedin_headline: string | null
          linkedin_about: string | null
          ai_fluency_statements: string[] | null
          salary_min: number | null
          salary_max: number | null
          salary_currency: string | null
          negotiation_scripts: Json | null
          ici_scores: Json | null
          conversation_context: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          extracted_profile?: string | null
          target_role?: string | null
          seniority?: string | null
          years_experience?: number | null
          tech_stack?: string[] | null
          target_regions?: string[] | null
          work_preference?: string | null
          target_sectors?: string[] | null
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          linkedin_headline?: string | null
          linkedin_about?: string | null
          ai_fluency_statements?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          negotiation_scripts?: Json | null
          ici_scores?: Json | null
          conversation_context?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          extracted_profile?: string | null
          target_role?: string | null
          seniority?: string | null
          years_experience?: number | null
          tech_stack?: string[] | null
          target_regions?: string[] | null
          work_preference?: string | null
          target_sectors?: string[] | null
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          linkedin_headline?: string | null
          linkedin_about?: string | null
          ai_fluency_statements?: string[] | null
          salary_min?: number | null
          salary_max?: number | null
          salary_currency?: string | null
          negotiation_scripts?: Json | null
          ici_scores?: Json | null
          conversation_context?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      keywords: {
        Row: {
          id: string
          user_id: string
          word: string
          frequency: number | null
          source_job_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          word: string
          frequency?: number | null
          source_job_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          word?: string
          frequency?: number | null
          source_job_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      jobs: {
        Row: {
          id: string
          user_id: string
          company_name: string
          role_title: string
          job_description: string | null
          source_url: string | null
          status: string | null
          status_log: Json | null
          fit_score: number | null
          strong_keywords: string[] | null
          weak_keywords: string[] | null
          apply_recommendation: boolean | null
          analysis_notes: string | null
          applied_at: string | null
          cv_version_id: string | null
          cover_note: string | null
          interview_notes: string | null
          interview_prep: Json | null
          offer_details: string | null
          recruiter_name: string | null
          recruiter_linkedin: string | null
          archived_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          role_title: string
          job_description?: string | null
          source_url?: string | null
          status?: string | null
          status_log?: Json | null
          fit_score?: number | null
          strong_keywords?: string[] | null
          weak_keywords?: string[] | null
          apply_recommendation?: boolean | null
          analysis_notes?: string | null
          applied_at?: string | null
          cv_version_id?: string | null
          cover_note?: string | null
          interview_notes?: string | null
          interview_prep?: Json | null
          offer_details?: string | null
          recruiter_name?: string | null
          recruiter_linkedin?: string | null
          archived_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          role_title?: string
          job_description?: string | null
          source_url?: string | null
          status?: string | null
          status_log?: Json | null
          fit_score?: number | null
          strong_keywords?: string[] | null
          weak_keywords?: string[] | null
          apply_recommendation?: boolean | null
          analysis_notes?: string | null
          applied_at?: string | null
          cv_version_id?: string | null
          cover_note?: string | null
          interview_notes?: string | null
          interview_prep?: Json | null
          offer_details?: string | null
          recruiter_name?: string | null
          recruiter_linkedin?: string | null
          archived_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string | null
          company: string | null
          linkedin_url: string | null
          outreach_message: string | null
          outreach_sent_at: string | null
          response_received: boolean | null
          follow_up_due_at: string | null
          notes: string | null
          related_job_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role?: string | null
          company?: string | null
          linkedin_url?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          response_received?: boolean | null
          follow_up_due_at?: string | null
          notes?: string | null
          related_job_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          role?: string | null
          company?: string | null
          linkedin_url?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          response_received?: boolean | null
          follow_up_due_at?: string | null
          notes?: string | null
          related_job_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cv_versions: {
        Row: {
          id: string
          user_id: string
          name: string
          generated_by: string | null
          is_active: boolean | null
          content: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          generated_by?: string | null
          is_active?: boolean | null
          content: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          generated_by?: string | null
          is_active?: boolean | null
          content?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      day_activities: {
        Row: {
          id: string
          user_id: string
          program_enrollment_id: string | null
          day_number: number
          status: string | null
          conversation_log: Json | null
          checklist: Json | null
          outputs: Json | null
          jobs_applied_ids: string[] | null
          completed_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          program_enrollment_id?: string | null
          day_number: number
          status?: string | null
          conversation_log?: Json | null
          checklist?: Json | null
          outputs?: Json | null
          jobs_applied_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          program_enrollment_id?: string | null
          day_number?: number
          status?: string | null
          conversation_log?: Json | null
          checklist?: Json | null
          outputs?: Json | null
          jobs_applied_ids?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          title: string | null
          mode: string | null
          day_number: number | null
          target_user_id: string | null
          messages: Json
          summary: string | null
          context_snapshot: string | null
          summarized_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          mode?: string | null
          day_number?: number | null
          target_user_id?: string | null
          messages?: Json
          summary?: string | null
          context_snapshot?: string | null
          summarized_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          mode?: string | null
          day_number?: number | null
          target_user_id?: string | null
          messages?: Json
          summary?: string | null
          context_snapshot?: string | null
          summarized_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      action_notes: {
        Row: {
          id: string
          user_id: string
          program_enrollment_id: string | null
          day_number: number | null
          title: string | null
          content: string | null
          checklist: Json | null
          completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          program_enrollment_id?: string | null
          day_number?: number | null
          title?: string | null
          content?: string | null
          checklist?: Json | null
          completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          program_enrollment_id?: string | null
          day_number?: number | null
          title?: string | null
          content?: string | null
          checklist?: Json | null
          completed?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      token_balance: {
        Row: {
          id: string
          user_id: string
          tokens_total: number
          tokens_used: number
          expires_at: string
          product_type: string
          source_payment_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tokens_total: number
          tokens_used?: number
          expires_at: string
          product_type: string
          source_payment_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tokens_total?: number
          tokens_used?: number
          expires_at?: string
          product_type?: string
          source_payment_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          id: string
          user_id: string
          balance_id: string
          tokens_consumed: number
          interaction_type: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          balance_id: string
          tokens_consumed: number
          interaction_type: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          balance_id?: string
          tokens_consumed?: number
          interaction_type?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      interview_prep: {
        Row: {
          id: string
          user_id: string
          performance_map: Json | null
          star_stories: Json | null
          soft_skills: Json | null
          technical_gaps: string[] | null
          simulation_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          performance_map?: Json | null
          star_stories?: Json | null
          soft_skills?: Json | null
          technical_gaps?: string[] | null
          simulation_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          performance_map?: Json | null
          star_stories?: Json | null
          soft_skills?: Json | null
          technical_gaps?: string[] | null
          simulation_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_actions: {
        Row: {
          id: string
          mentor_id: string
          target_user_id: string
          action: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          mentor_id: string
          target_user_id: string
          action: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          mentor_id?: string
          target_user_id?: string
          action?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
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
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
