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
      audit_log: {
        Row: {
          action: string
          actor: string | null
          actor_name: string | null
          at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          actor_name?: string | null
          at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          actor_name?: string | null
          at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      cash_sessions: {
        Row: {
          cashier_employee_id: string | null
          cashier_name: string | null
          closed_at: string | null
          closed_by: string | null
          closing_cash: number | null
          created_at: string
          id: string
          note: string | null
          opened_at: string
          opened_by: string | null
          opening_cash: number
        }
        Insert: {
          cashier_employee_id?: string | null
          cashier_name?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_cash?: number
        }
        Update: {
          cashier_employee_id?: string | null
          cashier_name?: string | null
          closed_at?: string | null
          closed_by?: string | null
          closing_cash?: number | null
          created_at?: string
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string | null
          opening_cash?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_cashier_employee_id_fkey"
            columns: ["cashier_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          disabled: boolean
          hidden: boolean
          icon: string | null
          id: string
          is_custom: boolean
          label: string
          sort_order: number
          updated_at: string
          vat_rate: number | null
        }
        Insert: {
          created_at?: string
          disabled?: boolean
          hidden?: boolean
          icon?: string | null
          id: string
          is_custom?: boolean
          label: string
          sort_order?: number
          updated_at?: string
          vat_rate?: number | null
        }
        Update: {
          created_at?: string
          disabled?: boolean
          hidden?: boolean
          icon?: string | null
          id?: string
          is_custom?: boolean
          label?: string
          sort_order?: number
          updated_at?: string
          vat_rate?: number | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          ice: string | null
          id: string
          last_visit_at: string | null
          name: string
          note: string | null
          phone: string | null
          total_spent: number
          updated_at: string
          visits: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          last_visit_at?: string | null
          name: string
          note?: string | null
          phone?: string | null
          total_spent?: number
          updated_at?: string
          visits?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          ice?: string | null
          id?: string
          last_visit_at?: string | null
          name?: string
          note?: string | null
          phone?: string | null
          total_spent?: number
          updated_at?: string
          visits?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          hourly_rate: number | null
          id: string
          name: string
          phone: string | null
          pin_hash: string | null
          role: Database["public"]["Enums"]["employee_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          hourly_rate?: number | null
          id?: string
          name: string
          phone?: string | null
          pin_hash?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          hourly_rate?: number | null
          id?: string
          name?: string
          phone?: string | null
          pin_hash?: string | null
          role?: Database["public"]["Enums"]["employee_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_address: string | null
          client_ice: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          discount: number
          from_order_id: string | null
          id: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          lines: Json
          notes: string | null
          number: string
          paid: boolean
          updated_at: string
          vat_rate: number
        }
        Insert: {
          client_address?: string | null
          client_ice?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          from_order_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["invoice_kind"]
          lines?: Json
          notes?: string | null
          number: string
          paid?: boolean
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          client_address?: string | null
          client_ice?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount?: number
          from_order_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["invoice_kind"]
          lines?: Json
          notes?: string | null
          number?: string
          paid?: boolean
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_from_order_id_fkey"
            columns: ["from_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_extras: {
        Row: {
          active: boolean
          created_at: string
          group_name: string | null
          id: string
          img: string | null
          name: string
          price: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_name?: string | null
          id: string
          img?: string | null
          name: string
          price?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          group_name?: string | null
          id?: string
          img?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          has_cuisson: boolean
          has_extras: boolean
          has_sauces: boolean
          hidden: boolean
          id: string
          img: string | null
          is_custom: boolean
          name: string
          out_of_stock: boolean
          price: number
          sort_order: number
          stock: number | null
          stock_threshold: number | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          has_cuisson?: boolean
          has_extras?: boolean
          has_sauces?: boolean
          hidden?: boolean
          id: string
          img?: string | null
          is_custom?: boolean
          name: string
          out_of_stock?: boolean
          price: number
          sort_order?: number
          stock?: number | null
          stock_threshold?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          has_cuisson?: boolean
          has_extras?: boolean
          has_sauces?: boolean
          hidden?: boolean
          id?: string
          img?: string | null
          is_custom?: boolean
          name?: string
          out_of_stock?: boolean
          price?: number
          sort_order?: number
          stock?: number | null
          stock_threshold?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_by: string | null
          cashier_id: string | null
          cashier_name: string | null
          client_id: string | null
          client_name: string | null
          created_at: string
          discount: number
          discount_reason: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          id: string
          lines: Json
          paid_at: string | null
          payments: Json
          refunded_by: string | null
          sent_to_kitchen_at: string | null
          session_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          table_no: string | null
          ticket_no: number
          total: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at: string
        }
        Insert: {
          cancelled_by?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          discount?: number
          discount_reason?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          lines?: Json
          paid_at?: string | null
          payments?: Json
          refunded_by?: string | null
          sent_to_kitchen_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_no?: string | null
          ticket_no?: number
          total?: number
          type: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Update: {
          cancelled_by?: string | null
          cashier_id?: string | null
          cashier_name?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          discount?: number
          discount_reason?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          id?: string
          lines?: Json
          paid_at?: string | null
          payments?: Json
          refunded_by?: string | null
          sent_to_kitchen_at?: string | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          table_no?: string | null
          ticket_no?: number
          total?: number
          type?: Database["public"]["Enums"]["order_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pin_attempts: {
        Row: {
          at: string
          device_id: string | null
          employee_id: string | null
          id: string
          ip: string | null
          success: boolean
        }
        Insert: {
          at?: string
          device_id?: string | null
          employee_id?: string | null
          id?: string
          ip?: string | null
          success: boolean
        }
        Update: {
          at?: string
          device_id?: string | null
          employee_id?: string | null
          id?: string
          ip?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pin_attempts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          address: string
          footer: string | null
          ice: string | null
          id: number
          name: string
          phone: string | null
          updated_at: string
          vat_rate: number
        }
        Insert: {
          address?: string
          footer?: string | null
          ice?: string | null
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          address?: string
          footer?: string | null
          ice?: string | null
          id?: number
          name?: string
          phone?: string | null
          updated_at?: string
          vat_rate?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          at: string
          by_name: string | null
          by_user: string | null
          delta: number
          id: string
          item_id: string | null
          item_name: string
          reason: string | null
        }
        Insert: {
          at?: string
          by_name?: string | null
          by_user?: string | null
          delta: number
          id?: string
          item_id?: string | null
          item_name: string
          reason?: string | null
        }
        Update: {
          at?: string
          by_name?: string | null
          by_user?: string | null
          delta?: number
          id?: string
          item_id?: string | null
          item_name?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manager" | "cashier"
      discount_type: "dh" | "percent"
      employee_role: "admin" | "manager" | "caissier"
      invoice_kind: "devis" | "facture"
      order_status: "en-cuisine" | "encaissee" | "annulee" | "remboursee"
      order_type: "sur-place" | "emporter" | "livrer" | "glovo"
      payment_method: "especes" | "carte" | "virement" | "glovo" | "autre"
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
      app_role: ["owner", "manager", "cashier"],
      discount_type: ["dh", "percent"],
      employee_role: ["admin", "manager", "caissier"],
      invoice_kind: ["devis", "facture"],
      order_status: ["en-cuisine", "encaissee", "annulee", "remboursee"],
      order_type: ["sur-place", "emporter", "livrer", "glovo"],
      payment_method: ["especes", "carte", "virement", "glovo", "autre"],
    },
  },
} as const
