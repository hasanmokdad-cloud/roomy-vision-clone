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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          affected_record_id: string | null
          affected_user_id: string | null
          created_at: string | null
          id: string
          ip_region: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          table_affected: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          affected_record_id?: string | null
          affected_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_region?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          table_affected?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          affected_record_id?: string | null
          affected_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_region?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          table_affected?: string | null
        }
        Relationships: []
      }
      admin_income_history: {
        Row: {
          commission_amount: number
          created_at: string | null
          currency: string | null
          id: string
          owner_id: string
          payment_id: string | null
          reservation_id: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          commission_amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id: string
          payment_id?: string | null
          reservation_id?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          owner_id?: string
          payment_id?: string | null
          reservation_id?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_income_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_income_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_wallet: {
        Row: {
          admin_id: string
          balance: number | null
          card_brand: string | null
          card_country: string | null
          card_last4: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          updated_at: string | null
          whish_token: string | null
        }
        Insert: {
          admin_id: string
          balance?: number | null
          card_brand?: string | null
          card_country?: string | null
          card_last4?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          updated_at?: string | null
          whish_token?: string | null
        }
        Update: {
          admin_id?: string
          balance?: number | null
          card_brand?: string | null
          card_country?: string | null
          card_last4?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          updated_at?: string | null
          whish_token?: string | null
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          last_login: string | null
          phone_number: string | null
          phone_verified: boolean | null
          profile_photo_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          message: string
          role: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          role: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          role?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_feedback: {
        Row: {
          ai_action: string
          context: Json | null
          created_at: string | null
          feedback_text: string | null
          helpful_score: number
          id: string
          target_id: string | null
          user_id: string | null
        }
        Insert: {
          ai_action: string
          context?: Json | null
          created_at?: string | null
          feedback_text?: string | null
          helpful_score: number
          id?: string
          target_id?: string | null
          user_id?: string | null
        }
        Update: {
          ai_action?: string
          context?: Json | null
          created_at?: string | null
          feedback_text?: string | null
          helpful_score?: number
          id?: string
          target_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_match_logs: {
        Row: {
          created_at: string | null
          id: string
          insights_generated: boolean | null
          match_tier: string
          mode: string
          personality_used: boolean | null
          processing_time_ms: number | null
          result_count: number | null
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insights_generated?: boolean | null
          match_tier: string
          mode: string
          personality_used?: boolean | null
          processing_time_ms?: number | null
          result_count?: number | null
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insights_generated?: boolean | null
          match_tier?: string
          mode?: string
          personality_used?: boolean | null
          processing_time_ms?: number | null
          result_count?: number | null
          student_id?: string
        }
        Relationships: []
      }
      ai_recommendations_log: {
        Row: {
          action: string
          created_at: string
          dorm_id: string | null
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          dorm_id?: string | null
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          dorm_id?: string | null
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          created_at: string
          id: string
          query: string
          response: string
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          response: string
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          response?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          dorm_id: string | null
          id: string
          meta: Json | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dorm_id?: string | null
          id?: string
          meta?: Json | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dorm_id?: string | null
          id?: string
          meta?: Json | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string
          id: string
          payment_id: string | null
          payment_method_last4: string | null
          student_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description: string
          id?: string
          payment_id?: string | null
          payment_method_last4?: string | null
          student_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string
          id?: string
          payment_id?: string | null
          payment_method_last4?: string | null
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_reminders: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          recipient_type: string
          recipient_user_id: string
          reminder_type: string
          scheduled_at: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          recipient_type: string
          recipient_user_id: string
          reminder_type: string
          scheduled_at: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          recipient_type?: string
          recipient_user_id?: string
          reminder_type?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          decline_reason: string | null
          dorm_id: string
          end_time: string | null
          id: string
          meeting_link: string | null
          meeting_platform: string | null
          message: string | null
          owner_id: string
          owner_notes: string | null
          requested_date: string
          requested_time: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          dorm_id: string
          end_time?: string | null
          id?: string
          meeting_link?: string | null
          meeting_platform?: string | null
          message?: string | null
          owner_id: string
          owner_notes?: string | null
          requested_date: string
          requested_time: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          dorm_id?: string
          end_time?: string | null
          id?: string
          meeting_link?: string | null
          meeting_platform?: string | null
          message?: string | null
          owner_id?: string
          owner_notes?: string | null
          requested_date?: string
          requested_time?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "fk_bookings_dorm"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_dorm"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_dorm"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_dorm"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "fk_bookings_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_dorm_assignments: {
        Row: {
          admin_user_id: string
          created_at: string | null
          csv_filename: string | null
          errors: Json | null
          failed_assignments: number
          id: string
          successful_assignments: number
          total_rows: number
        }
        Insert: {
          admin_user_id: string
          created_at?: string | null
          csv_filename?: string | null
          errors?: Json | null
          failed_assignments?: number
          id?: string
          successful_assignments?: number
          total_rows?: number
        }
        Update: {
          admin_user_id?: string
          created_at?: string | null
          csv_filename?: string | null
          errors?: Json | null
          failed_assignments?: number
          id?: string
          successful_assignments?: number
          total_rows?: number
        }
        Relationships: []
      }
      chat_context: {
        Row: {
          context: Json | null
          id: string
          last_match_session: Json | null
          last_messages: Json | null
          unresolved_questions: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          id?: string
          last_match_session?: Json | null
          last_messages?: Json | null
          unresolved_questions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          id?: string
          last_match_session?: Json | null
          last_messages?: Json | null
          unresolved_questions?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string
          reply: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          reply: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          reply?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          history: Json | null
          id: string
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          history?: Json | null
          id?: string
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          history?: Json | null
          id?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          read_at: string | null
          replied_at: string | null
          status: string | null
          university: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          read_at?: string | null
          replied_at?: string | null
          status?: string | null
          university?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          read_at?: string | null
          replied_at?: string | null
          status?: string | null
          university?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          conversation_type: string | null
          created_at: string
          dorm_id: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          muted_until: string | null
          owner_id: string | null
          student_id: string | null
          updated_at: string
          user_a_id: string | null
          user_b_id: string | null
        }
        Insert: {
          conversation_type?: string | null
          created_at?: string
          dorm_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          muted_until?: string | null
          owner_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_a_id?: string | null
          user_b_id?: string | null
        }
        Update: {
          conversation_type?: string | null
          created_at?: string
          dorm_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          muted_until?: string | null
          owner_id?: string | null
          student_id?: string | null
          updated_at?: string
          user_a_id?: string | null
          user_b_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      device_security_logs: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          event_type: string
          id: string
          ip_region: string | null
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          event_type: string
          id?: string
          ip_region?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          event_type?: string
          id?: string
          ip_region?: string | null
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      dorm_claims: {
        Row: {
          admin_notes: string | null
          contact_number: string | null
          created_at: string
          dorm_id: string
          id: string
          owner_id: string
          proof_of_ownership: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          contact_number?: string | null
          created_at?: string
          dorm_id: string
          id?: string
          owner_id: string
          proof_of_ownership?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          contact_number?: string | null
          created_at?: string
          dorm_id?: string
          id?: string
          owner_id?: string
          proof_of_ownership?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dorm_claims_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorm_claims_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorm_claims_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorm_claims_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "dorm_claims_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorm_claims_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      dorms: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          available: boolean | null
          capacity: number | null
          cover_image: string | null
          created_at: string
          description: string | null
          dorm_name: string | null
          email: string | null
          gallery_images: string[] | null
          gender_preference: string | null
          id: string
          image_url: string | null
          location: string
          monthly_price: number | null
          name: string
          owner_id: string | null
          phone_number: string | null
          price: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          room_types: string | null
          room_types_json: Json | null
          services_amenities: string | null
          shuttle: boolean | null
          type: string | null
          university: string | null
          updated_at: string
          verification_status: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          available?: boolean | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          dorm_name?: string | null
          email?: string | null
          gallery_images?: string[] | null
          gender_preference?: string | null
          id?: string
          image_url?: string | null
          location: string
          monthly_price?: number | null
          name: string
          owner_id?: string | null
          phone_number?: string | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_types?: string | null
          room_types_json?: Json | null
          services_amenities?: string | null
          shuttle?: boolean | null
          type?: string | null
          university?: string | null
          updated_at?: string
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          available?: boolean | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          dorm_name?: string | null
          email?: string | null
          gallery_images?: string[] | null
          gender_preference?: string | null
          id?: string
          image_url?: string | null
          location?: string
          monthly_price?: number | null
          name?: string
          owner_id?: string | null
          phone_number?: string | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_types?: string | null
          room_types_json?: Json | null
          services_amenities?: string | null
          shuttle?: boolean | null
          type?: string | null
          university?: string | null
          updated_at?: string
          verification_status?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dorms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          acted_by: string | null
          blocked_at: string | null
          blocker_id: string | null
          created_at: string | null
          id: string
          receiver_id: string
          requester_id: string
          status: Database["public"]["Enums"]["friendship_status"]
          updated_at: string | null
        }
        Insert: {
          acted_by?: string | null
          blocked_at?: string | null
          blocker_id?: string | null
          created_at?: string | null
          id?: string
          receiver_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
        }
        Update: {
          acted_by?: string | null
          blocked_at?: string | null
          blocker_id?: string | null
          created_at?: string | null
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["friendship_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friendships_acted_by_fkey"
            columns: ["acted_by"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string | null
          dorm_id: string | null
          id: string
          inquiry_type: string
          message: string | null
          owner_id: string
          status: string | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          student_phone: string | null
        }
        Insert: {
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          inquiry_type: string
          message?: string | null
          owner_id: string
          status?: string | null
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          student_phone?: string | null
        }
        Update: {
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          inquiry_type?: string
          message?: string | null
          owner_id?: string
          status?: string | null
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          student_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "inquiries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_duration: number | null
          attachment_metadata: Json | null
          attachment_type: string | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          deleted_for_all: boolean | null
          delivered_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          is_starred: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          read: boolean
          read_at: string | null
          receiver_id: string | null
          reply_to_message_id: string | null
          seen_at: string | null
          sender_id: string
          sent_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          attachment_duration?: number | null
          attachment_metadata?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_for_all?: boolean | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_starred?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          read?: boolean
          read_at?: string | null
          receiver_id?: string | null
          reply_to_message_id?: string | null
          seen_at?: string | null
          sender_id: string
          sent_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          attachment_duration?: number | null
          attachment_metadata?: Json | null
          attachment_type?: string | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_for_all?: boolean | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_starred?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          read?: boolean
          read_at?: string | null
          receiver_id?: string | null
          reply_to_message_id?: string | null
          seen_at?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          lang: string | null
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lang?: string | null
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lang?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string | null
          dorm_id: string | null
          error_message: string | null
          event_type: string
          fields_changed: Json | null
          id: string
          language: string | null
          owner_id: string
          retry_count: number | null
          sent_at: string | null
          sent_to: string
          status: string
        }
        Insert: {
          channel?: string | null
          dorm_id?: string | null
          error_message?: string | null
          event_type: string
          fields_changed?: Json | null
          id?: string
          language?: string | null
          owner_id: string
          retry_count?: number | null
          sent_at?: string | null
          sent_to: string
          status?: string
        }
        Update: {
          channel?: string | null
          dorm_id?: string | null
          error_message?: string | null
          event_type?: string
          fields_changed?: Json | null
          id?: string
          language?: string | null
          owner_id?: string
          retry_count?: number | null
          sent_at?: string | null
          sent_to?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "notifications_log_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_log_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_availability: {
        Row: {
          all_day: boolean | null
          blocked_date: string
          blocked_time_end: string | null
          blocked_time_start: string | null
          created_at: string | null
          dorm_id: string | null
          id: string
          owner_id: string
          reason: string | null
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          blocked_date: string
          blocked_time_end?: string | null
          blocked_time_start?: string | null
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          owner_id: string
          reason?: string | null
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          blocked_date?: string
          blocked_time_end?: string | null
          blocked_time_start?: string | null
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          owner_id?: string
          reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_availability_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_availability_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_availability_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_availability_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "owner_availability_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_availability_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_notifications: {
        Row: {
          body: string
          created_at: string
          dorm_id: string | null
          id: string
          owner_id: string
          read: boolean | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          dorm_id?: string | null
          id?: string
          owner_id: string
          read?: boolean | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          dorm_id?: string | null
          id?: string
          owner_id?: string
          read?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_notifications_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "owner_notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_notifications_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_payment_methods: {
        Row: {
          balance: number | null
          brand: string | null
          country: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last4: string
          owner_id: string
          updated_at: string | null
          whish_token: string
        }
        Insert: {
          balance?: number | null
          brand?: string | null
          country?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4: string
          owner_id: string
          updated_at?: string | null
          whish_token: string
        }
        Update: {
          balance?: number | null
          brand?: string | null
          country?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last4?: string
          owner_id?: string
          updated_at?: string | null
          whish_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_payment_methods_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_payment_methods_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      owners: {
        Row: {
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          last_login: string | null
          notify_email: boolean | null
          notify_whatsapp: boolean | null
          payout_method: string | null
          payout_notes: string | null
          payout_status: string | null
          phone_number: string | null
          phone_verified: boolean | null
          profile_photo_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          whatsapp_language: string | null
          whish_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          last_login?: string | null
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          payout_method?: string | null
          payout_notes?: string | null
          payout_status?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_language?: string | null
          whish_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          last_login?: string | null
          notify_email?: boolean | null
          notify_whatsapp?: boolean | null
          payout_method?: string | null
          payout_notes?: string | null
          payout_status?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_language?: string | null
          whish_account_id?: string | null
        }
        Relationships: []
      }
      password_breach_logs: {
        Row: {
          action_type: string
          breach_count: number | null
          created_at: string | null
          email_hash: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          breach_count?: number | null
          created_at?: string | null
          email_hash?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          breach_count?: number | null
          created_at?: string | null
          email_hash?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_disputes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          issue_type: string | null
          owner_id: string
          reservation_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          owner_id: string
          reservation_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          issue_type?: string | null
          owner_id?: string
          reservation_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_disputes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last4: string
          student_id: string
          updated_at: string | null
          whish_token: string
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4: string
          student_id: string
          updated_at?: string | null
          whish_token: string
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string
          student_id?: string
          updated_at?: string | null
          whish_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          match_plan_type: string | null
          payment_type: string
          provider: string | null
          raw_payload: Json | null
          reservation_id: string | null
          status: string | null
          student_id: string
          updated_at: string | null
          whish_payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          match_plan_type?: string | null
          payment_type: string
          provider?: string | null
          raw_payload?: Json | null
          reservation_id?: string | null
          status?: string | null
          student_id: string
          updated_at?: string | null
          whish_payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          match_plan_type?: string | null
          payment_type?: string
          provider?: string | null
          raw_payload?: Json | null
          reservation_id?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string | null
          whish_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_history: {
        Row: {
          created_at: string | null
          currency: string | null
          deposit_amount: number
          dorm_id: string
          id: string
          owner_id: string
          owner_receives: number
          payment_id: string | null
          reservation_id: string | null
          room_id: string
          roomy_fee: number
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          deposit_amount: number
          dorm_id: string
          id?: string
          owner_id: string
          owner_receives: number
          payment_id?: string | null
          reservation_id?: string | null
          room_id: string
          roomy_fee: number
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          deposit_amount?: number
          dorm_id?: string
          id?: string
          owner_id?: string
          owner_receives?: number
          payment_id?: string | null
          reservation_id?: string | null
          room_id?: string
          roomy_fee?: number
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_history_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "payout_history_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_questions: {
        Row: {
          category: string
          created_at: string | null
          display_order: number
          id: number
          is_advanced: boolean | null
          subcategory: string | null
          text: string
          weight: number
        }
        Insert: {
          category: string
          created_at?: string | null
          display_order: number
          id?: number
          is_advanced?: boolean | null
          subcategory?: string | null
          text: string
          weight?: number
        }
        Update: {
          category?: string
          created_at?: string | null
          display_order?: number
          id?: number
          is_advanced?: boolean | null
          subcategory?: string | null
          text?: string
          weight?: number
        }
        Relationships: []
      }
      personality_responses: {
        Row: {
          created_at: string | null
          id: string
          question_id: number
          response: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: number
          response: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: number
          response?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "personality_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_history: {
        Row: {
          created_at: string | null
          id: string
          preference_type: string
          student_id: string
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_type: string
          student_id: string
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_type?: string
          student_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "preference_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_decision: string | null
          admin_decision_note: string | null
          admin_id: string | null
          base_deposit: number | null
          created_at: string | null
          id: string
          owner_decision: string | null
          owner_decision_note: string | null
          owner_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          refund_admin_amount: number | null
          refund_owner_amount: number | null
          reservation_id: string
          status: string
          student_id: string
          total_paid: number | null
        }
        Insert: {
          admin_decision?: string | null
          admin_decision_note?: string | null
          admin_id?: string | null
          base_deposit?: number | null
          created_at?: string | null
          id?: string
          owner_decision?: string | null
          owner_decision_note?: string | null
          owner_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_admin_amount?: number | null
          refund_owner_amount?: number | null
          reservation_id: string
          status?: string
          student_id: string
          total_paid?: number | null
        }
        Update: {
          admin_decision?: string | null
          admin_decision_note?: string | null
          admin_id?: string | null
          base_deposit?: number | null
          created_at?: string | null
          id?: string
          owner_decision?: string | null
          owner_decision_note?: string | null
          owner_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_admin_amount?: number | null
          refund_owner_amount?: number | null
          reservation_id?: string
          status?: string
          student_id?: string
          total_paid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          commission_amount: number | null
          created_at: string | null
          deposit_amount: number
          dorm_id: string
          expires_at: string | null
          id: string
          latest_refund_status: string | null
          meta: Json | null
          owner_payout_amount: number | null
          owner_payout_attempts: number | null
          owner_payout_status: string | null
          owner_payout_timestamp: string | null
          paid_at: string | null
          payout_batch_id: string | null
          refundable_until: string | null
          reservation_fee_amount: number
          room_id: string
          roomy_commission_captured: boolean | null
          status: string
          student_id: string
          total_amount: number | null
          whish_checkout_url: string | null
          whish_payment_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          deposit_amount: number
          dorm_id: string
          expires_at?: string | null
          id?: string
          latest_refund_status?: string | null
          meta?: Json | null
          owner_payout_amount?: number | null
          owner_payout_attempts?: number | null
          owner_payout_status?: string | null
          owner_payout_timestamp?: string | null
          paid_at?: string | null
          payout_batch_id?: string | null
          refundable_until?: string | null
          reservation_fee_amount: number
          room_id: string
          roomy_commission_captured?: boolean | null
          status?: string
          student_id: string
          total_amount?: number | null
          whish_checkout_url?: string | null
          whish_payment_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          commission_amount?: number | null
          created_at?: string | null
          deposit_amount?: number
          dorm_id?: string
          expires_at?: string | null
          id?: string
          latest_refund_status?: string | null
          meta?: Json | null
          owner_payout_amount?: number | null
          owner_payout_attempts?: number | null
          owner_payout_status?: string | null
          owner_payout_timestamp?: string | null
          paid_at?: string | null
          payout_batch_id?: string | null
          refundable_until?: string | null
          reservation_fee_amount?: number
          room_id?: string
          roomy_commission_captured?: boolean | null
          status?: string
          student_id?: string
          total_amount?: number | null
          whish_checkout_url?: string | null
          whish_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          review_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          review_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string | null
          id: string
          owner_id: string | null
          response_text: string
          review_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          response_text: string
          review_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          owner_id?: string | null
          response_text?: string
          review_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          amenities_rating: number | null
          booking_id: string | null
          cleanliness_rating: number | null
          comment: string | null
          created_at: string | null
          dorm_id: string | null
          helpful_count: number | null
          id: string
          location_rating: number | null
          moderation_notes: string | null
          rating: number
          room_id: string | null
          status: string | null
          student_id: string | null
          title: string
          updated_at: string | null
          value_rating: number | null
          verified_stay: boolean | null
        }
        Insert: {
          amenities_rating?: number | null
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          dorm_id?: string | null
          helpful_count?: number | null
          id?: string
          location_rating?: number | null
          moderation_notes?: string | null
          rating: number
          room_id?: string | null
          status?: string | null
          student_id?: string | null
          title: string
          updated_at?: string | null
          value_rating?: number | null
          verified_stay?: boolean | null
        }
        Update: {
          amenities_rating?: number | null
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment?: string | null
          created_at?: string | null
          dorm_id?: string | null
          helpful_count?: number | null
          id?: string
          location_rating?: number | null
          moderation_notes?: string | null
          rating?: number
          room_id?: string | null
          status?: string | null
          student_id?: string | null
          title?: string
          updated_at?: string | null
          value_rating?: number | null
          verified_stay?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "reviews_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      rls_errors_log: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          error_message: string | null
          expected_uid: string | null
          id: string
          jwt_claims: Json | null
          operation: string
          policy_evaluated: string[] | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          error_message?: string | null
          expected_uid?: string | null
          id?: string
          jwt_claims?: Json | null
          operation: string
          policy_evaluated?: string[] | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          error_message?: string | null
          expected_uid?: string | null
          id?: string
          jwt_claims?: Json | null
          operation?: string
          policy_evaluated?: string[] | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rls_regression_results: {
        Row: {
          id: string
          issues_detail: Json | null
          issues_found: number | null
          passed: boolean
          run_at: string | null
          triggered_by: string | null
        }
        Insert: {
          id?: string
          issues_detail?: Json | null
          issues_found?: number | null
          passed: boolean
          run_at?: string | null
          triggered_by?: string | null
        }
        Update: {
          id?: string
          issues_detail?: Json | null
          issues_found?: number | null
          passed?: boolean
          run_at?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      room_contact_tracking: {
        Row: {
          created_at: string | null
          dorm_id: string | null
          id: string
          room_id: string | null
          student_email: string | null
          student_id: string | null
          student_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          room_id?: string | null
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dorm_id?: string | null
          id?: string
          room_id?: string | null
          student_email?: string | null
          student_id?: string | null
          student_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_contact_tracking_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_contact_tracking_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_contact_tracking_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_contact_tracking_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "room_contact_tracking_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_contact_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_matches: {
        Row: {
          advanced_score: number | null
          compatibility_score: number
          computed_at: string | null
          id: string
          lifestyle_score: number | null
          match_reasons: Json | null
          personality_score: number | null
          similarity_score: number | null
          student1_id: string
          student2_id: string
          study_score: number | null
        }
        Insert: {
          advanced_score?: number | null
          compatibility_score: number
          computed_at?: string | null
          id?: string
          lifestyle_score?: number | null
          match_reasons?: Json | null
          personality_score?: number | null
          similarity_score?: number | null
          student1_id: string
          student2_id: string
          study_score?: number | null
        }
        Update: {
          advanced_score?: number | null
          compatibility_score?: number
          computed_at?: string | null
          id?: string
          lifestyle_score?: number | null
          match_reasons?: Json | null
          personality_score?: number | null
          similarity_score?: number | null
          student1_id?: string
          student2_id?: string
          study_score?: number | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          area_m2: number | null
          available: boolean | null
          capacity: number | null
          capacity_occupied: number | null
          created_at: string
          deposit: number | null
          description: string | null
          dorm_id: string
          id: string
          images: string[] | null
          name: string
          panorama_urls: string[] | null
          price: number
          three_d_model_url: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          area_m2?: number | null
          available?: boolean | null
          capacity?: number | null
          capacity_occupied?: number | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          dorm_id: string
          id?: string
          images?: string[] | null
          name: string
          panorama_urls?: string[] | null
          price: number
          three_d_model_url?: string | null
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          area_m2?: number | null
          available?: boolean | null
          capacity?: number | null
          capacity_occupied?: number | null
          created_at?: string
          deposit?: number | null
          description?: string | null
          dorm_id?: string
          id?: string
          images?: string[] | null
          name?: string
          panorama_urls?: string[] | null
          price?: number
          three_d_model_url?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_rooms: {
        Row: {
          created_at: string | null
          dorm_id: string
          id: string
          room_id: string
          student_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dorm_id: string
          id?: string
          room_id: string
          student_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          dorm_id?: string
          id?: string
          room_id?: string
          student_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_rooms_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_region: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_region?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_region?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_schema_audit: {
        Row: {
          action: string
          details: Json | null
          event_time: string
          id: string
          object_name: string | null
          object_type: string | null
          policy_count: number | null
          reviewed: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          rls_enabled: boolean | null
          schema_name: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          event_time?: string
          id?: string
          object_name?: string | null
          object_type?: string | null
          policy_count?: number | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rls_enabled?: boolean | null
          schema_name?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          event_time?: string
          id?: string
          object_name?: string | null
          object_type?: string | null
          policy_count?: number | null
          reviewed?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rls_enabled?: boolean | null
          schema_name?: string | null
        }
        Relationships: []
      }
      shared_collections: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_public: boolean | null
          share_code: string
          student_id: string
          title: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          share_code: string
          student_id: string
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          share_code?: string
          student_id?: string
          title?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      storage_rejection_logs: {
        Row: {
          bucket_name: string
          created_at: string | null
          file_name: string | null
          file_size: number | null
          id: string
          mime_type: string | null
          rejection_reason: string
          user_id: string | null
        }
        Insert: {
          bucket_name: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason: string
          user_id?: string | null
        }
        Update: {
          bucket_name?: string
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          rejection_reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      student_match_plans: {
        Row: {
          expires_at: string
          id: string
          meta: Json | null
          payment_id: string | null
          plan_type: string
          started_at: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          expires_at: string
          id?: string
          meta?: Json | null
          payment_id?: string | null
          plan_type: string
          started_at?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          expires_at?: string
          id?: string
          meta?: Json | null
          payment_id?: string | null
          plan_type?: string
          started_at?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_match_plans_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_match_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accommodation_status: string | null
          advanced_compatibility_enabled: boolean | null
          age: number | null
          ai_confidence_score: number | null
          ai_match_plan: string | null
          ai_match_tier_last_paid_at: string | null
          budget: number | null
          compatibility_test_completed: boolean | null
          created_at: string | null
          current_dorm_id: string | null
          current_room_id: string | null
          dealbreakers: string[] | null
          distance_preference: string | null
          district: string | null
          email: string
          enable_personality_matching: boolean | null
          favorite_areas: string[] | null
          full_name: string
          gender: string | null
          governorate: string | null
          habit_cleanliness: number | null
          habit_noise: number | null
          habit_sleep: string | null
          habit_social: number | null
          id: string
          last_login: string | null
          major: string | null
          need_roommate: boolean | null
          needs_roommate_current_place: boolean | null
          needs_roommate_new_dorm: boolean | null
          personality_cleanliness_level: string | null
          personality_conflict_style: string | null
          personality_cooking_frequency: string | null
          personality_data: Json | null
          personality_guests_frequency: string | null
          personality_intro_extro: string | null
          personality_last_updated_at: string | null
          personality_noise_tolerance: string | null
          personality_shared_space_cleanliness_importance: number | null
          personality_sharing_preferences: string | null
          personality_sleep_schedule: string | null
          personality_sleep_sensitivity: string | null
          personality_smoking: string | null
          personality_study_environment: string | null
          personality_study_time: string | null
          personality_test_completed: boolean | null
          personality_vector: Json | null
          phone_number: string | null
          phone_verified: boolean | null
          preferred_amenities: string[] | null
          preferred_housing_area: string | null
          preferred_room_types: string[] | null
          preferred_university: string | null
          profile_completion_score: number | null
          profile_photo_url: string | null
          residential_area: string | null
          room_type: string | null
          roommate_needed: boolean | null
          roommates_needed: number | null
          status: string | null
          town_village: string | null
          university: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          year_of_study: number | null
        }
        Insert: {
          accommodation_status?: string | null
          advanced_compatibility_enabled?: boolean | null
          age?: number | null
          ai_confidence_score?: number | null
          ai_match_plan?: string | null
          ai_match_tier_last_paid_at?: string | null
          budget?: number | null
          compatibility_test_completed?: boolean | null
          created_at?: string | null
          current_dorm_id?: string | null
          current_room_id?: string | null
          dealbreakers?: string[] | null
          distance_preference?: string | null
          district?: string | null
          email: string
          enable_personality_matching?: boolean | null
          favorite_areas?: string[] | null
          full_name: string
          gender?: string | null
          governorate?: string | null
          habit_cleanliness?: number | null
          habit_noise?: number | null
          habit_sleep?: string | null
          habit_social?: number | null
          id?: string
          last_login?: string | null
          major?: string | null
          need_roommate?: boolean | null
          needs_roommate_current_place?: boolean | null
          needs_roommate_new_dorm?: boolean | null
          personality_cleanliness_level?: string | null
          personality_conflict_style?: string | null
          personality_cooking_frequency?: string | null
          personality_data?: Json | null
          personality_guests_frequency?: string | null
          personality_intro_extro?: string | null
          personality_last_updated_at?: string | null
          personality_noise_tolerance?: string | null
          personality_shared_space_cleanliness_importance?: number | null
          personality_sharing_preferences?: string | null
          personality_sleep_schedule?: string | null
          personality_sleep_sensitivity?: string | null
          personality_smoking?: string | null
          personality_study_environment?: string | null
          personality_study_time?: string | null
          personality_test_completed?: boolean | null
          personality_vector?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_amenities?: string[] | null
          preferred_housing_area?: string | null
          preferred_room_types?: string[] | null
          preferred_university?: string | null
          profile_completion_score?: number | null
          profile_photo_url?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          roommates_needed?: number | null
          status?: string | null
          town_village?: string | null
          university?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          year_of_study?: number | null
        }
        Update: {
          accommodation_status?: string | null
          advanced_compatibility_enabled?: boolean | null
          age?: number | null
          ai_confidence_score?: number | null
          ai_match_plan?: string | null
          ai_match_tier_last_paid_at?: string | null
          budget?: number | null
          compatibility_test_completed?: boolean | null
          created_at?: string | null
          current_dorm_id?: string | null
          current_room_id?: string | null
          dealbreakers?: string[] | null
          distance_preference?: string | null
          district?: string | null
          email?: string
          enable_personality_matching?: boolean | null
          favorite_areas?: string[] | null
          full_name?: string
          gender?: string | null
          governorate?: string | null
          habit_cleanliness?: number | null
          habit_noise?: number | null
          habit_sleep?: string | null
          habit_social?: number | null
          id?: string
          last_login?: string | null
          major?: string | null
          need_roommate?: boolean | null
          needs_roommate_current_place?: boolean | null
          needs_roommate_new_dorm?: boolean | null
          personality_cleanliness_level?: string | null
          personality_conflict_style?: string | null
          personality_cooking_frequency?: string | null
          personality_data?: Json | null
          personality_guests_frequency?: string | null
          personality_intro_extro?: string | null
          personality_last_updated_at?: string | null
          personality_noise_tolerance?: string | null
          personality_shared_space_cleanliness_importance?: number | null
          personality_sharing_preferences?: string | null
          personality_sleep_schedule?: string | null
          personality_sleep_sensitivity?: string | null
          personality_smoking?: string | null
          personality_study_environment?: string | null
          personality_study_time?: string | null
          personality_test_completed?: boolean | null
          personality_vector?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_amenities?: string[] | null
          preferred_housing_area?: string | null
          preferred_room_types?: string[] | null
          preferred_university?: string | null
          profile_completion_score?: number | null
          profile_photo_url?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          roommates_needed?: number | null
          status?: string | null
          town_village?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          year_of_study?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_current_dorm_id_fkey"
            columns: ["current_dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_current_dorm_id_fkey"
            columns: ["current_dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_current_dorm_id_fkey"
            columns: ["current_dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_current_dorm_id_fkey"
            columns: ["current_dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
          {
            foreignKeyName: "students_current_room_id_fkey"
            columns: ["current_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      students_ai_responses: {
        Row: {
          created_at: string | null
          id: string
          responses: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          responses?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          responses?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          details: Json | null
          log_id: string
          record_id: string | null
          table_affected: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          log_id?: string
          record_id?: string | null
          table_affected: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          log_id?: string
          record_id?: string | null
          table_affected?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          ai_suggested_questions: Json | null
          created_at: string
          dorm_id: string
          id: string
          owner_id: string
          scheduled_time: string
          status: string
          student_id: string
          student_message: string | null
          updated_at: string
        }
        Insert: {
          ai_suggested_questions?: Json | null
          created_at?: string
          dorm_id: string
          id?: string
          owner_id: string
          scheduled_time: string
          status?: string
          student_id: string
          student_message?: string | null
          updated_at?: string
        }
        Update: {
          ai_suggested_questions?: Json | null
          created_at?: string
          dorm_id?: string
          id?: string
          owner_id?: string
          scheduled_time?: string
          status?: string
          student_id?: string
          student_message?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_bookings_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      user_devices: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          created_at: string | null
          device_name: string
          device_type: string | null
          fingerprint_hash: string
          id: string
          ip_region: string | null
          is_current: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          os_name: string | null
          os_version: string | null
          user_id: string
          verification_expires_at: string | null
          verification_token: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_name: string
          device_type?: string | null
          fingerprint_hash: string
          id?: string
          ip_region?: string | null
          is_current?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          os_name?: string | null
          os_version?: string | null
          user_id: string
          verification_expires_at?: string | null
          verification_token?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          created_at?: string | null
          device_name?: string
          device_type?: string | null
          fingerprint_hash?: string
          id?: string
          ip_region?: string | null
          is_current?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          os_name?: string | null
          os_version?: string | null
          user_id?: string
          verification_expires_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      user_payment_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_conversation_id: string | null
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_conversation_id?: string | null
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_conversation_id?: string | null
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_thread_state: {
        Row: {
          created_at: string | null
          id: string
          last_read_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_thread_state_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dorm_engagement_view: {
        Row: {
          dorm_id: string | null
          favorites: number | null
          inquiries: number | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorm_performance_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "dorms_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_dorm_id_fkey"
            columns: ["dorm_id"]
            isOneToOne: false
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      dorm_performance_summary: {
        Row: {
          area: string | null
          conversion_rate: number | null
          favorites: number | null
          id: string | null
          inquiries: number | null
          monthly_price: number | null
          name: string | null
          views: number | null
        }
        Relationships: []
      }
      dorms_public: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          available: boolean | null
          capacity: number | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          dorm_name: string | null
          gallery_images: string[] | null
          gender_preference: string | null
          id: string | null
          image_url: string | null
          location: string | null
          monthly_price: number | null
          name: string | null
          price: number | null
          room_types: string | null
          room_types_json: Json | null
          services_amenities: string | null
          shuttle: boolean | null
          type: string | null
          university: string | null
          updated_at: string | null
          verification_status: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          available?: boolean | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          dorm_name?: string | null
          gallery_images?: string[] | null
          gender_preference?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          monthly_price?: number | null
          name?: string | null
          price?: number | null
          room_types?: string | null
          room_types_json?: Json | null
          services_amenities?: string | null
          shuttle?: boolean | null
          type?: string | null
          university?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area?: string | null
          available?: boolean | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          dorm_name?: string | null
          gallery_images?: string[] | null
          gender_preference?: string | null
          id?: string | null
          image_url?: string | null
          location?: string | null
          monthly_price?: number | null
          name?: string | null
          price?: number | null
          room_types?: string | null
          room_types_json?: Json | null
          services_amenities?: string | null
          shuttle?: boolean | null
          type?: string | null
          university?: string | null
          updated_at?: string | null
          verification_status?: string | null
          website?: string | null
        }
        Relationships: []
      }
      engagement_metrics_daily: {
        Row: {
          active_users: number | null
          date: string | null
          favorites: number | null
          inquiries: number | null
          views: number | null
        }
        Relationships: []
      }
      owner_messaging_info: {
        Row: {
          full_name: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      owner_performance_view: {
        Row: {
          dorm_id: string | null
          dorm_name: string | null
          favorites: number | null
          inquiries: number | null
          owner_id: string | null
          views: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dorms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owner_messaging_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dorms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
      }
      security_rls_overview: {
        Row: {
          delete_policies: number | null
          insert_policies: number | null
          is_sensitive: boolean | null
          policy_count: number | null
          rls_enabled: boolean | null
          security_status: string | null
          select_policies: number | null
          table_name: unknown
          update_policies: number | null
        }
        Relationships: []
      }
      user_activity_summary: {
        Row: {
          email: string | null
          favorites: number | null
          full_name: string | null
          last_login: string | null
          profile_completion_score: number | null
          total_interactions: number | null
          tours_booked: number | null
          user_id: string | null
          views: number | null
        }
        Relationships: []
      }
      user_growth_daily: {
        Row: {
          date: string | null
          new_owners: number | null
          new_students: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_dorm: {
        Args: {
          p_address?: string
          p_amenities?: string[]
          p_area?: string
          p_available?: boolean
          p_capacity?: number
          p_cover_image?: string
          p_description?: string
          p_dorm_id: string
          p_dorm_name?: string
          p_gallery_images?: string[]
          p_gender_preference?: string
          p_image_url?: string
          p_name?: string
          p_shuttle?: boolean
          p_verification_status?: string
        }
        Returns: Json
      }
      admin_update_verification_status: {
        Args: {
          p_dorm_id: string
          p_new_status: string
          p_rejection_reason?: string
        }
        Returns: Json
      }
      analytics_summary: { Args: never; Returns: Json }
      analytics_timeseries: {
        Args: { p_days?: number; p_metric: string }
        Returns: {
          date: string
          value: number
        }[]
      }
      are_friends: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      assert_security_baseline: { Args: never; Returns: boolean }
      check_booking_conflicts: {
        Args: {
          p_dorm_id: string
          p_owner_id: string
          p_requested_date: string
          p_requested_time: string
        }
        Returns: {
          conflict_details: Json
          conflict_type: string
          is_available: boolean
        }[]
      }
      check_notification_debounce: {
        Args: { p_dorm_id: string; p_event_type: string; p_owner_id: string }
        Returns: boolean
      }
      check_notification_rate_limit: {
        Args: { p_owner_id: string }
        Returns: boolean
      }
      check_rls_regression: {
        Args: never
        Returns: {
          issue_type: string
          message: string
          policy_count: number
          rls_enabled: boolean
          tablename: string
        }[]
      }
      check_whatsapp_debounce: {
        Args: { p_dorm_id: string; p_event_type: string; p_owner_id: string }
        Returns: boolean
      }
      check_whatsapp_rate_limit: {
        Args: { p_owner_id: string }
        Returns: boolean
      }
      debug_auth_state: { Args: never; Returns: Json }
      decrement_admin_balance: {
        Args: { p_admin_id: string; p_amount: number }
        Returns: undefined
      }
      decrement_owner_balance: {
        Args: { p_amount: number; p_owner_id: string }
        Returns: undefined
      }
      decrement_room_occupancy: {
        Args: { room_id: string }
        Returns: undefined
      }
      find_next_available_slot: {
        Args: {
          p_dorm_id: string
          p_owner_id: string
          p_preferred_time: string
          p_start_from: string
        }
        Returns: {
          available_date: string
          available_time: string
        }[]
      }
      generate_share_code: { Args: never; Returns: string }
      get_current_owner_id: { Args: never; Returns: string }
      get_current_student_id: { Args: never; Returns: string }
      get_mutual_friends_count: {
        Args: { user_a: string; user_b: string }
        Returns: number
      }
      get_or_create_conversation: {
        Args: { p_user_a_id: string; p_user_b_id: string }
        Returns: string
      }
      get_owner_display_info: {
        Args: { owner_uuid: string }
        Returns: {
          full_name: string
          id: string
          profile_photo_url: string
        }[]
      }
      get_support_admin_id: { Args: never; Returns: string }
      get_table_security_status: {
        Args: never
        Returns: {
          policy_count: number
          rls_enabled: boolean
          tablename: string
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
      }
      increment_admin_balance: {
        Args: { p_admin_id: string; p_amount: number }
        Returns: undefined
      }
      increment_collection_views: {
        Args: { p_share_code: string }
        Returns: undefined
      }
      increment_owner_balance: {
        Args: { p_amount: number; p_owner_id: string }
        Returns: undefined
      }
      increment_room_occupancy: {
        Args: { room_id: string }
        Returns: undefined
      }
      insert_owner_dorm: {
        Args: {
          p_address: string
          p_amenities: string[]
          p_area: string
          p_capacity: number
          p_cover_image: string
          p_description: string
          p_dorm_name: string
          p_email: string
          p_gallery_images: string[]
          p_gender_preference: string
          p_image_url: string
          p_monthly_price: number
          p_name: string
          p_owner_id: string
          p_phone_number: string
          p_shuttle: boolean
          p_university: string
          p_website: string
        }
        Returns: string
      }
      is_active_owner: { Args: { owner_uuid: string }; Returns: boolean }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_blocked: { Args: { user_a: string; user_b: string }; Returns: boolean }
      is_current_user_owner: { Args: { p_owner_id: string }; Returns: boolean }
      is_verified_dorm_owner: { Args: { p_owner_id: string }; Returns: boolean }
      owner_can_view_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      recompute_dorm_engagement_scores: { Args: never; Returns: Json }
      reset_student_ai_memory: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      update_student_preference: {
        Args: {
          p_preference_type: string
          p_student_id: string
          p_value: string
        }
        Returns: undefined
      }
      user_is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
      user_owns_dorm: { Args: { p_dorm_id: string }; Returns: boolean }
      user_owns_dorm_direct: { Args: { p_dorm_id: string }; Returns: boolean }
    }
    Enums: {
      friendship_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "blocked"
        | "cancelled"
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
  public: {
    Enums: {
      friendship_status: [
        "pending",
        "accepted",
        "rejected",
        "blocked",
        "cancelled",
      ],
    },
  },
} as const
