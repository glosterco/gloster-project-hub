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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      contratista_users: {
        Row: {
          auth_user_id: string
          contratista_id: number
          created_at: string
          id: string
          permission_level: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          contratista_id: number
          created_at?: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          contratista_id?: number
          created_at?: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratista_users_contratista_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "Contratistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contratista_users_contratista"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "Contratistas"
            referencedColumns: ["id"]
          },
        ]
      }
      Contratistas: {
        Row: {
          auth_user_id: string | null
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          Experience: string | null
          id: number
          RUT: string | null
          Specialization: string | null
          Status: boolean | null
        }
        Insert: {
          auth_user_id?: string | null
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Experience?: string | null
          id?: number
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
        }
        Update: {
          auth_user_id?: string | null
          CompanyName?: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Experience?: string | null
          id?: number
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
        }
        Relationships: []
      }
      "Estados de pago": {
        Row: {
          Año: number | null
          Completion: boolean | null
          ExpiryDate: string | null
          id: number
          Mes: string | null
          Name: string
          Notes: string | null
          Progress: number | null
          Project: number | null
          Status: string | null
          Total: number | null
          URL: string | null
          URLContratista: string | null
          URLMandante: string | null
        }
        Insert: {
          Año?: number | null
          Completion?: boolean | null
          ExpiryDate?: string | null
          id?: number
          Mes?: string | null
          Name: string
          Notes?: string | null
          Progress?: number | null
          Project?: number | null
          Status?: string | null
          Total?: number | null
          URL?: string | null
          URLContratista?: string | null
          URLMandante?: string | null
        }
        Update: {
          Año?: number | null
          Completion?: boolean | null
          ExpiryDate?: string | null
          id?: number
          Mes?: string | null
          Name?: string
          Notes?: string | null
          Progress?: number | null
          Project?: number | null
          Status?: string | null
          Total?: number | null
          URL?: string | null
          URLContratista?: string | null
          URLMandante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Estados de pago_Project_fkey"
            columns: ["Project"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      mandante_project_folders: {
        Row: {
          created_at: string
          folder_name: string
          id: string
          mandante_id: number
          project_ids: number[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          folder_name: string
          id?: string
          mandante_id: number
          project_ids?: number[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          folder_name?: string
          id?: string
          mandante_id?: number
          project_ids?: number[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_mandante_project_folders_mandante"
            columns: ["mandante_id"]
            isOneToOne: false
            referencedRelation: "Mandantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandante_project_folders_mandante_fkey"
            columns: ["mandante_id"]
            isOneToOne: false
            referencedRelation: "Mandantes"
            referencedColumns: ["id"]
          },
        ]
      }
      mandante_users: {
        Row: {
          auth_user_id: string
          created_at: string
          id: string
          mandante_id: number
          permission_level: string
          updated_at: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string
          id?: string
          mandante_id: number
          permission_level?: string
          updated_at?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string
          id?: string
          mandante_id?: number
          permission_level?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandante_users_mandante_id_fkey"
            columns: ["mandante_id"]
            isOneToOne: false
            referencedRelation: "Mandantes"
            referencedColumns: ["id"]
          },
        ]
      }
      Mandantes: {
        Row: {
          auth_user_id: string | null
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          id: number
          Status: boolean | null
        }
        Insert: {
          auth_user_id?: string | null
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          id?: number
          Status?: boolean | null
        }
        Update: {
          auth_user_id?: string | null
          CompanyName?: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          id?: number
          Status?: boolean | null
        }
        Relationships: []
      }
      Proyectos: {
        Row: {
          Budget: number | null
          Contratista: number
          Currency: string | null
          Description: string | null
          Duration: number | null
          ExpiryRate: number | null
          FirstPayment: string | null
          id: number
          Location: string | null
          Name: string | null
          Owner: number | null
          Requierment: string[] | null
          StartDate: string | null
          Status: boolean | null
          URL: string | null
        }
        Insert: {
          Budget?: number | null
          Contratista: number
          Currency?: string | null
          Description?: string | null
          Duration?: number | null
          ExpiryRate?: number | null
          FirstPayment?: string | null
          id?: number
          Location?: string | null
          Name?: string | null
          Owner?: number | null
          Requierment?: string[] | null
          StartDate?: string | null
          Status?: boolean | null
          URL?: string | null
        }
        Update: {
          Budget?: number | null
          Contratista?: number
          Currency?: string | null
          Description?: string | null
          Duration?: number | null
          ExpiryRate?: number | null
          FirstPayment?: string | null
          id?: number
          Location?: string | null
          Name?: string | null
          Owner?: number | null
          Requierment?: string[] | null
          StartDate?: string | null
          Status?: boolean | null
          URL?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Proyectos_Contratista_fkey"
            columns: ["Contratista"]
            isOneToOne: false
            referencedRelation: "Contratistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Proyectos_Owner_fkey"
            columns: ["Owner"]
            isOneToOne: false
            referencedRelation: "Mandantes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          auth_user_id: string
          created_at: string | null
          entity_id: number
          id: number
          local_username: string | null
          login_provider: string
          password_hash: string | null
          role_type: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          entity_id: number
          id?: never
          local_username?: string | null
          login_provider?: string
          password_hash?: string | null
          role_type: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          entity_id?: number
          id?: never
          local_username?: string | null
          login_provider?: string
          password_hash?: string | null
          role_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_contractor_urls: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_mandante_ids: {
        Args: { user_id: string }
        Returns: number[]
      }
      is_contractor_related: {
        Args: { _contratista_id: number; _user_id: string }
        Returns: boolean
      }
      is_project_related: {
        Args: { _project_id: number; _user_id: string }
        Returns: boolean
      }
      send_contractor_payment_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      set_config: {
        Args: {
          is_local?: boolean
          setting_name: string
          setting_value: string
        }
        Returns: undefined
      }
      update_payment_states_weekly: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_email_payment_access: {
        Args: { payment_id: number; user_email: string }
        Returns: boolean
      }
      verify_mandante_email_access: {
        Args: { email: string; payment_id: number }
        Returns: boolean
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
