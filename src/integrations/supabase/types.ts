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
            referencedRelation: "dorms"
            referencedColumns: ["id"]
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
      dorms: {
        Row: {
          address: string | null
          amenities: string[] | null
          area: string | null
          available: boolean | null
          capacity: number | null
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
      owners: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          age: number | null
          budget: number | null
          created_at: string | null
          distance_preference: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          preferred_university: string | null
          residential_area: string | null
          room_type: string | null
          roommate_needed: boolean | null
          university: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          budget?: number | null
          created_at?: string | null
          distance_preference?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          preferred_university?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          university?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          budget?: number | null
          created_at?: string | null
          distance_preference?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          preferred_university?: string | null
          residential_area?: string | null
          room_type?: string | null
          roommate_needed?: boolean | null
          university?: string | null
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
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "owner"
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
      app_role: ["admin", "moderator", "user", "owner"],
    },
  },
} as const
