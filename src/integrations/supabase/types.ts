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
      adicional_actions_history: {
        Row: {
          action_by_email: string | null
          action_by_name: string | null
          action_type: string
          adicional_id: number
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          action_by_email?: string | null
          action_by_name?: string | null
          action_type: string
          adicional_id: number
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          action_by_email?: string | null
          action_by_name?: string | null
          action_type?: string
          adicional_id?: number
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adicional_actions_history_adicional_id_fkey"
            columns: ["adicional_id"]
            isOneToOne: false
            referencedRelation: "Adicionales"
            referencedColumns: ["id"]
          },
        ]
      }
      Adicionales: {
        Row: {
          action_notes: string | null
          approved_at: string | null
          approved_by_email: string | null
          approved_by_name: string | null
          Categoria: string | null
          Correlativo: number | null
          created_at: string
          Descripcion: string | null
          Especialidad: string | null
          GG: number | null
          id: number
          Monto_aprobado: number | null
          Monto_presentado: number | null
          paused_at: string | null
          paused_days: number | null
          Proyecto: number | null
          rejection_notes: string | null
          Status: string | null
          Subtotal: number | null
          Titulo: string | null
          URL: string | null
          Utilidades: number | null
          Vencimiento: string | null
        }
        Insert: {
          action_notes?: string | null
          approved_at?: string | null
          approved_by_email?: string | null
          approved_by_name?: string | null
          Categoria?: string | null
          Correlativo?: number | null
          created_at?: string
          Descripcion?: string | null
          Especialidad?: string | null
          GG?: number | null
          id?: number
          Monto_aprobado?: number | null
          Monto_presentado?: number | null
          paused_at?: string | null
          paused_days?: number | null
          Proyecto?: number | null
          rejection_notes?: string | null
          Status?: string | null
          Subtotal?: number | null
          Titulo?: string | null
          URL?: string | null
          Utilidades?: number | null
          Vencimiento?: string | null
        }
        Update: {
          action_notes?: string | null
          approved_at?: string | null
          approved_by_email?: string | null
          approved_by_name?: string | null
          Categoria?: string | null
          Correlativo?: number | null
          created_at?: string
          Descripcion?: string | null
          Especialidad?: string | null
          GG?: number | null
          id?: number
          Monto_aprobado?: number | null
          Monto_presentado?: number | null
          paused_at?: string | null
          paused_days?: number | null
          Proyecto?: number | null
          rejection_notes?: string | null
          Status?: string | null
          Subtotal?: number | null
          Titulo?: string | null
          URL?: string | null
          Utilidades?: number | null
          Vencimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Adicionales_Proyecto_fkey"
            columns: ["Proyecto"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos: {
        Row: {
          created_at: string
          email: string
          especialidad: string | null
          id: number
          nombre: string
          proyecto_id: number
          rol: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          email: string
          especialidad?: string | null
          id?: number
          nombre: string
          proyecto_id: number
          rol: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          especialidad?: string | null
          id?: number
          nombre?: string
          proyecto_id?: number
          rol?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contactos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
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
          Adicionales: boolean | null
          auth_user_id: string | null
          CCEmail: string | null
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          Documentos: boolean | null
          Experience: string | null
          Fotos: boolean | null
          id: number
          Licitaciones: boolean | null
          Presupuesto: boolean | null
          Reuniones: boolean | null
          RFI: boolean | null
          RUT: string | null
          Specialization: string | null
          Status: boolean | null
          URLCC: string | null
        }
        Insert: {
          Adicionales?: boolean | null
          auth_user_id?: string | null
          CCEmail?: string | null
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Documentos?: boolean | null
          Experience?: string | null
          Fotos?: boolean | null
          id?: number
          Licitaciones?: boolean | null
          Presupuesto?: boolean | null
          Reuniones?: boolean | null
          RFI?: boolean | null
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
          URLCC?: string | null
        }
        Update: {
          Adicionales?: boolean | null
          auth_user_id?: string | null
          CCEmail?: string | null
          CompanyName?: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Documentos?: boolean | null
          Experience?: string | null
          Fotos?: boolean | null
          id?: number
          Licitaciones?: boolean | null
          Presupuesto?: boolean | null
          Reuniones?: boolean | null
          RFI?: boolean | null
          RUT?: string | null
          Specialization?: string | null
          Status?: boolean | null
          URLCC?: string | null
        }
        Relationships: []
      }
      Documentos: {
        Row: {
          created_at: string
          DriveId: string | null
          Extension: string | null
          id: number
          MimeType: string | null
          moved_at: string | null
          moved_by_email: string | null
          moved_by_name: string | null
          Nombre: string | null
          Proyecto: number | null
          Size: number | null
          Tipo: string | null
          uploaded_by_email: string | null
          uploaded_by_name: string | null
          WebViewLink: string | null
        }
        Insert: {
          created_at?: string
          DriveId?: string | null
          Extension?: string | null
          id?: number
          MimeType?: string | null
          moved_at?: string | null
          moved_by_email?: string | null
          moved_by_name?: string | null
          Nombre?: string | null
          Proyecto?: number | null
          Size?: number | null
          Tipo?: string | null
          uploaded_by_email?: string | null
          uploaded_by_name?: string | null
          WebViewLink?: string | null
        }
        Update: {
          created_at?: string
          DriveId?: string | null
          Extension?: string | null
          id?: number
          MimeType?: string | null
          moved_at?: string | null
          moved_by_email?: string | null
          moved_by_name?: string | null
          Nombre?: string | null
          Proyecto?: number | null
          Size?: number | null
          Tipo?: string | null
          uploaded_by_email?: string | null
          uploaded_by_name?: string | null
          WebViewLink?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Documentos_Proyecto_fkey"
            columns: ["Proyecto"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      early_adopters: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      "Estados de pago": {
        Row: {
          Año: number | null
          approval_progress: number | null
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
          total_approvals_required: number | null
          URL: string | null
          URLContratista: string | null
          URLMandante: string | null
        }
        Insert: {
          Año?: number | null
          approval_progress?: number | null
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
          total_approvals_required?: number | null
          URL?: string | null
          URLContratista?: string | null
          URLMandante?: string | null
        }
        Update: {
          Año?: number | null
          approval_progress?: number | null
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
          total_approvals_required?: number | null
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
      Fotos: {
        Row: {
          created_at: string
          DriveId: string | null
          id: number
          MimeType: string | null
          Nombre: string | null
          Proyecto: number | null
          uploaded_by_email: string | null
          uploaded_by_name: string | null
          WebViewLink: string | null
        }
        Insert: {
          created_at?: string
          DriveId?: string | null
          id?: number
          MimeType?: string | null
          Nombre?: string | null
          Proyecto?: number | null
          uploaded_by_email?: string | null
          uploaded_by_name?: string | null
          WebViewLink?: string | null
        }
        Update: {
          created_at?: string
          DriveId?: string | null
          id?: number
          MimeType?: string | null
          Nombre?: string | null
          Proyecto?: number | null
          uploaded_by_email?: string | null
          uploaded_by_name?: string | null
          WebViewLink?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Fotos_Proyecto_fkey"
            columns: ["Proyecto"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      LicitacionDocumentos: {
        Row: {
          created_at: string
          id: number
          licitacion_id: number
          nombre: string
          size: number | null
          tipo: string | null
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          licitacion_id: number
          nombre: string
          size?: number | null
          tipo?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          licitacion_id?: number
          nombre?: string
          size?: number | null
          tipo?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "LicitacionDocumentos_licitacion_id_fkey"
            columns: ["licitacion_id"]
            isOneToOne: false
            referencedRelation: "Licitaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      Licitaciones: {
        Row: {
          created_at: string | null
          descripcion: string
          especificaciones: string | null
          estado: string | null
          gastos_generales: number | null
          id: number
          iva_porcentaje: number | null
          mandante_id: number
          mensaje_oferentes: string | null
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          especificaciones?: string | null
          estado?: string | null
          gastos_generales?: number | null
          id?: never
          iva_porcentaje?: number | null
          mandante_id: number
          mensaje_oferentes?: string | null
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          especificaciones?: string | null
          estado?: string | null
          gastos_generales?: number | null
          id?: never
          iva_porcentaje?: number | null
          mandante_id?: number
          mensaje_oferentes?: string | null
          nombre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Licitaciones_mandante_id_fkey"
            columns: ["mandante_id"]
            isOneToOne: false
            referencedRelation: "Mandantes"
            referencedColumns: ["id"]
          },
        ]
      }
      LicitacionEventos: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string
          id: number
          licitacion_id: number
          requiere_archivos: boolean
          titulo: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha: string
          id?: never
          licitacion_id: number
          requiere_archivos?: boolean
          titulo: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: never
          licitacion_id?: number
          requiere_archivos?: boolean
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "LicitacionEventos_licitacion_id_fkey"
            columns: ["licitacion_id"]
            isOneToOne: false
            referencedRelation: "Licitaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      LicitacionItems: {
        Row: {
          cantidad: number | null
          created_at: string
          descripcion: string
          id: number
          licitacion_id: number
          orden: number
          precio_total: number | null
          precio_unitario: number | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          created_at?: string
          descripcion: string
          id?: never
          licitacion_id: number
          orden?: number
          precio_total?: number | null
          precio_unitario?: number | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          created_at?: string
          descripcion?: string
          id?: never
          licitacion_id?: number
          orden?: number
          precio_total?: number | null
          precio_unitario?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "LicitacionItems_licitacion_id_fkey"
            columns: ["licitacion_id"]
            isOneToOne: false
            referencedRelation: "Licitaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      LicitacionOferentes: {
        Row: {
          created_at: string
          email: string
          id: number
          licitacion_id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
          licitacion_id: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
          licitacion_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "LicitacionOferentes_licitacion_id_fkey"
            columns: ["licitacion_id"]
            isOneToOne: false
            referencedRelation: "Licitaciones"
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
          Adicionales: boolean | null
          auth_user_id: string | null
          CC: string | null
          CompanyName: string
          ContactEmail: string | null
          ContactName: string | null
          ContactPhone: number | null
          Documentos: boolean | null
          Fotos: boolean | null
          id: number
          Licitaciones: boolean | null
          Presupuesto: boolean | null
          Reuniones: boolean | null
          RFI: boolean | null
          Status: boolean | null
        }
        Insert: {
          Adicionales?: boolean | null
          auth_user_id?: string | null
          CC?: string | null
          CompanyName: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Documentos?: boolean | null
          Fotos?: boolean | null
          id?: number
          Licitaciones?: boolean | null
          Presupuesto?: boolean | null
          Reuniones?: boolean | null
          RFI?: boolean | null
          Status?: boolean | null
        }
        Update: {
          Adicionales?: boolean | null
          auth_user_id?: string | null
          CC?: string | null
          CompanyName?: string
          ContactEmail?: string | null
          ContactName?: string | null
          ContactPhone?: number | null
          Documentos?: boolean | null
          Fotos?: boolean | null
          id?: number
          Licitaciones?: boolean | null
          Presupuesto?: boolean | null
          Reuniones?: boolean | null
          RFI?: boolean | null
          Status?: boolean | null
        }
        Relationships: []
      }
      payment_approvals: {
        Row: {
          approval_status: string
          approved_at: string | null
          approver_email: string
          approver_name: string | null
          created_at: string
          id: string
          notes: string | null
          payment_id: number
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approver_email: string
          approver_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_id: number
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approver_email?: string
          approver_name?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          payment_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_approvals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "Estados de pago"
            referencedColumns: ["id"]
          },
        ]
      }
      Presupuesto: {
        Row: {
          "Avance Acumulado": number | null
          "Avance Parcial": number | null
          Cantidad: number | null
          created_at: string
          id: number
          ID: string | null
          Item: string | null
          Project_ID: number | null
          PU: number | null
          Total: number | null
          "Ult. Actualizacion": string | null
          Unidad: string | null
        }
        Insert: {
          "Avance Acumulado"?: number | null
          "Avance Parcial"?: number | null
          Cantidad?: number | null
          created_at?: string
          id?: number
          ID?: string | null
          Item?: string | null
          Project_ID?: number | null
          PU?: number | null
          Total?: number | null
          "Ult. Actualizacion"?: string | null
          Unidad?: string | null
        }
        Update: {
          "Avance Acumulado"?: number | null
          "Avance Parcial"?: number | null
          Cantidad?: number | null
          created_at?: string
          id?: number
          ID?: string | null
          Item?: string | null
          Project_ID?: number | null
          PU?: number | null
          Total?: number | null
          "Ult. Actualizacion"?: string | null
          Unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Presupuesto_Project_ID_fkey"
            columns: ["Project_ID"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      PresupuestoHistorico: {
        Row: {
          created_at: string
          id: number
          Project_ID: number
          TotalAcumulado: number
          TotalParcial: number
        }
        Insert: {
          created_at?: string
          id?: number
          Project_ID: number
          TotalAcumulado?: number
          TotalParcial?: number
        }
        Update: {
          created_at?: string
          id?: number
          Project_ID?: number
          TotalAcumulado?: number
          TotalParcial?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_project"
            columns: ["Project_ID"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      PresupuestoHistoricoDetalle: {
        Row: {
          created_at: string
          id: number
          Item_ID: number
          Item_Nombre: string | null
          Monto_Parcial: number
          Monto_Total: number | null
          Porcentaje_Acumulado: number | null
          Porcentaje_Parcial: number | null
          Project_ID: number
        }
        Insert: {
          created_at?: string
          id?: never
          Item_ID: number
          Item_Nombre?: string | null
          Monto_Parcial?: number
          Monto_Total?: number | null
          Porcentaje_Acumulado?: number | null
          Porcentaje_Parcial?: number | null
          Project_ID: number
        }
        Update: {
          created_at?: string
          id?: never
          Item_ID?: number
          Item_Nombre?: string | null
          Monto_Parcial?: number
          Monto_Total?: number | null
          Porcentaje_Acumulado?: number | null
          Porcentaje_Parcial?: number | null
          Project_ID?: number
        }
        Relationships: []
      }
      project_approval_config: {
        Row: {
          approval_order_matters: boolean
          created_at: string
          id: string
          project_id: number
          required_approvals: number
          updated_at: string
        }
        Insert: {
          approval_order_matters?: boolean
          created_at?: string
          id?: string
          project_id: number
          required_approvals?: number
          updated_at?: string
        }
        Update: {
          approval_order_matters?: boolean
          created_at?: string
          id?: string
          project_id?: number
          required_approvals?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_approval_config_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      project_approvers: {
        Row: {
          approval_order: number
          approver_email: string
          approver_name: string | null
          Area: string | null
          config_id: string
          created_at: string
          id: string
        }
        Insert: {
          approval_order?: number
          approver_email: string
          approver_name?: string | null
          Area?: string | null
          config_id: string
          created_at?: string
          id?: string
        }
        Update: {
          approval_order?: number
          approver_email?: string
          approver_name?: string | null
          Area?: string | null
          config_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_approvers_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "project_approval_config"
            referencedColumns: ["id"]
          },
        ]
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
          GG: number | null
          id: number
          Location: string | null
          Name: string | null
          Owner: number | null
          Requierment: string[] | null
          StartDate: string | null
          Status: boolean | null
          URL: string | null
          URL_Ad: string | null
          URL_docs: string | null
          URL_Fotos: string | null
          URL_RFI: string | null
          Utilidades: number | null
        }
        Insert: {
          Budget?: number | null
          Contratista: number
          Currency?: string | null
          Description?: string | null
          Duration?: number | null
          ExpiryRate?: number | null
          FirstPayment?: string | null
          GG?: number | null
          id?: number
          Location?: string | null
          Name?: string | null
          Owner?: number | null
          Requierment?: string[] | null
          StartDate?: string | null
          Status?: boolean | null
          URL?: string | null
          URL_Ad?: string | null
          URL_docs?: string | null
          URL_Fotos?: string | null
          URL_RFI?: string | null
          Utilidades?: number | null
        }
        Update: {
          Budget?: number | null
          Contratista?: number
          Currency?: string | null
          Description?: string | null
          Duration?: number | null
          ExpiryRate?: number | null
          FirstPayment?: string | null
          GG?: number | null
          id?: number
          Location?: string | null
          Name?: string | null
          Owner?: number | null
          Requierment?: string[] | null
          StartDate?: string | null
          Status?: boolean | null
          URL?: string | null
          URL_Ad?: string | null
          URL_docs?: string | null
          URL_Fotos?: string | null
          URL_RFI?: string | null
          Utilidades?: number | null
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
      Reuniones: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      RFI: {
        Row: {
          Correlativo: number | null
          created_at: string
          Descripcion: string | null
          Especialidad: string | null
          Fecha_Respuesta: string | null
          Fecha_Vencimiento: string | null
          id: number
          Proyecto: number | null
          Respuesta: string | null
          Status: string | null
          Titulo: string | null
          Urgencia: string | null
          URL: string | null
        }
        Insert: {
          Correlativo?: number | null
          created_at?: string
          Descripcion?: string | null
          Especialidad?: string | null
          Fecha_Respuesta?: string | null
          Fecha_Vencimiento?: string | null
          id?: number
          Proyecto?: number | null
          Respuesta?: string | null
          Status?: string | null
          Titulo?: string | null
          Urgencia?: string | null
          URL?: string | null
        }
        Update: {
          Correlativo?: number | null
          created_at?: string
          Descripcion?: string | null
          Especialidad?: string | null
          Fecha_Respuesta?: string | null
          Fecha_Vencimiento?: string | null
          id?: number
          Proyecto?: number | null
          Respuesta?: string | null
          Status?: string | null
          Titulo?: string | null
          Urgencia?: string | null
          URL?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "RFI_Proyecto_fkey"
            columns: ["Proyecto"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_destinatarios: {
        Row: {
          contacto_id: number
          enviado_at: string
          id: number
          respondido: boolean | null
          rfi_id: number
        }
        Insert: {
          contacto_id: number
          enviado_at?: string
          id?: number
          respondido?: boolean | null
          rfi_id: number
        }
        Update: {
          contacto_id?: number
          enviado_at?: string
          id?: number
          respondido?: boolean | null
          rfi_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfi_destinatarios_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_destinatarios_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "RFI"
            referencedColumns: ["id"]
          },
        ]
      }
      rfi_messages: {
        Row: {
          attachments_url: string | null
          author_email: string
          author_name: string | null
          author_role: string
          created_at: string
          id: string
          message_text: string
          project_id: number
          rfi_id: number
        }
        Insert: {
          attachments_url?: string | null
          author_email: string
          author_name?: string | null
          author_role: string
          created_at?: string
          id?: string
          message_text: string
          project_id: number
          rfi_id: number
        }
        Update: {
          attachments_url?: string | null
          author_email?: string
          author_name?: string | null
          author_role?: string
          created_at?: string
          id?: string
          message_text?: string
          project_id?: number
          rfi_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rfi_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfi_messages_rfi_id_fkey"
            columns: ["rfi_id"]
            isOneToOne: false
            referencedRelation: "RFI"
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
          password: string | null
          role_type: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          entity_id: number
          id?: never
          local_username?: string | null
          login_provider?: string
          password?: string | null
          role_type: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          entity_id?: number
          id?: never
          local_username?: string | null
          login_provider?: string
          password?: string | null
          role_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_contractor_cc_urls: { Args: never; Returns: undefined }
      ensure_contractor_urls: { Args: never; Returns: undefined }
      ensure_mandante_cc_urls: { Args: never; Returns: undefined }
      ensure_mandante_urls: { Args: never; Returns: undefined }
      get_user_mandante_ids: { Args: { user_id: string }; Returns: number[] }
      has_cc_access_to_mandante: {
        Args: { _mandante_id: number }
        Returns: boolean
      }
      has_cc_access_to_project: {
        Args: { _project_id: number }
        Returns: boolean
      }
      has_mandante_project_access: {
        Args: { _mandante_id: number; _user_id: string }
        Returns: boolean
      }
      is_cc_contractor: { Args: { _contractor_id: number }; Returns: boolean }
      is_contractor_related: {
        Args: { _contratista_id: number; _user_id: string }
        Returns: boolean
      }
      is_project_related: {
        Args: { _project_id: number; _user_id: string }
        Returns: boolean
      }
      send_contractor_payment_reminders: { Args: never; Returns: undefined }
      set_config: {
        Args: {
          is_local?: boolean
          setting_name: string
          setting_value: string
        }
        Returns: undefined
      }
      update_payment_states_weekly: { Args: never; Returns: undefined }
      verify_approver_email_access: {
        Args: { payment_id: number; user_email: string }
        Returns: boolean
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
      rfi_urgencia: "no_urgente" | "urgente" | "muy_urgente"
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
      rfi_urgencia: ["no_urgente", "urgente", "muy_urgente"],
    },
  },
} as const
