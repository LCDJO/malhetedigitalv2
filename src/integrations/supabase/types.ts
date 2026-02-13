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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aceites_termos: {
        Row: {
          data_hora_aceite: string
          id: string
          ip: string | null
          termo_id: string
          usuario_id: string
        }
        Insert: {
          data_hora_aceite?: string
          id?: string
          ip?: string | null
          termo_id: string
          usuario_id: string
        }
        Update: {
          data_hora_aceite?: string
          id?: string
          ip?: string | null
          termo_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aceites_termos_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_uso"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: number
          ip_address: string | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: string | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      incidentes: {
        Row: {
          acoes_tomadas: string | null
          created_at: string
          dados_afetados: string | null
          data_incidente: string
          descricao: string
          id: string
          registrado_por: string | null
          updated_at: string
        }
        Insert: {
          acoes_tomadas?: string | null
          created_at?: string
          dados_afetados?: string | null
          data_incidente?: string
          descricao: string
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Update: {
          acoes_tomadas?: string | null
          created_at?: string
          dados_afetados?: string | null
          data_incidente?: string
          descricao?: string
          id?: string
          registrado_por?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lodge_config: {
        Row: {
          categorias_financeiras: Json
          created_at: string
          dia_vencimento: number
          email_institucional: string | null
          endereco: string | null
          exigir_aprovacao_tesouraria: boolean
          exigir_quitacao_para_avanco: boolean
          id: string
          lodge_name: string
          lodge_number: string
          logotipo_url: string | null
          mensalidade_padrao: number
          meses_tolerancia_inadimplencia: number
          notificar_inadimplencia: boolean
          observacoes: string | null
          orient: string
          percentual_juros: number
          percentual_multa: number
          permitir_juros: boolean
          permitir_lancamento_retroativo: boolean
          potencia: string
          telefone: string | null
          tempo_minimo_aprendiz: number
          tempo_minimo_companheiro: number
          updated_at: string
        }
        Insert: {
          categorias_financeiras?: Json
          created_at?: string
          dia_vencimento?: number
          email_institucional?: string | null
          endereco?: string | null
          exigir_aprovacao_tesouraria?: boolean
          exigir_quitacao_para_avanco?: boolean
          id?: string
          lodge_name: string
          lodge_number: string
          logotipo_url?: string | null
          mensalidade_padrao?: number
          meses_tolerancia_inadimplencia?: number
          notificar_inadimplencia?: boolean
          observacoes?: string | null
          orient: string
          percentual_juros?: number
          percentual_multa?: number
          permitir_juros?: boolean
          permitir_lancamento_retroativo?: boolean
          potencia?: string
          telefone?: string | null
          tempo_minimo_aprendiz?: number
          tempo_minimo_companheiro?: number
          updated_at?: string
        }
        Update: {
          categorias_financeiras?: Json
          created_at?: string
          dia_vencimento?: number
          email_institucional?: string | null
          endereco?: string | null
          exigir_aprovacao_tesouraria?: boolean
          exigir_quitacao_para_avanco?: boolean
          id?: string
          lodge_name?: string
          lodge_number?: string
          logotipo_url?: string | null
          mensalidade_padrao?: number
          meses_tolerancia_inadimplencia?: number
          notificar_inadimplencia?: boolean
          observacoes?: string | null
          orient?: string
          percentual_juros?: number
          percentual_multa?: number
          permitir_juros?: boolean
          permitir_lancamento_retroativo?: boolean
          potencia?: string
          telefone?: string | null
          tempo_minimo_aprendiz?: number
          tempo_minimo_companheiro?: number
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      member_transactions: {
        Row: {
          conta_plano_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          forma_pagamento: string | null
          id: string
          member_id: string
          status: string
          tipo: string
          valor: number
        }
        Insert: {
          conta_plano_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          member_id: string
          status?: string
          tipo: string
          valor: number
        }
        Update: {
          conta_plano_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          member_id?: string
          status?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_transactions_conta_plano_id_fkey"
            columns: ["conta_plano_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          cim: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          degree: string
          elevation_date: string | null
          email: string | null
          exaltation_date: string | null
          force_password_change: boolean
          full_name: string
          id: string
          initiation_date: string | null
          master_installed: boolean
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cim?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          degree?: string
          elevation_date?: string | null
          email?: string | null
          exaltation_date?: string | null
          force_password_change?: boolean
          full_name: string
          id?: string
          initiation_date?: string | null
          master_installed?: boolean
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cim?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          degree?: string
          elevation_date?: string | null
          email?: string | null
          exaltation_date?: string | null
          force_password_change?: boolean
          full_name?: string
          id?: string
          initiation_date?: string | null
          master_installed?: boolean
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          codigo: string
          conta_pai_id: string | null
          created_at: string
          created_by: string | null
          id: string
          nome: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo: string
          conta_pai_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          conta_pai_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      politicas_privacidade: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          data_publicacao: string
          id: string
          versao: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          data_publicacao?: string
          id?: string
          versao: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          id?: string
          versao?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_titular: {
        Row: {
          created_at: string
          data_solicitacao: string
          descricao: string | null
          id: string
          respondido_em: string | null
          respondido_por: string | null
          resposta: string | null
          solicitante_id: string
          status: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_solicitacao_titular"]
        }
        Insert: {
          created_at?: string
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          solicitante_id: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo: Database["public"]["Enums"]["tipo_solicitacao_titular"]
        }
        Update: {
          created_at?: string
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          respondido_em?: string | null
          respondido_por?: string | null
          resposta?: string | null
          solicitante_id?: string
          status?: Database["public"]["Enums"]["status_solicitacao"]
          tipo?: Database["public"]["Enums"]["tipo_solicitacao_titular"]
        }
        Relationships: []
      }
      termos_uso: {
        Row: {
          ativo: boolean
          conteudo: string
          created_at: string
          data_publicacao: string
          id: string
          versao: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          data_publicacao?: string
          id?: string
          versao: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          id?: string
          versao?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
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
      count_failed_attempts: { Args: { _identifier: string }; Returns: number }
      financial_kpis: {
        Args: { _from: string; _to: string }
        Returns: {
          total_despesas: number
          total_receitas: number
          total_transacoes: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_module_access: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _email: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      lookup_email_by_cpf: { Args: { _cpf: string }; Returns: string }
      member_financial_summary: {
        Args: { _member_id: string }
        Returns: {
          meses_atraso: number
          total_creditos: number
          total_debitos: number
          total_transacoes: number
        }[]
      }
    }
    Enums: {
      app_role:
        | "veneravel"
        | "secretario"
        | "tesoureiro"
        | "orador"
        | "chanceler"
        | "administrador"
        | "consulta"
      status_solicitacao:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "rejeitada"
      tipo_solicitacao_titular: "correcao" | "exclusao" | "exportacao"
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
      app_role: [
        "veneravel",
        "secretario",
        "tesoureiro",
        "orador",
        "chanceler",
        "administrador",
        "consulta",
      ],
      status_solicitacao: [
        "pendente",
        "em_andamento",
        "concluida",
        "rejeitada",
      ],
      tipo_solicitacao_titular: ["correcao", "exclusao", "exportacao"],
    },
  },
} as const
