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
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          payload: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience: string
          channel: Database["public"]["Enums"]["campaign_channel"]
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          starts_at: string | null
          telegram_url: string | null
          updated_at: string
          utm: Json
          whatsapp_url: string | null
        }
        Insert: {
          audience?: string
          channel?: Database["public"]["Enums"]["campaign_channel"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          starts_at?: string | null
          telegram_url?: string | null
          updated_at?: string
          utm?: Json
          whatsapp_url?: string | null
        }
        Update: {
          audience?: string
          channel?: Database["public"]["Enums"]["campaign_channel"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          starts_at?: string | null
          telegram_url?: string | null
          updated_at?: string
          utm?: Json
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      consent_logs: {
        Row: {
          categories: Json
          created_at: string
          fingerprint: string | null
          id: string
          ip_hash: string | null
          policy_version: string
          ua_hash: string | null
          user_id: string | null
        }
        Insert: {
          categories?: Json
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          policy_version?: string
          ua_hash?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: Json
          created_at?: string
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          policy_version?: string
          ua_hash?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          payload: Json
          type: Database["public"]["Enums"]["lead_event_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          payload?: Json
          type: Database["public"]["Enums"]["lead_event_type"]
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          payload?: Json
          type?: Database["public"]["Enums"]["lead_event_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          campaign_id: string | null
          consent: Json
          created_at: string
          double_opt_in: boolean
          double_opt_in_at: string | null
          email: string
          hub_synced_at: string | null
          id: string
          ip_hash: string | null
          name: string | null
          phone: string | null
          source: Database["public"]["Enums"]["lead_source"]
          ua_hash: string | null
          unsubscribed_at: string | null
          updated_at: string
          utm: Json
        }
        Insert: {
          campaign_id?: string | null
          consent?: Json
          created_at?: string
          double_opt_in?: boolean
          double_opt_in_at?: string | null
          email: string
          hub_synced_at?: string | null
          id?: string
          ip_hash?: string | null
          name?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          ua_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          utm?: Json
        }
        Update: {
          campaign_id?: string | null
          consent?: Json
          created_at?: string
          double_opt_in?: boolean
          double_opt_in_at?: string | null
          email?: string
          hub_synced_at?: string | null
          id?: string
          ip_hash?: string | null
          name?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          ua_hash?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          utm?: Json
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          locale: string | null
          marketing_opt_in: boolean
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          locale?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          locale?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          id: string
          metadata: Json
          plan_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          plan_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          plan_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscribers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_active: boolean
          name: string
          perks: Json
          price_cents: number
          sort_order: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name: string
          perks?: Json
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          name?: string
          perks?: Json
          price_cents?: number
          sort_order?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      subscription_plans_public: {
        Row: {
          code: string | null
          currency: string | null
          description: string | null
          id: string | null
          interval: Database["public"]["Enums"]["plan_interval"] | null
          is_active: boolean | null
          name: string | null
          perks: Json | null
          price_cents: number | null
          sort_order: number | null
        }
        Insert: {
          code?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          interval?: Database["public"]["Enums"]["plan_interval"] | null
          is_active?: boolean | null
          name?: string | null
          perks?: Json | null
          price_cents?: number | null
          sort_order?: number | null
        }
        Update: {
          code?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          interval?: Database["public"]["Enums"]["plan_interval"] | null
          is_active?: boolean | null
          name?: string | null
          perks?: Json | null
          price_cents?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "editor" | "subscriber" | "user"
      campaign_channel: "whatsapp" | "telegram" | "newsletter" | "mixed"
      lead_event_type:
        | "click"
        | "opt_in"
        | "double_opt_in"
        | "group_join"
        | "unsubscribe"
        | "sync_hub"
        | "sync_failed"
      lead_source:
        | "newsletter"
        | "group_whatsapp"
        | "group_telegram"
        | "paywall"
        | "lead_magnet"
        | "other"
      plan_interval: "month" | "year" | "one_time"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "paused"
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
      app_role: ["admin", "editor", "subscriber", "user"],
      campaign_channel: ["whatsapp", "telegram", "newsletter", "mixed"],
      lead_event_type: [
        "click",
        "opt_in",
        "double_opt_in",
        "group_join",
        "unsubscribe",
        "sync_hub",
        "sync_failed",
      ],
      lead_source: [
        "newsletter",
        "group_whatsapp",
        "group_telegram",
        "paywall",
        "lead_magnet",
        "other",
      ],
      plan_interval: ["month", "year", "one_time"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "paused",
      ],
    },
  },
} as const
