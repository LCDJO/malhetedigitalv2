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
          tenant_id: string | null
          termo_id: string
          usuario_id: string
        }
        Insert: {
          data_hora_aceite?: string
          id?: string
          ip?: string | null
          tenant_id?: string | null
          termo_id: string
          usuario_id: string
        }
        Update: {
          data_hora_aceite?: string
          id?: string
          ip?: string | null
          tenant_id?: string | null
          termo_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aceites_termos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aceites_termos_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_uso"
            referencedColumns: ["id"]
          },
        ]
      }
      active_sessions: {
        Row: {
          created_at: string
          id: string
          session_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          advertiser_id: string
          created_at: string
          daily_budget: number | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          target_pages: string[]
          target_slots: string[] | null
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          created_at?: string
          daily_budget?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_pages?: string[]
          target_slots?: string[] | null
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          created_at?: string
          daily_budget?: number | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          target_pages?: string[]
          target_slots?: string[] | null
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          advertiser_id: string
          campaign_id: string
          created_at: string
          creative_id: string
          id: string
          page: string
        }
        Insert: {
          advertiser_id: string
          campaign_id: string
          created_at?: string
          creative_id: string
          id?: string
          page?: string
        }
        Update: {
          advertiser_id?: string
          campaign_id?: string
          created_at?: string
          creative_id?: string
          id?: string
          page?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_creatives: {
        Row: {
          advertiser_id: string
          campaign_id: string
          clicks_count: number
          created_at: string
          destination_url: string | null
          grupo: string
          id: string
          impressions_count: number
          is_active: boolean
          media_type: string
          media_url: string
          title: string
          updated_at: string
        }
        Insert: {
          advertiser_id: string
          campaign_id: string
          clicks_count?: number
          created_at?: string
          destination_url?: string | null
          grupo?: string
          id?: string
          impressions_count?: number
          is_active?: boolean
          media_type?: string
          media_url: string
          title: string
          updated_at?: string
        }
        Update: {
          advertiser_id?: string
          campaign_id?: string
          clicks_count?: number
          created_at?: string
          destination_url?: string | null
          grupo?: string
          id?: string
          impressions_count?: number
          is_active?: boolean
          media_type?: string
          media_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          advertiser_id: string
          campaign_id: string
          created_at: string
          creative_id: string
          id: string
          page: string
        }
        Insert: {
          advertiser_id: string
          campaign_id: string
          created_at?: string
          creative_id: string
          id?: string
          page?: string
        }
        Update: {
          advertiser_id?: string
          campaign_id?: string
          created_at?: string
          creative_id?: string
          id?: string
          page?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "advertisers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "ad_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          is_active: boolean
          name: string
          page: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name: string
          page: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          is_active?: boolean
          name?: string
          page?: string
          slug?: string
        }
        Relationships: []
      }
      advertisers: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          company_name: string
          created_at: string
          document_number: string
          document_type: string
          email: string
          facebook: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          logo_url: string | null
          phone: string | null
          rejection_reason: string | null
          representative_address: string | null
          representative_cpf: string | null
          representative_email: string | null
          representative_name: string | null
          representative_phone: string | null
          scheduled_deletion_at: string | null
          status: Database["public"]["Enums"]["advertiser_status"]
          tiktok: string | null
          trading_name: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name: string
          created_at?: string
          document_number: string
          document_type?: string
          email: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          rejection_reason?: string | null
          representative_address?: string | null
          representative_cpf?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          scheduled_deletion_at?: string | null
          status?: Database["public"]["Enums"]["advertiser_status"]
          tiktok?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          company_name?: string
          created_at?: string
          document_number?: string
          document_type?: string
          email?: string
          facebook?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          logo_url?: string | null
          phone?: string | null
          rejection_reason?: string | null
          representative_address?: string | null
          representative_cpf?: string | null
          representative_email?: string | null
          representative_name?: string | null
          representative_phone?: string | null
          scheduled_deletion_at?: string | null
          status?: Database["public"]["Enums"]["advertiser_status"]
          tiktok?: string | null
          trading_name?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      affiliate_relationships: {
        Row: {
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          referred_id: string
          referrer_id: string
          tenant_id: string
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referred_id: string
          referrer_id: string
          tenant_id: string
        }
        Update: {
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          referred_id?: string
          referrer_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_relationships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_impressions: {
        Row: {
          banner_id: string
          created_at: string
          id: string
          pagina: string
        }
        Insert: {
          banner_id: string
          created_at?: string
          id?: string
          pagina?: string
        }
        Update: {
          banner_id?: string
          created_at?: string
          id?: string
          pagina?: string
        }
        Relationships: [
          {
            foreignKeyName: "banner_impressions_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "login_banners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_verification_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidentes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lodge_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string
          id: string
          identifier: string
          ip_address: string | null
          success: boolean
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          ip_address?: string | null
          success?: boolean
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          ip_address?: string | null
          success?: boolean
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      login_banners: {
        Row: {
          ativo: boolean
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          duracao_segundos: number
          grupo: string
          id: string
          media_url: string
          pagina: string
          tenant_id: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          duracao_segundos?: number
          grupo?: string
          id?: string
          media_url: string
          pagina?: string
          tenant_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          duracao_segundos?: number
          grupo?: string
          id?: string
          media_url?: string
          pagina?: string
          tenant_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_banners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      member_transactions: {
        Row: {
          aprovado_por: string | null
          categoria: string | null
          conta_plano_id: string | null
          created_at: string
          created_by: string | null
          data: string
          data_vencimento: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          member_id: string
          referencia_mes: string | null
          status: string
          tenant_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          aprovado_por?: string | null
          categoria?: string | null
          conta_plano_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          member_id: string
          referencia_mes?: string | null
          status?: string
          tenant_id?: string | null
          tipo: string
          updated_at?: string
          valor?: number
        }
        Update: {
          aprovado_por?: string | null
          categoria?: string | null
          conta_plano_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          member_id?: string
          referencia_mes?: string | null
          status?: string
          tenant_id?: string | null
          tipo?: string
          updated_at?: string
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
          {
            foreignKeyName: "member_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          member_id: string
          message: string
          metadata: Json | null
          tenant_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          member_id: string
          message: string
          metadata?: Json | null
          tenant_id: string
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          member_id?: string
          message?: string
          metadata?: Json | null
          tenant_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plano_contas: {
        Row: {
          ativo: boolean
          codigo: string
          conta_pai_id: string | null
          created_at: string
          id: string
          nome: string
          tenant_id: string | null
          tipo: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          conta_pai_id?: string | null
          created_at?: string
          id?: string
          nome: string
          tenant_id?: string | null
          tipo: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          conta_pai_id?: string | null
          created_at?: string
          id?: string
          nome?: string
          tenant_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_conta_pai_id_fkey"
            columns: ["conta_pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plano_contas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json
          id: string
          interval_days: number
          is_active: boolean
          max_members: number
          max_totems: number
          modules: Json
          name: string
          price: number
          stripe_price_id: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval_days?: number
          is_active?: boolean
          max_members?: number
          max_totems?: number
          modules?: Json
          name: string
          price?: number
          stripe_price_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          interval_days?: number
          is_active?: boolean
          max_members?: number
          max_totems?: number
          modules?: Json
          name?: string
          price?: number
          stripe_price_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
          versao: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          data_publicacao?: string
          id?: string
          tenant_id?: string | null
          versao: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          id?: string
          tenant_id?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "politicas_privacidade_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      potencia_ritos: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          potencia_id: string
          rito_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          potencia_id: string
          rito_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          potencia_id?: string
          rito_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "potencia_ritos_potencia_id_fkey"
            columns: ["potencia_id"]
            isOneToOne: false
            referencedRelation: "potencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "potencia_ritos_rito_id_fkey"
            columns: ["rito_id"]
            isOneToOne: false
            referencedRelation: "ritos"
            referencedColumns: ["id"]
          },
        ]
      }
      potencias: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
          sigla: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
          sigla?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
          sigla?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ranking_snapshots: {
        Row: {
          created_at: string
          id: string
          period: string
          rank: number | null
          tenant_id: string
          user_id: string
          xp_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          period: string
          rank?: number | null
          tenant_id: string
          user_id: string
          xp_total?: number
        }
        Update: {
          created_at?: string
          id?: string
          period?: string
          rank?: number | null
          tenant_id?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "ranking_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regras: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          entidade: string
          id: string
          nome: string
          potencia_id: string | null
          regra_json: Json
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          entidade?: string
          id?: string
          nome: string
          potencia_id?: string | null
          regra_json?: Json
          tipo?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          entidade?: string
          id?: string
          nome?: string
          potencia_id?: string | null
          regra_json?: Json
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_potencia_id_fkey"
            columns: ["potencia_id"]
            isOneToOne: false
            referencedRelation: "potencias"
            referencedColumns: ["id"]
          },
        ]
      }
      ritos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_solicitacao_titular"]
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_titular_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_evaluations: {
        Row: {
          agent_id: string | null
          agent_score: number | null
          comment: string | null
          created_at: string
          id: string
          system_score: number | null
          tenant_id: string
          ticket_id: string
        }
        Insert: {
          agent_id?: string | null
          agent_score?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          system_score?: number | null
          tenant_id: string
          ticket_id: string
        }
        Update: {
          agent_id?: string | null
          agent_score?: number | null
          comment?: string | null
          created_at?: string
          id?: string
          system_score?: number | null
          tenant_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_evaluations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_evaluations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          attachments: Json
          content: string
          created_at: string
          id: string
          is_internal: boolean
          sender_id: string
          sender_type: Database["public"]["Enums"]["ticket_sender_type"]
          ticket_id: string
        }
        Insert: {
          attachments?: Json
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id: string
          sender_type?: Database["public"]["Enums"]["ticket_sender_type"]
          ticket_id: string
        }
        Update: {
          attachments?: Json
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["ticket_sender_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string
          created_by: string
          description: string
          first_response_at: string | null
          id: string
          metadata: Json
          priority: Database["public"]["Enums"]["ticket_priority"]
          protocol: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["ticket_priority"]
          protocol?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          tags?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          first_response_at?: string | null
          id?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["ticket_priority"]
          protocol?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          tags?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          cnpj: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          endereco: string | null
          id: string
          is_active: boolean
          lodge_number: string | null
          logo_url: string | null
          name: string
          orient: string | null
          plan_features: Json
          potencia: string | null
          purge_at: string | null
          rito: string | null
          settings: Json
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean
          lodge_number?: string | null
          logo_url?: string | null
          name: string
          orient?: string | null
          plan_features?: Json
          potencia?: string | null
          purge_at?: string | null
          rito?: string | null
          settings?: Json
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          is_active?: boolean
          lodge_number?: string | null
          logo_url?: string | null
          name?: string
          orient?: string | null
          plan_features?: Json
          potencia?: string | null
          purge_at?: string | null
          rito?: string | null
          settings?: Json
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          telefone?: string | null
          updated_at?: string
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
          tenant_id: string | null
          versao: string
        }
        Insert: {
          ativo?: boolean
          conteudo: string
          created_at?: string
          data_publicacao?: string
          id?: string
          tenant_id?: string | null
          versao: string
        }
        Update: {
          ativo?: boolean
          conteudo?: string
          created_at?: string
          data_publicacao?: string
          id?: string
          tenant_id?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "termos_uso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      totem_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          label: string | null
          last_seen_at: string | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          last_seen_at?: string | null
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          label?: string | null
          last_seen_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "totem_codes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          totp_secret: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          totp_secret?: string
          updated_at?: string
          user_id?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          level: number
          tenant_id: string
          updated_at: string
          user_id: string
          xp_total: number
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          level?: number
          tenant_id: string
          updated_at?: string
          user_id: string
          xp_total?: number
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          level?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "wallets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          tenant_id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tenant_id: string
          user_id: string
          xp_amount: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          tenant_id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "xp_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      broadcast_notification: {
        Args: {
          _message: string
          _metadata?: Json
          _tenant_id: string
          _title: string
          _type?: string
        }
        Returns: undefined
      }
      count_failed_attempts: { Args: { _identifier: string }; Returns: number }
      get_advertiser_id: { Args: { _user_id: string }; Returns: string }
      get_auth_email: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_ids: { Args: { _user_id: string }; Returns: string[] }
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
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_active_member: { Args: { _email: string }; Returns: boolean }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_advertiser: { Args: { _user_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      lookup_email_by_cpf: { Args: { _cpf: string }; Returns: string }
    }
    Enums: {
      advertiser_status:
        | "pendente"
        | "aprovado"
        | "rejeitado"
        | "suspenso"
        | "aguardando_exclusao"
        | "banido"
      app_role: "superadmin" | "administrador"
      campaign_status: "rascunho" | "ativa" | "pausada" | "encerrada"
      status_solicitacao:
        | "pendente"
        | "em_andamento"
        | "concluida"
        | "rejeitada"
      subscription_status: "active" | "paused" | "canceled" | "expired"
      tenant_role: "owner" | "admin" | "member"
      ticket_category:
        | "billing"
        | "technical"
        | "feature_request"
        | "bug_report"
        | "account"
        | "general"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_sender_type: "tenant_user" | "platform_agent" | "system"
      ticket_status:
        | "open"
        | "awaiting_agent"
        | "awaiting_customer"
        | "in_progress"
        | "resolved"
        | "closed"
        | "cancelled"
      tipo_solicitacao_titular: "correcao" | "exclusao" | "exportacao"
      transaction_type: "credit" | "debit"
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
      advertiser_status: [
        "pendente",
        "aprovado",
        "rejeitado",
        "suspenso",
        "aguardando_exclusao",
        "banido",
      ],
      app_role: ["superadmin", "administrador"],
      campaign_status: ["rascunho", "ativa", "pausada", "encerrada"],
      status_solicitacao: [
        "pendente",
        "em_andamento",
        "concluida",
        "rejeitada",
      ],
      subscription_status: ["active", "paused", "canceled", "expired"],
      tenant_role: ["owner", "admin", "member"],
      ticket_category: [
        "billing",
        "technical",
        "feature_request",
        "bug_report",
        "account",
        "general",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_sender_type: ["tenant_user", "platform_agent", "system"],
      ticket_status: [
        "open",
        "awaiting_agent",
        "awaiting_customer",
        "in_progress",
        "resolved",
        "closed",
        "cancelled",
      ],
      tipo_solicitacao_titular: ["correcao", "exclusao", "exportacao"],
      transaction_type: ["credit", "debit"],
    },
  },
} as const
