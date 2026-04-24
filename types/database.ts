export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      action_notes: {
        Row: {
          checklist: Json
          completed: boolean
          content: string
          created_at: string | null
          day_number: number | null
          id: string
          program_enrollment_id: string | null
          session_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checklist?: Json
          completed?: boolean
          content: string
          created_at?: string | null
          day_number?: number | null
          id?: string
          program_enrollment_id?: string | null
          session_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checklist?: Json
          completed?: boolean
          content?: string
          created_at?: string | null
          day_number?: number | null
          id?: string
          program_enrollment_id?: string | null
          session_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_notes_program_enrollment_id_fkey"
            columns: ["program_enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_profiles: {
        Row: {
          ai_fluency_statements: string[] | null
          created_at: string | null
          extracted_profile: string | null
          id: string
          linkedin_about: string | null
          linkedin_headline: string | null
          negotiation_scripts: Json | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          seniority: string | null
          target_regions: string[] | null
          target_role: string | null
          target_sectors: string[] | null
          tech_stack: string[] | null
          updated_at: string | null
          user_id: string
          value_proposition: string | null
          value_proposition_alternatives: string[] | null
          work_preference: string | null
          years_experience: number | null
        }
        Insert: {
          ai_fluency_statements?: string[] | null
          created_at?: string | null
          extracted_profile?: string | null
          id?: string
          linkedin_about?: string | null
          linkedin_headline?: string | null
          negotiation_scripts?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          target_regions?: string[] | null
          target_role?: string | null
          target_sectors?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string | null
          user_id: string
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          work_preference?: string | null
          years_experience?: number | null
        }
        Update: {
          ai_fluency_statements?: string[] | null
          created_at?: string | null
          extracted_profile?: string | null
          id?: string
          linkedin_about?: string | null
          linkedin_headline?: string | null
          negotiation_scripts?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          seniority?: string | null
          target_regions?: string[] | null
          target_role?: string | null
          target_sectors?: string[] | null
          tech_stack?: string[] | null
          updated_at?: string | null
          user_id?: string
          value_proposition?: string | null
          value_proposition_alternatives?: string[] | null
          work_preference?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          day_number: number | null
          id: string
          messages: Json
          mode: string | null
          target_user_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          messages?: Json
          mode?: string | null
          target_user_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_number?: number | null
          id?: string
          messages?: Json
          mode?: string | null
          target_user_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string | null
          follow_up_due_at: string | null
          id: string
          linkedin_url: string | null
          name: string
          notes: string | null
          outreach_message: string | null
          outreach_sent_at: string | null
          related_job_id: string | null
          response_received: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          follow_up_due_at?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          notes?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          related_job_id?: string | null
          response_received?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          follow_up_due_at?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          notes?: string | null
          outreach_message?: string | null
          outreach_sent_at?: string | null
          related_job_id?: string | null
          response_received?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_related_job_id_fkey"
            columns: ["related_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_versions: {
        Row: {
          content: Json
          created_at: string | null
          generated_by: string | null
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string | null
          generated_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      day_activities: {
        Row: {
          checklist: Json | null
          completed_at: string | null
          conversation_log: Json | null
          created_at: string | null
          day_number: number
          id: string
          jobs_applied_ids: string[] | null
          outputs: Json | null
          program_enrollment_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          checklist?: Json | null
          completed_at?: string | null
          conversation_log?: Json | null
          created_at?: string | null
          day_number: number
          id?: string
          jobs_applied_ids?: string[] | null
          outputs?: Json | null
          program_enrollment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          checklist?: Json | null
          completed_at?: string | null
          conversation_log?: Json | null
          created_at?: string | null
          day_number?: number
          id?: string
          jobs_applied_ids?: string[] | null
          outputs?: Json | null
          program_enrollment_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day_activities_program_enrollment_id_fkey"
            columns: ["program_enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_prep: {
        Row: {
          created_at: string | null
          id: string
          performance_map: Json | null
          simulation_notes: string | null
          soft_skills: Json[] | null
          star_stories: Json[] | null
          technical_gaps: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          performance_map?: Json | null
          simulation_notes?: string | null
          soft_skills?: Json[] | null
          star_stories?: Json[] | null
          technical_gaps?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          performance_map?: Json | null
          simulation_notes?: string | null
          soft_skills?: Json[] | null
          star_stories?: Json[] | null
          technical_gaps?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          analysis_notes: string | null
          applied_at: string | null
          apply_recommendation: boolean | null
          archived_at: string | null
          company_name: string
          cover_note: string | null
          created_at: string | null
          cv_version_id: string | null
          fit_score: number | null
          id: string
          interview_notes: string | null
          interview_prep: Json | null
          job_description: string | null
          offer_details: string | null
          recruiter_linkedin: string | null
          recruiter_name: string | null
          role_title: string
          source_url: string | null
          status: string | null
          status_log: Json
          strong_keywords: string[] | null
          updated_at: string | null
          user_id: string
          weak_keywords: string[] | null
        }
        Insert: {
          analysis_notes?: string | null
          applied_at?: string | null
          apply_recommendation?: boolean | null
          archived_at?: string | null
          company_name: string
          cover_note?: string | null
          created_at?: string | null
          cv_version_id?: string | null
          fit_score?: number | null
          id?: string
          interview_notes?: string | null
          interview_prep?: Json | null
          job_description?: string | null
          offer_details?: string | null
          recruiter_linkedin?: string | null
          recruiter_name?: string | null
          role_title: string
          source_url?: string | null
          status?: string | null
          status_log?: Json
          strong_keywords?: string[] | null
          updated_at?: string | null
          user_id: string
          weak_keywords?: string[] | null
        }
        Update: {
          analysis_notes?: string | null
          applied_at?: string | null
          apply_recommendation?: boolean | null
          archived_at?: string | null
          company_name?: string
          cover_note?: string | null
          created_at?: string | null
          cv_version_id?: string | null
          fit_score?: number | null
          id?: string
          interview_notes?: string | null
          interview_prep?: Json | null
          job_description?: string | null
          offer_details?: string | null
          recruiter_linkedin?: string | null
          recruiter_name?: string | null
          role_title?: string
          source_url?: string | null
          status?: string | null
          status_log?: Json
          strong_keywords?: string[] | null
          updated_at?: string | null
          user_id?: string
          weak_keywords?: string[] | null
        }
        Relationships: []
      }
      keywords: {
        Row: {
          created_at: string | null
          frequency: number | null
          id: string
          source_job_id: string | null
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          source_job_id?: string | null
          user_id: string
          word: string
        }
        Update: {
          created_at?: string | null
          frequency?: number | null
          id?: string
          source_job_id?: string | null
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      mentor_actions: {
        Row: {
          action: string
          created_at: string | null
          id: string
          mentor_id: string
          metadata: Json | null
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          mentor_id: string
          metadata?: Json | null
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          mentor_id?: string
          metadata?: Json | null
          target_user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abacatepay_billing_id: string | null
          abacatepay_customer_id: string | null
          abacatepay_subscription_id: string | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          abacatepay_billing_id?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          abacatepay_billing_id?: string | null
          abacatepay_customer_id?: string | null
          abacatepay_subscription_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_days: {
        Row: {
          ai_instructions: string | null
          ai_max_tokens: number
          ai_model: string
          cards: Json
          created_at: string | null
          day_number: number
          description: string | null
          id: string
          name: string
          program_id: string
          updated_at: string | null
          week_number: number
        }
        Insert: {
          ai_instructions?: string | null
          ai_max_tokens?: number
          ai_model?: string
          cards?: Json
          created_at?: string | null
          day_number: number
          description?: string | null
          id?: string
          name: string
          program_id: string
          updated_at?: string | null
          week_number: number
        }
        Update: {
          ai_instructions?: string | null
          ai_max_tokens?: number
          ai_model?: string
          cards?: Json
          created_at?: string | null
          day_number?: number
          description?: string | null
          id?: string
          name?: string
          program_id?: string
          updated_at?: string | null
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "program_days_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          abacatepay_product_id: string | null
          created_at: string | null
          features: string[]
          created_by: string | null
          credit_ratio: number | null
          description: string | null
          display_order: number
          duration_days: number | null
          id: string
          is_published: boolean
          name: string
          price_brl: number | null
          slug: string
          store_visible: boolean
          token_allocation: number | null
          token_costs: Json | null
          total_days: number
          updated_at: string | null
          validity_days: number | null
          week_themes: Json
        }
        Insert: {
          abacatepay_product_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_ratio?: number | null
          description?: string | null
          display_order?: number
          duration_days?: number | null
          features?: string[]
          id?: string
          is_published?: boolean
          name: string
          price_brl?: number | null
          slug: string
          store_visible?: boolean
          token_allocation?: number | null
          token_costs?: Json | null
          total_days?: number
          updated_at?: string | null
          validity_days?: number | null
          week_themes?: Json
        }
        Update: {
          abacatepay_product_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credit_ratio?: number | null
          description?: string | null
          display_order?: number
          duration_days?: number | null
          features?: string[]
          id?: string
          is_published?: boolean
          name?: string
          price_brl?: number | null
          slug?: string
          store_visible?: boolean
          token_allocation?: number | null
          token_costs?: Json | null
          total_days?: number
          updated_at?: string | null
          validity_days?: number | null
          week_themes?: Json
        }
        Relationships: []
      }
      token_balance: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          product_type: string
          source_payment_id: string | null
          tokens_total: number
          tokens_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          product_type: string
          source_payment_id?: string | null
          tokens_total?: number
          tokens_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          product_type?: string
          source_payment_id?: string | null
          tokens_total?: number
          tokens_used?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          balance_id: string
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          tokens_consumed: number
          user_id: string
        }
        Insert: {
          balance_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          tokens_consumed: number
          user_id: string
        }
        Update: {
          balance_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          tokens_consumed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_balance_id_fkey"
            columns: ["balance_id"]
            isOneToOne: false
            referencedRelation: "token_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      user_programs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          enrolled_by: string | null
          id: string
          program_id: string
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          enrolled_by?: string | null
          id?: string
          program_id: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          enrolled_by?: string | null
          id?: string
          program_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_tokens: {
        Args: {
          p_interaction_type: string
          p_metadata?: Json
          p_tokens: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
