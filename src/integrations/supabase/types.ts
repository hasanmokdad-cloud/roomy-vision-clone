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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          dorm_id: string
          id: string
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
          dorm_id: string
          id?: string
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
          dorm_id?: string
          id?: string
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
      conversations: {
        Row: {
          created_at: string
          dorm_id: string | null
          id: string
          owner_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dorm_id?: string | null
          id?: string
          owner_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dorm_id?: string | null
          id?: string
          owner_id?: string
          student_id?: string
          updated_at?: string
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
          gender_preference: string | null
          id: string
          image_url: string | null
          location: string
          monthly_price: number | null
          name: string
          owner_id: string | null
          phone_number: string | null
          price: number
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
          gender_preference?: string | null
          id?: string
          image_url?: string | null
          location: string
          monthly_price?: number | null
          name: string
          owner_id?: string | null
          phone_number?: string | null
          price: number
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
          gender_preference?: string | null
          id?: string
          image_url?: string | null
          location?: string
          monthly_price?: number | null
          name?: string
          owner_id?: string | null
          phone_number?: string | null
          price?: number
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
            referencedRelation: "owners"
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
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
          phone_number: string | null
          phone_verified: boolean | null
          profile_photo_url: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          whatsapp_language: string | null
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
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_language?: string | null
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
          phone_number?: string | null
          phone_verified?: boolean | null
          profile_photo_url?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_language?: string | null
        }
        Relationships: []
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
      rooms: {
        Row: {
          area_m2: number | null
          available: boolean | null
          created_at: string
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
        }
        Insert: {
          area_m2?: number | null
          available?: boolean | null
          created_at?: string
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
        }
        Update: {
          area_m2?: number | null
          available?: boolean | null
          created_at?: string
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
          student_id: string
        }
        Insert: {
          created_at?: string | null
          dorm_id: string
          id?: string
          room_id: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          dorm_id?: string
          id?: string
          room_id?: string
          student_id?: string
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
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
      students: {
        Row: {
          age: number | null
          ai_confidence_score: number | null
          budget: number | null
          created_at: string | null
          distance_preference: string | null
          email: string
          favorite_areas: string[] | null
          full_name: string
          gender: string | null
          id: string
          last_login: string | null
          phone_number: string | null
          phone_verified: boolean | null
          preferred_amenities: string[] | null
          preferred_room_types: string[] | null
          preferred_university: string | null
          profile_completion_score: number | null
          profile_photo_url: string | null
          residential_area: string | null
          room_type: string | null
          roommate_needed: boolean | null
          status: string | null
          university: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          ai_confidence_score?: number | null
          budget?: number | null
          created_at?: string | null
          distance_preference?: string | null
          email: string
          favorite_areas?: string[] | null
          full_name: string
          gender?: string | null
          id?: string
          last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_amenities?: string[] | null
          preferred_room_types?: string[] | null
          preferred_university?: string | null
          profile_completion_score?: number | null
          profile_photo_url?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          status?: string | null
          university?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          ai_confidence_score?: number | null
          budget?: number | null
          created_at?: string | null
          distance_preference?: string | null
          email?: string
          favorite_areas?: string[] | null
          full_name?: string
          gender?: string | null
          id?: string
          last_login?: string | null
          phone_number?: string | null
          phone_verified?: boolean | null
          preferred_amenities?: string[] | null
          preferred_room_types?: string[] | null
          preferred_university?: string | null
          profile_completion_score?: number | null
          profile_photo_url?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          status?: string | null
          university?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
            referencedRelation: "owner_performance_view"
            referencedColumns: ["dorm_id"]
          },
        ]
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
            referencedRelation: "owners"
            referencedColumns: ["id"]
          },
        ]
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
      analytics_summary: { Args: never; Returns: Json }
      analytics_timeseries: {
        Args: { p_days?: number; p_metric: string }
        Returns: {
          date: string
          value: number
        }[]
      }
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
      check_whatsapp_debounce: {
        Args: { p_dorm_id: string; p_event_type: string; p_owner_id: string }
        Returns: boolean
      }
      check_whatsapp_rate_limit: {
        Args: { p_owner_id: string }
        Returns: boolean
      }
      generate_share_code: { Args: never; Returns: string }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: { _role_name: string; _user_id: string }
        Returns: boolean
      }
      increment_collection_views: {
        Args: { p_share_code: string }
        Returns: undefined
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
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
  public: {
    Enums: {},
  },
} as const
