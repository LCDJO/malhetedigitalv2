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
      assinaturas_ata: {
        Row: {
          assinado_em: string
          ata_id: string
          id: string
          ip: string | null
          papel: string
          tenant_id: string
          user_agent: string | null
          user_id: string
          versao: number
        }
        Insert: {
          assinado_em?: string
          ata_id: string
          id?: string
          ip?: string | null
          papel: string
          tenant_id: string
          user_agent?: string | null
          user_id: string
          versao: number
        }
        Update: {
          assinado_em?: string
          ata_id?: string
          id?: string
          ip?: string | null
          papel?: string
          tenant_id?: string
          user_agent?: string | null
          user_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_ata_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_ata_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atas: {
        Row: {
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["ata_estado"]
          hash_integridade: string | null
          id: string
          numero: string | null
          publicada_em: string | null
          retificacao_de: string | null
          sessao_id: string
          tenant_id: string
          titulo: string | null
          travada_em: string | null
          updated_at: string
          versao_atual: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["ata_estado"]
          hash_integridade?: string | null
          id?: string
          numero?: string | null
          publicada_em?: string | null
          retificacao_de?: string | null
          sessao_id: string
          tenant_id: string
          titulo?: string | null
          travada_em?: string | null
          updated_at?: string
          versao_atual?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["ata_estado"]
          hash_integridade?: string | null
          id?: string
          numero?: string | null
          publicada_em?: string | null
          retificacao_de?: string | null
          sessao_id?: string
          tenant_id?: string
          titulo?: string | null
          travada_em?: string | null
          updated_at?: string
          versao_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "atas_retificacao_de_fkey"
            columns: ["retificacao_de"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atas_tenant_id_fkey"
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
      aumentos_salario: {
        Row: {
          created_at: string
          created_by: string | null
          data_prevista: string | null
          data_realizado: string | null
          escrutinio_id: string | null
          estado: Database["public"]["Enums"]["aumento_estado"]
          grau_destino: Database["public"]["Enums"]["grau_macom"]
          grau_origem: Database["public"]["Enums"]["grau_macom"]
          id: string
          justificativa: string | null
          member_id: string
          observacoes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          data_realizado?: string | null
          escrutinio_id?: string | null
          estado?: Database["public"]["Enums"]["aumento_estado"]
          grau_destino: Database["public"]["Enums"]["grau_macom"]
          grau_origem: Database["public"]["Enums"]["grau_macom"]
          id?: string
          justificativa?: string | null
          member_id: string
          observacoes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data_prevista?: string | null
          data_realizado?: string | null
          escrutinio_id?: string | null
          estado?: Database["public"]["Enums"]["aumento_estado"]
          grau_destino?: Database["public"]["Enums"]["grau_macom"]
          grau_origem?: Database["public"]["Enums"]["grau_macom"]
          id?: string
          justificativa?: string | null
          member_id?: string
          observacoes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "aumentos_salario_escrutinio_id_fkey"
            columns: ["escrutinio_id"]
            isOneToOne: false
            referencedRelation: "escrutinios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_salario_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aumentos_salario_tenant_id_fkey"
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
      beneficencia_lancamentos: {
        Row: {
          ata_id: string | null
          beneficiario_member_id: string | null
          created_at: string
          created_by: string | null
          data: string
          descricao: string | null
          estorno_de: string | null
          id: string
          origem: Database["public"]["Enums"]["beneficencia_origem"]
          sessao_id: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["beneficencia_tipo"]
          updated_at: string
          valor: number
        }
        Insert: {
          ata_id?: string | null
          beneficiario_member_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          estorno_de?: string | null
          id?: string
          origem?: Database["public"]["Enums"]["beneficencia_origem"]
          sessao_id?: string | null
          tenant_id: string
          tipo: Database["public"]["Enums"]["beneficencia_tipo"]
          updated_at?: string
          valor: number
        }
        Update: {
          ata_id?: string | null
          beneficiario_member_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          estorno_de?: string | null
          id?: string
          origem?: Database["public"]["Enums"]["beneficencia_origem"]
          sessao_id?: string | null
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["beneficencia_tipo"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "beneficencia_lancamentos_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficencia_lancamentos_beneficiario_member_id_fkey"
            columns: ["beneficiario_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficencia_lancamentos_estorno_de_fkey"
            columns: ["estorno_de"]
            isOneToOne: false
            referencedRelation: "beneficencia_lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficencia_lancamentos_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beneficencia_lancamentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      biblioteca_itens: {
        Row: {
          autor: string | null
          cargos_visiveis: string[]
          categoria: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo: string | null
          created_at: string
          descricao: string | null
          grau_minimo: number
          id: string
          mime_type: string | null
          publicado: boolean
          publicado_de_prancha_id: string | null
          storage_path: string | null
          tags: string[]
          tamanho_bytes: number | null
          tenant_id: string
          titulo: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          autor?: string | null
          cargos_visiveis?: string[]
          categoria?: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo?: string | null
          created_at?: string
          descricao?: string | null
          grau_minimo?: number
          id?: string
          mime_type?: string | null
          publicado?: boolean
          publicado_de_prancha_id?: string | null
          storage_path?: string | null
          tags?: string[]
          tamanho_bytes?: number | null
          tenant_id: string
          titulo: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          autor?: string | null
          cargos_visiveis?: string[]
          categoria?: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo?: string | null
          created_at?: string
          descricao?: string | null
          grau_minimo?: number
          id?: string
          mime_type?: string | null
          publicado?: boolean
          publicado_de_prancha_id?: string | null
          storage_path?: string | null
          tags?: string[]
          tamanho_bytes?: number | null
          tenant_id?: string
          titulo?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biblioteca_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blocos_ata: {
        Row: {
          ata_id: string
          autor_id: string | null
          conteudo: string | null
          conteudo_json: Json | null
          created_at: string
          id: string
          ordem: number
          tenant_id: string
          tipo: Database["public"]["Enums"]["bloco_tipo"]
          titulo: string | null
          updated_at: string
        }
        Insert: {
          ata_id: string
          autor_id?: string | null
          conteudo?: string | null
          conteudo_json?: Json | null
          created_at?: string
          id?: string
          ordem?: number
          tenant_id: string
          tipo: Database["public"]["Enums"]["bloco_tipo"]
          titulo?: string | null
          updated_at?: string
        }
        Update: {
          ata_id?: string
          autor_id?: string | null
          conteudo?: string | null
          conteudo_json?: Json | null
          created_at?: string
          id?: string
          ordem?: number
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["bloco_tipo"]
          titulo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocos_ata_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_ata_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocos_ata_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_eventos: {
        Row: {
          cor: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_inteiro: boolean
          grau_minimo: number
          id: string
          member_id: string | null
          recorrencia: string | null
          sessao_id: string | null
          tenant_id: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_inteiro?: boolean
          grau_minimo?: number
          id?: string
          member_id?: string | null
          recorrencia?: string | null
          sessao_id?: string | null
          tenant_id: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_inteiro?: boolean
          grau_minimo?: number
          id?: string
          member_id?: string | null
          recorrencia?: string | null
          sessao_id?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendario_eventos_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_eventos_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendario_eventos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos_oficina: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          grau_minimo: number | null
          id: string
          nome: string
          ordem: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          grau_minimo?: number | null
          id?: string
          nome: string
          ordem?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          grau_minimo?: number | null
          id?: string
          nome?: string
          ordem?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargos_oficina_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      circular_envios: {
        Row: {
          circular_id: string
          created_at: string
          email_enviado: boolean
          erro: string | null
          id: string
          lido_em: string | null
          member_id: string
          push_enviado: boolean
          tenant_id: string
        }
        Insert: {
          circular_id: string
          created_at?: string
          email_enviado?: boolean
          erro?: string | null
          id?: string
          lido_em?: string | null
          member_id: string
          push_enviado?: boolean
          tenant_id: string
        }
        Update: {
          circular_id?: string
          created_at?: string
          email_enviado?: boolean
          erro?: string | null
          id?: string
          lido_em?: string | null
          member_id?: string
          push_enviado?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circular_envios_circular_id_fkey"
            columns: ["circular_id"]
            isOneToOne: false
            referencedRelation: "circulares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circular_envios_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circular_envios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      circulares: {
        Row: {
          anexo_path: string | null
          assunto: string
          autor_id: string | null
          cargos_destino: string[]
          corpo: string
          created_at: string
          enviada_em: string | null
          enviar_email: boolean
          enviar_push: boolean
          grau_minimo: number
          id: string
          numero: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          anexo_path?: string | null
          assunto: string
          autor_id?: string | null
          cargos_destino?: string[]
          corpo: string
          created_at?: string
          enviada_em?: string | null
          enviar_email?: boolean
          enviar_push?: boolean
          grau_minimo?: number
          id?: string
          numero: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          anexo_path?: string | null
          assunto?: string
          autor_id?: string | null
          cargos_destino?: string[]
          corpo?: string
          created_at?: string
          enviada_em?: string | null
          enviar_email?: boolean
          enviar_push?: boolean
          grau_minimo?: number
          id?: string
          numero?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circulares_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circulares_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicado_leituras: {
        Row: {
          comunicado_id: string
          id: string
          lido_em: string
          member_id: string
          tenant_id: string
        }
        Insert: {
          comunicado_id: string
          id?: string
          lido_em?: string
          member_id: string
          tenant_id: string
        }
        Update: {
          comunicado_id?: string
          id?: string
          lido_em?: string
          member_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicado_leituras_comunicado_id_fkey"
            columns: ["comunicado_id"]
            isOneToOne: false
            referencedRelation: "comunicados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicado_leituras_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicado_leituras_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicados: {
        Row: {
          autor_id: string | null
          cargos_visiveis: string[]
          conteudo: string
          created_at: string
          fixado: boolean
          grau_minimo: number
          id: string
          publicado: boolean
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          cargos_visiveis?: string[]
          conteudo: string
          created_at?: string
          fixado?: boolean
          grau_minimo?: number
          id?: string
          publicado?: boolean
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          cargos_visiveis?: string[]
          conteudo?: string
          created_at?: string
          fixado?: boolean
          grau_minimo?: number
          id?: string
          publicado?: boolean
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicados_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicados_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          ano_referencia: number | null
          cargos_visiveis: string[]
          categoria: Database["public"]["Enums"]["documento_categoria"]
          created_at: string
          descricao: string | null
          grau_minimo: number
          id: string
          mime_type: string | null
          reservado: boolean
          storage_path: string | null
          tags: string[]
          tamanho_bytes: number | null
          tenant_id: string
          titulo: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          ano_referencia?: number | null
          cargos_visiveis?: string[]
          categoria?: Database["public"]["Enums"]["documento_categoria"]
          created_at?: string
          descricao?: string | null
          grau_minimo?: number
          id?: string
          mime_type?: string | null
          reservado?: boolean
          storage_path?: string | null
          tags?: string[]
          tamanho_bytes?: number | null
          tenant_id: string
          titulo: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          ano_referencia?: number | null
          cargos_visiveis?: string[]
          categoria?: Database["public"]["Enums"]["documento_categoria"]
          created_at?: string
          descricao?: string | null
          grau_minimo?: number
          id?: string
          mime_type?: string | null
          reservado?: boolean
          storage_path?: string | null
          tags?: string[]
          tamanho_bytes?: number | null
          tenant_id?: string
          titulo?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_dispatch_tasks: {
        Row: {
          audience: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          custom_emails: string[] | null
          error_message: string | null
          failed_count: number
          id: string
          metadata: Json
          name: string
          scheduled_at: string | null
          sent_count: number
          started_at: string | null
          status: string
          template_id: string | null
          tenant_id: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          audience?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          custom_emails?: string[] | null
          error_message?: string | null
          failed_count?: number
          id?: string
          metadata?: Json
          name: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          audience?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          custom_emails?: string[] | null
          error_message?: string | null
          failed_count?: number
          id?: string
          metadata?: Json
          name?: string
          scheduled_at?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_dispatch_tasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_dispatch_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key: string
          name: string
          subject: string
          tenant_id: string
          updated_at: string
          variables: Json
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key: string
          name: string
          subject: string
          tenant_id: string
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      escrutinio_votos: {
        Row: {
          cor: Database["public"]["Enums"]["voto_cor"]
          created_at: string
          escrutinio_id: string
          id: string
          tenant_id: string
          voter_hash: string
        }
        Insert: {
          cor: Database["public"]["Enums"]["voto_cor"]
          created_at?: string
          escrutinio_id: string
          id?: string
          tenant_id: string
          voter_hash: string
        }
        Update: {
          cor?: Database["public"]["Enums"]["voto_cor"]
          created_at?: string
          escrutinio_id?: string
          id?: string
          tenant_id?: string
          voter_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrutinio_votos_escrutinio_id_fkey"
            columns: ["escrutinio_id"]
            isOneToOne: false
            referencedRelation: "escrutinios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrutinio_votos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      escrutinios: {
        Row: {
          aberto_em: string
          created_at: string
          created_by: string | null
          encerrado_em: string | null
          estado: Database["public"]["Enums"]["escrutinio_estado"]
          id: string
          observacoes: string | null
          proposta_id: string
          resultado: string | null
          sessao_id: string | null
          tenant_id: string
          total_brancas: number
          total_pretas: number
          updated_at: string
        }
        Insert: {
          aberto_em?: string
          created_at?: string
          created_by?: string | null
          encerrado_em?: string | null
          estado?: Database["public"]["Enums"]["escrutinio_estado"]
          id?: string
          observacoes?: string | null
          proposta_id: string
          resultado?: string | null
          sessao_id?: string | null
          tenant_id: string
          total_brancas?: number
          total_pretas?: number
          updated_at?: string
        }
        Update: {
          aberto_em?: string
          created_at?: string
          created_by?: string | null
          encerrado_em?: string | null
          estado?: Database["public"]["Enums"]["escrutinio_estado"]
          id?: string
          observacoes?: string | null
          proposta_id?: string
          resultado?: string | null
          sessao_id?: string | null
          tenant_id?: string
          total_brancas?: number
          total_pretas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrutinios_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas_iniciacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrutinios_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrutinios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      hospitalaria_assistencias: {
        Row: {
          beneficencia_lancamento_id: string | null
          created_at: string
          created_by: string | null
          data_abertura: string
          data_encerramento: string | null
          id: string
          member_id: string
          motivo: string
          observacoes: string | null
          responsavel_member_id: string | null
          status: Database["public"]["Enums"]["hospitalaria_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["hospitalaria_tipo"]
          updated_at: string
          valor: number | null
        }
        Insert: {
          beneficencia_lancamento_id?: string | null
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_encerramento?: string | null
          id?: string
          member_id: string
          motivo: string
          observacoes?: string | null
          responsavel_member_id?: string | null
          status?: Database["public"]["Enums"]["hospitalaria_status"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["hospitalaria_tipo"]
          updated_at?: string
          valor?: number | null
        }
        Update: {
          beneficencia_lancamento_id?: string | null
          created_at?: string
          created_by?: string | null
          data_abertura?: string
          data_encerramento?: string | null
          id?: string
          member_id?: string
          motivo?: string
          observacoes?: string | null
          responsavel_member_id?: string | null
          status?: Database["public"]["Enums"]["hospitalaria_status"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["hospitalaria_tipo"]
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hospitalaria_assistencias_beneficencia_lancamento_id_fkey"
            columns: ["beneficencia_lancamento_id"]
            isOneToOne: false
            referencedRelation: "beneficencia_lancamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalaria_assistencias_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalaria_assistencias_responsavel_member_id_fkey"
            columns: ["responsavel_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospitalaria_assistencias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      leituras_registro: {
        Row: {
          acao: Database["public"]["Enums"]["leitura_acao"]
          biblioteca_item_id: string | null
          created_at: string
          documento_id: string | null
          id: string
          member_id: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          acao?: Database["public"]["Enums"]["leitura_acao"]
          biblioteca_item_id?: string | null
          created_at?: string
          documento_id?: string | null
          id?: string
          member_id?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          acao?: Database["public"]["Enums"]["leitura_acao"]
          biblioteca_item_id?: string | null
          created_at?: string
          documento_id?: string | null
          id?: string
          member_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leituras_registro_biblioteca_item_id_fkey"
            columns: ["biblioteca_item_id"]
            isOneToOne: false
            referencedRelation: "biblioteca_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_registro_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_registro_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leituras_registro_tenant_id_fkey"
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
          dias_prazo_retificacao: number
          email_institucional: string | null
          endereco: string | null
          escrutinio_secreto_obrigatorio: boolean
          exigir_aprovacao_tesouraria: boolean
          exigir_assinatura_orador: boolean
          exigir_assinatura_secretario: boolean
          exigir_assinatura_vm: boolean
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
          quorum_minimo_aprendiz: number
          quorum_minimo_companheiro: number
          quorum_minimo_mestre: number
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
          dias_prazo_retificacao?: number
          email_institucional?: string | null
          endereco?: string | null
          escrutinio_secreto_obrigatorio?: boolean
          exigir_aprovacao_tesouraria?: boolean
          exigir_assinatura_orador?: boolean
          exigir_assinatura_secretario?: boolean
          exigir_assinatura_vm?: boolean
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
          quorum_minimo_aprendiz?: number
          quorum_minimo_companheiro?: number
          quorum_minimo_mestre?: number
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
          dias_prazo_retificacao?: number
          email_institucional?: string | null
          endereco?: string | null
          escrutinio_secreto_obrigatorio?: boolean
          exigir_aprovacao_tesouraria?: boolean
          exigir_assinatura_orador?: boolean
          exigir_assinatura_secretario?: boolean
          exigir_assinatura_vm?: boolean
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
          quorum_minimo_aprendiz?: number
          quorum_minimo_companheiro?: number
          quorum_minimo_mestre?: number
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
          grau_numerico: number | null
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
          grau_numerico?: number | null
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
          grau_numerico?: number | null
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
      membro_cargos: {
        Row: {
          ativo: boolean
          cargo_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          mandato_fim: string | null
          mandato_inicio: string | null
          member_id: string
          observacao: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          mandato_fim?: string | null
          mandato_inicio?: string | null
          member_id: string
          observacao?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          mandato_fim?: string | null
          mandato_inicio?: string | null
          member_id?: string
          observacao?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "membro_cargos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos_oficina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membro_cargos_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membro_cargos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          receiver_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          receiver_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_hashtags: {
        Row: {
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          order_index: number | null
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          order_index?: number | null
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_url: string | null
          post_type: string
          privacy_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
          privacy_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_url?: string | null
          post_type?: string
          privacy_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      pranchas_submissoes: {
        Row: {
          categoria: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo: string | null
          created_at: string
          enviado_em: string | null
          estado: Database["public"]["Enums"]["prancha_estado"]
          grau: number
          id: string
          member_id: string
          mime_type: string | null
          parecer: string | null
          parecer_em: string | null
          parecer_por: string | null
          publicado_item_id: string | null
          resumo: string | null
          storage_path: string | null
          tags: string[]
          tenant_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo?: string | null
          created_at?: string
          enviado_em?: string | null
          estado?: Database["public"]["Enums"]["prancha_estado"]
          grau?: number
          id?: string
          member_id: string
          mime_type?: string | null
          parecer?: string | null
          parecer_em?: string | null
          parecer_por?: string | null
          publicado_item_id?: string | null
          resumo?: string | null
          storage_path?: string | null
          tags?: string[]
          tenant_id: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["biblioteca_categoria"]
          conteudo?: string | null
          created_at?: string
          enviado_em?: string | null
          estado?: Database["public"]["Enums"]["prancha_estado"]
          grau?: number
          id?: string
          member_id?: string
          mime_type?: string | null
          parecer?: string | null
          parecer_em?: string | null
          parecer_por?: string | null
          publicado_item_id?: string | null
          resumo?: string | null
          storage_path?: string | null
          tags?: string[]
          tenant_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pranchas_submissoes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pranchas_submissoes_publicado_item_id_fkey"
            columns: ["publicado_item_id"]
            isOneToOne: false
            referencedRelation: "biblioteca_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pranchas_submissoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      presencas: {
        Row: {
          created_at: string
          id: string
          justificada: boolean
          member_id: string
          observacao: string | null
          presente: boolean
          sessao_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          justificada?: boolean
          member_id: string
          observacao?: string | null
          presente?: boolean
          sessao_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          justificada?: boolean
          member_id?: string
          observacao?: string | null
          presente?: boolean
          sessao_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: number | null
          address: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          loja_id: string | null
          masonic_status: string | null
          phone: string | null
          potencia_id: string | null
          profile_type: string
          rito_id: string | null
          show_suggestions: boolean
          slug: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          access_level?: number | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          loja_id?: string | null
          masonic_status?: string | null
          phone?: string | null
          potencia_id?: string | null
          profile_type?: string
          rito_id?: string | null
          show_suggestions?: boolean
          slug?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: number | null
          address?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          loja_id?: string | null
          masonic_status?: string | null
          phone?: string | null
          potencia_id?: string | null
          profile_type?: string
          rito_id?: string | null
          show_suggestions?: boolean
          slug?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas_iniciacao: {
        Row: {
          apresentacao: string | null
          candidato_cpf: string | null
          candidato_email: string | null
          candidato_endereco: string | null
          candidato_nascimento: string | null
          candidato_nome: string
          candidato_profissao: string | null
          candidato_telefone: string | null
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["proposta_estado"]
          id: string
          observacoes: string | null
          padrinho_member_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          apresentacao?: string | null
          candidato_cpf?: string | null
          candidato_email?: string | null
          candidato_endereco?: string | null
          candidato_nascimento?: string | null
          candidato_nome: string
          candidato_profissao?: string | null
          candidato_telefone?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["proposta_estado"]
          id?: string
          observacoes?: string | null
          padrinho_member_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          apresentacao?: string | null
          candidato_cpf?: string | null
          candidato_email?: string | null
          candidato_endereco?: string | null
          candidato_nascimento?: string | null
          candidato_nome?: string
          candidato_profissao?: string | null
          candidato_telefone?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["proposta_estado"]
          id?: string
          observacoes?: string | null
          padrinho_member_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "propostas_iniciacao_padrinho_member_id_fkey"
            columns: ["padrinho_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_iniciacao_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      sessoes: {
        Row: {
          created_at: string
          created_by: string | null
          data: string
          grau: number
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          local: string | null
          numero: string | null
          observacoes: string | null
          status: string
          tenant_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data: string
          grau?: number
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          numero?: string | null
          observacoes?: string | null
          status?: string
          tenant_id: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: string
          grau?: number
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          local?: string | null
          numero?: string | null
          observacoes?: string | null
          status?: string
          tenant_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sindicancias: {
        Row: {
          created_at: string
          entregue_em: string | null
          id: string
          proposta_id: string
          relatorio: string | null
          sindicante_member_id: string
          tenant_id: string
          updated_at: string
          voto: Database["public"]["Enums"]["sindicancia_voto"] | null
        }
        Insert: {
          created_at?: string
          entregue_em?: string | null
          id?: string
          proposta_id: string
          relatorio?: string | null
          sindicante_member_id: string
          tenant_id: string
          updated_at?: string
          voto?: Database["public"]["Enums"]["sindicancia_voto"] | null
        }
        Update: {
          created_at?: string
          entregue_em?: string | null
          id?: string
          proposta_id?: string
          relatorio?: string | null
          sindicante_member_id?: string
          tenant_id?: string
          updated_at?: string
          voto?: Database["public"]["Enums"]["sindicancia_voto"] | null
        }
        Relationships: [
          {
            foreignKeyName: "sindicancias_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas_iniciacao"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sindicancias_sindicante_member_id_fkey"
            columns: ["sindicante_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sindicancias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      stories: {
        Row: {
          content_text: string | null
          content_type: string
          content_url: string | null
          created_at: string
          expires_at: string
          id: string
          privacy: string
          user_id: string
        }
        Insert: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          privacy?: string
          user_id: string
        }
        Update: {
          content_text?: string | null
          content_type?: string
          content_url?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          privacy?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      tenant_email_integrations: {
        Row: {
          api_token: string
          created_at: string
          domain: string
          enabled: boolean
          from_email: string
          from_name: string
          id: string
          provider: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          smtp_user: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          api_token?: string
          created_at?: string
          domain?: string
          enabled?: boolean
          from_email?: string
          from_name?: string
          id?: string
          provider?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_user?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          api_token?: string
          created_at?: string
          domain?: string
          enabled?: boolean
          from_email?: string
          from_name?: string
          id?: string
          provider?: string
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          smtp_user?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_module_overrides: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tenant_push_integrations: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          onesignal_api_key: string
          onesignal_app_id: string
          provider: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          onesignal_api_key?: string
          onesignal_app_id?: string
          provider?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          onesignal_api_key?: string
          onesignal_app_id?: string
          provider?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
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
      versoes_ata: {
        Row: {
          ata_id: string
          created_at: string
          created_by: string | null
          hash: string
          id: string
          motivo: string | null
          snapshot: Json
          tenant_id: string
          versao: number
        }
        Insert: {
          ata_id: string
          created_at?: string
          created_by?: string | null
          hash: string
          id?: string
          motivo?: string | null
          snapshot: Json
          tenant_id: string
          versao: number
        }
        Update: {
          ata_id?: string
          created_at?: string
          created_by?: string | null
          hash?: string
          id?: string
          motivo?: string | null
          snapshot?: Json
          tenant_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "versoes_ata_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "versoes_ata_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      visitantes: {
        Row: {
          cim: string | null
          created_at: string
          grau: number | null
          id: string
          loja_origem: string | null
          nome: string
          observacao: string | null
          oriente: string | null
          potencia: string | null
          rito: string | null
          sessao_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          cim?: string | null
          created_at?: string
          grau?: number | null
          id?: string
          loja_origem?: string | null
          nome: string
          observacao?: string | null
          oriente?: string | null
          potencia?: string | null
          rito?: string | null
          sessao_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          cim?: string | null
          created_at?: string
          grau?: number | null
          id?: string
          loja_origem?: string | null
          nome?: string
          observacao?: string | null
          oriente?: string | null
          potencia?: string | null
          rito?: string | null
          sessao_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitantes_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "sessoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitantes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      generate_unique_lodge_slug: {
        Args: { _name: string; _number: string }
        Returns: string
      }
      get_advertiser_id: { Args: { _user_id: string }; Returns: string }
      get_auth_email: { Args: never; Returns: string }
      get_member_grau: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: number
      }
      get_my_profile_private: {
        Args: never
        Returns: {
          address: string
          birth_date: string
          cpf: string
          phone: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_ids: { Args: { _user_id: string }; Returns: string[] }
      has_module_access: {
        Args: { _module: string; _user_id: string }
        Returns: boolean
      }
      has_module_enabled: {
        Args: { _module: string; _tenant_id: string }
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
      member_has_cargo: {
        Args: { _cargo_ids: string[]; _tenant_id: string; _user_id: string }
        Returns: boolean
      }
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
      ata_estado:
        | "rascunho"
        | "revisao"
        | "leitura"
        | "aprovada"
        | "travada"
        | "publicada"
        | "retificada"
      aumento_estado:
        | "proposto"
        | "instruido"
        | "escrutinio"
        | "aprovado"
        | "rejeitado"
        | "realizado"
        | "arquivado"
      beneficencia_origem:
        | "tronco_sessao"
        | "doacao"
        | "transferencia"
        | "assistencia"
        | "outro"
      beneficencia_tipo: "entrada" | "saida" | "estorno"
      biblioteca_categoria:
        | "prancha"
        | "livro"
        | "ritualistica"
        | "historia"
        | "simbolismo"
        | "filosofia"
        | "outros"
      bloco_tipo:
        | "cabecalho"
        | "abertura"
        | "expediente"
        | "saco_propostas"
        | "ordem_dia"
        | "tempo_estudos"
        | "tronco"
        | "palavra_bem"
        | "encerramento"
        | "outros"
      campaign_status: "rascunho" | "ativa" | "pausada" | "encerrada"
      documento_categoria:
        | "estatuto"
        | "regulamento"
        | "ata_publicada"
        | "circular"
        | "oficio"
        | "balanco"
        | "relatorio"
        | "convocacao"
        | "outros"
      escrutinio_estado: "aberto" | "encerrado" | "anulado"
      grau_macom: "aprendiz" | "companheiro" | "mestre"
      hospitalaria_status:
        | "aberto"
        | "em_acompanhamento"
        | "concluido"
        | "cancelado"
      hospitalaria_tipo:
        | "visita"
        | "auxilio_financeiro"
        | "oracao"
        | "cesta_basica"
        | "acompanhamento_familia"
        | "outro"
      leitura_acao: "visualizou" | "baixou"
      prancha_estado:
        | "rascunho"
        | "em_analise"
        | "aprovada"
        | "rejeitada"
        | "publicada"
      proposta_estado:
        | "rascunho"
        | "sindicancia"
        | "parecer"
        | "escrutinio"
        | "aprovada"
        | "rejeitada"
        | "arquivada"
      sindicancia_voto: "favoravel" | "contrario" | "abstencao"
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
      voto_cor: "branca" | "preta"
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
      ata_estado: [
        "rascunho",
        "revisao",
        "leitura",
        "aprovada",
        "travada",
        "publicada",
        "retificada",
      ],
      aumento_estado: [
        "proposto",
        "instruido",
        "escrutinio",
        "aprovado",
        "rejeitado",
        "realizado",
        "arquivado",
      ],
      beneficencia_origem: [
        "tronco_sessao",
        "doacao",
        "transferencia",
        "assistencia",
        "outro",
      ],
      beneficencia_tipo: ["entrada", "saida", "estorno"],
      biblioteca_categoria: [
        "prancha",
        "livro",
        "ritualistica",
        "historia",
        "simbolismo",
        "filosofia",
        "outros",
      ],
      bloco_tipo: [
        "cabecalho",
        "abertura",
        "expediente",
        "saco_propostas",
        "ordem_dia",
        "tempo_estudos",
        "tronco",
        "palavra_bem",
        "encerramento",
        "outros",
      ],
      campaign_status: ["rascunho", "ativa", "pausada", "encerrada"],
      documento_categoria: [
        "estatuto",
        "regulamento",
        "ata_publicada",
        "circular",
        "oficio",
        "balanco",
        "relatorio",
        "convocacao",
        "outros",
      ],
      escrutinio_estado: ["aberto", "encerrado", "anulado"],
      grau_macom: ["aprendiz", "companheiro", "mestre"],
      hospitalaria_status: [
        "aberto",
        "em_acompanhamento",
        "concluido",
        "cancelado",
      ],
      hospitalaria_tipo: [
        "visita",
        "auxilio_financeiro",
        "oracao",
        "cesta_basica",
        "acompanhamento_familia",
        "outro",
      ],
      leitura_acao: ["visualizou", "baixou"],
      prancha_estado: [
        "rascunho",
        "em_analise",
        "aprovada",
        "rejeitada",
        "publicada",
      ],
      proposta_estado: [
        "rascunho",
        "sindicancia",
        "parecer",
        "escrutinio",
        "aprovada",
        "rejeitada",
        "arquivada",
      ],
      sindicancia_voto: ["favoravel", "contrario", "abstencao"],
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
      voto_cor: ["branca", "preta"],
    },
  },
} as const
