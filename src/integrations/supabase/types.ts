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
      Contratistas: {
        Row: {
          Adress: string | null
          City: string | null
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          Experience: string | null
          id: number
          Password: string | null
          RUT: string | null
          Specialization: string | null
          Status: boolean | null
          Username: string | null
        }
        Insert: {
          Adress?: string | null
          City?: string | null
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Experience?: string | null
          id?: number
          Password?: string | null
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
          Username?: string | null
        }
        Update: {
          Adress?: string | null
          City?: string | null
          CompanyName?: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Experience?: string | null
          id?: number
          Password?: string | null
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
          Username?: string | null
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
          Project: number | null
          Status: string | null
          Total: number | null
          URL: string | null
        }
        Insert: {
          Año?: number | null
          Completion?: boolean | null
          ExpiryDate?: string | null
          id?: number
          Mes?: string | null
          Name?: string
          Project?: number | null
          Status?: string | null
          Total?: number | null
          URL?: string | null
        }
        Update: {
          Año?: number | null
          Completion?: boolean | null
          ExpiryDate?: string | null
          id?: number
          Mes?: string | null
          Name?: string
          Project?: number | null
          Status?: string | null
          Total?: number | null
          URL?: string | null
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
      Mandantes: {
        Row: {
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          id: number
          Status: boolean | null
        }
        Insert: {
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          id?: number
          Status?: boolean | null
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
