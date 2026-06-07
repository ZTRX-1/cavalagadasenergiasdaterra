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
      activity_logs: {
        Row: {
          acao: string
          created_at: string
          descricao: string | null
          id: string
          metadata: Json | null
          modulo: string
          usuario: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          descricao?: string | null
          id?: string
          metadata?: Json | null
          modulo: string
          usuario?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          descricao?: string | null
          id?: string
          metadata?: Json | null
          modulo?: string
          usuario?: string | null
        }
        Relationships: []
      }
      cargo_permissoes: {
        Row: {
          acao: string
          cargo_id: string
          created_at: string
          id: string
          modulo: string
          permitido: boolean
        }
        Insert: {
          acao: string
          cargo_id: string
          created_at?: string
          id?: string
          modulo: string
          permitido?: boolean
        }
        Update: {
          acao?: string
          cargo_id?: string
          created_at?: string
          id?: string
          modulo?: string
          permitido?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "cargo_permissoes_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          ativo: boolean
          chave: string
          cor: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          protegido: boolean
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          chave: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          protegido?: boolean
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          chave?: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          protegido?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          cor_destaque: string | null
          created_at: string
          email: string | null
          emails_notificacao: string[]
          empresa_cnpj: string | null
          empresa_nome: string | null
          endereco: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          preferencias: Json
          singleton: boolean
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cor_destaque?: string | null
          created_at?: string
          email?: string | null
          emails_notificacao?: string[]
          empresa_cnpj?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          preferencias?: Json
          singleton?: boolean
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cor_destaque?: string | null
          created_at?: string
          email?: string | null
          emails_notificacao?: string[]
          empresa_cnpj?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          preferencias?: Json
          singleton?: boolean
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          created_at: string
          descricao: string
          expedicao_id: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          pago_em: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descricao: string
          expedicao_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descricao?: string
          expedicao_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          pago_em?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          cliente: string | null
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          recebido_em: string | null
          reserva_id: string | null
          status: string
          updated_at: string
          valor: number
          vencimento: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          recebido_em?: string | null
          reserva_id?: string | null
          status?: string
          updated_at?: string
          valor: number
          vencimento: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          recebido_em?: string | null
          reserva_id?: string | null
          status?: string
          updated_at?: string
          valor?: number
          vencimento?: string
        }
        Relationships: []
      }
      datas: {
        Row: {
          created_at: string
          data_fim: string
          data_inicio: string
          expedicao_id: string
          id: string
          preco_cartao: number | null
          preco_pix: number | null
          status: string
          tag: string | null
          updated_at: string
          vagas_disponiveis: number
          vagas_total: number
        }
        Insert: {
          created_at?: string
          data_fim: string
          data_inicio: string
          expedicao_id: string
          id?: string
          preco_cartao?: number | null
          preco_pix?: number | null
          status?: string
          tag?: string | null
          updated_at?: string
          vagas_disponiveis?: number
          vagas_total?: number
        }
        Update: {
          created_at?: string
          data_fim?: string
          data_inicio?: string
          expedicao_id?: string
          id?: string
          preco_cartao?: number | null
          preco_pix?: number | null
          status?: string
          tag?: string | null
          updated_at?: string
          vagas_disponiveis?: number
          vagas_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "datas_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao_indicadores"
            referencedColumns: ["expedicao_id"]
          },
          {
            foreignKeyName: "datas_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          anexo_url: string | null
          categoria: string
          created_at: string
          created_by: string | null
          data: string
          descricao: string
          expedicao_id: string | null
          fornecedor: string | null
          id: string
          observacoes: string | null
          previsto: boolean
          status: string
          tipo_custo: string
          updated_at: string
          valor: number
        }
        Insert: {
          anexo_url?: string | null
          categoria: string
          created_at?: string
          created_by?: string | null
          data?: string
          descricao: string
          expedicao_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          previsto?: boolean
          status?: string
          tipo_custo?: string
          updated_at?: string
          valor: number
        }
        Update: {
          anexo_url?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string
          expedicao_id?: string | null
          fornecedor?: string | null
          id?: string
          observacoes?: string | null
          previsto?: boolean
          status?: string
          tipo_custo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      documentos: {
        Row: {
          categoria: string | null
          created_at: string
          escopo: string
          expedicao_id: string | null
          id: string
          participante_id: string | null
          reserva_id: string | null
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          escopo?: string
          expedicao_id?: string | null
          id?: string
          participante_id?: string | null
          reserva_id?: string | null
          tipo?: string
          titulo: string
          url: string
        }
        Update: {
          categoria?: string | null
          created_at?: string
          escopo?: string
          expedicao_id?: string | null
          id?: string
          participante_id?: string | null
          reserva_id?: string | null
          tipo?: string
          titulo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao_indicadores"
            referencedColumns: ["expedicao_id"]
          },
          {
            foreignKeyName: "documentos_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_central: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          arquivo_mime: string | null
          arquivo_nome: string | null
          arquivo_tamanho: number | null
          arquivo_url: string | null
          categoria: string
          cliente_email: string | null
          cliente_nome: string | null
          created_at: string
          dados_extraidos: Json
          descricao: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          expedicao_id: string | null
          id: string
          lead_id: string | null
          nf_cnpj: string | null
          nf_data: string | null
          nf_empresa: string | null
          nf_numero: string | null
          nf_valor: number | null
          observacoes_internas: string | null
          participante_id: string | null
          reserva_id: string | null
          status: string
          status_processamento: string
          tags: string[]
          texto_extraido: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          categoria?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          dados_extraidos?: Json
          descricao?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          expedicao_id?: string | null
          id?: string
          lead_id?: string | null
          nf_cnpj?: string | null
          nf_data?: string | null
          nf_empresa?: string | null
          nf_numero?: string | null
          nf_valor?: number | null
          observacoes_internas?: string | null
          participante_id?: string | null
          reserva_id?: string | null
          status?: string
          status_processamento?: string
          tags?: string[]
          texto_extraido?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          arquivo_mime?: string | null
          arquivo_nome?: string | null
          arquivo_tamanho?: number | null
          arquivo_url?: string | null
          categoria?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          dados_extraidos?: Json
          descricao?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          expedicao_id?: string | null
          id?: string
          lead_id?: string | null
          nf_cnpj?: string | null
          nf_data?: string | null
          nf_empresa?: string | null
          nf_numero?: string | null
          nf_valor?: number | null
          observacoes_internas?: string | null
          participante_id?: string | null
          reserva_id?: string | null
          status?: string
          status_processamento?: string
          tags?: string[]
          texto_extraido?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      expedicao_assets: {
        Row: {
          created_at: string
          expedicao_id: string
          id: string
          is_capa: boolean
          ordem: number
          tipo: string
          titulo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          expedicao_id: string
          id?: string
          is_capa?: boolean
          ordem?: number
          tipo?: string
          titulo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          expedicao_id?: string
          id?: string
          is_capa?: boolean
          ordem?: number
          tipo?: string
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedicao_assets_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao_indicadores"
            referencedColumns: ["expedicao_id"]
          },
          {
            foreignKeyName: "expedicao_assets_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      expedicoes: {
        Row: {
          ativo: boolean
          capa_url: string | null
          cidade: string | null
          como_chegar_aeroporto: string | null
          como_chegar_conteudo: string | null
          como_chegar_observacoes: string | null
          como_chegar_referencia: string | null
          como_chegar_titulo: string | null
          created_at: string
          descricao_curta: string
          descricao_longa: string
          duracao: string
          estado: string | null
          galeria: Json
          id: string
          imagem_url: string | null
          inclui: Json
          marca: string
          moeda: string
          nivel: string
          nome: string
          observacoes: string | null
          ordem: number
          pais: string
          parcelamento_max: number
          politicas: Json
          preco: number
          regiao: string | null
          requisitos: Json
          roteiro: Json
          slug: string
          status: string
          subtitulo: string | null
          tags: string[]
          updated_at: string
          vagas_total_padrao: number
          video_url: string | null
        }
        Insert: {
          ativo?: boolean
          capa_url?: string | null
          cidade?: string | null
          como_chegar_aeroporto?: string | null
          como_chegar_conteudo?: string | null
          como_chegar_observacoes?: string | null
          como_chegar_referencia?: string | null
          como_chegar_titulo?: string | null
          created_at?: string
          descricao_curta: string
          descricao_longa: string
          duracao: string
          estado?: string | null
          galeria?: Json
          id?: string
          imagem_url?: string | null
          inclui?: Json
          marca?: string
          moeda?: string
          nivel: string
          nome: string
          observacoes?: string | null
          ordem?: number
          pais?: string
          parcelamento_max?: number
          politicas?: Json
          preco: number
          regiao?: string | null
          requisitos?: Json
          roteiro?: Json
          slug: string
          status?: string
          subtitulo?: string | null
          tags?: string[]
          updated_at?: string
          vagas_total_padrao?: number
          video_url?: string | null
        }
        Update: {
          ativo?: boolean
          capa_url?: string | null
          cidade?: string | null
          como_chegar_aeroporto?: string | null
          como_chegar_conteudo?: string | null
          como_chegar_observacoes?: string | null
          como_chegar_referencia?: string | null
          como_chegar_titulo?: string | null
          created_at?: string
          descricao_curta?: string
          descricao_longa?: string
          duracao?: string
          estado?: string | null
          galeria?: Json
          id?: string
          imagem_url?: string | null
          inclui?: Json
          marca?: string
          moeda?: string
          nivel?: string
          nome?: string
          observacoes?: string | null
          ordem?: number
          pais?: string
          parcelamento_max?: number
          politicas?: Json
          preco?: number
          regiao?: string | null
          requisitos?: Json
          roteiro?: Json
          slug?: string
          status?: string
          subtitulo?: string | null
          tags?: string[]
          updated_at?: string
          vagas_total_padrao?: number
          video_url?: string | null
        }
        Relationships: []
      }
      ia_configuracoes: {
        Row: {
          ativa: boolean
          dias_atendimento: string[]
          horario_fim: string | null
          horario_inicio: string | null
          id: boolean
          mensagem_fora_horario: string | null
          perguntas_qualificacao: Json
          regras_encaminhamento: Json
          singleton: boolean
          tom_ia: string | null
          updated_at: string
          whatsapp_comercial: string | null
          whatsapp_financeiro: string | null
        }
        Insert: {
          ativa?: boolean
          dias_atendimento?: string[]
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: boolean
          mensagem_fora_horario?: string | null
          perguntas_qualificacao?: Json
          regras_encaminhamento?: Json
          singleton?: boolean
          tom_ia?: string | null
          updated_at?: string
          whatsapp_comercial?: string | null
          whatsapp_financeiro?: string | null
        }
        Update: {
          ativa?: boolean
          dias_atendimento?: string[]
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: boolean
          mensagem_fora_horario?: string | null
          perguntas_qualificacao?: Json
          regras_encaminhamento?: Json
          singleton?: boolean
          tom_ia?: string | null
          updated_at?: string
          whatsapp_comercial?: string | null
          whatsapp_financeiro?: string | null
        }
        Relationships: []
      }
      integracoes_status: {
        Row: {
          categoria: string
          chave: string
          configuracao: Json
          created_at: string
          descricao: string | null
          id: string
          nome: string
          status: string
          ultimo_evento_at: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string
          chave: string
          configuracao?: Json
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          status?: string
          ultimo_evento_at?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string
          chave?: string
          configuracao?: Json
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          status?: string
          ultimo_evento_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_atividades: {
        Row: {
          autor_id: string | null
          created_at: string
          descricao: string | null
          id: string
          lead_id: string
          tipo: string
        }
        Insert: {
          autor_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id: string
          tipo: string
        }
        Update: {
          autor_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_conversas: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          canal: string | null
          conteudo: string | null
          created_at: string
          direcao: string | null
          id: string
          lead_id: string
          metadata: Json
          tipo_evento: string
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          canal?: string | null
          conteudo?: string | null
          created_at?: string
          direcao?: string | null
          id?: string
          lead_id: string
          metadata?: Json
          tipo_evento?: string
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          canal?: string | null
          conteudo?: string | null
          created_at?: string
          direcao?: string | null
          id?: string
          lead_id?: string
          metadata?: Json
          tipo_evento?: string
        }
        Relationships: []
      }
      lead_memoria: {
        Row: {
          created_at: string
          dados_extraidos: Json
          expedicoes_favoritas: Json
          id: string
          interesses: string | null
          lead_id: string
          objetivos: string | null
          orcamento: number | null
          perfil: string | null
          restricoes: string | null
          ultima_atualizacao: string
        }
        Insert: {
          created_at?: string
          dados_extraidos?: Json
          expedicoes_favoritas?: Json
          id?: string
          interesses?: string | null
          lead_id: string
          objetivos?: string | null
          orcamento?: number | null
          perfil?: string | null
          restricoes?: string | null
          ultima_atualizacao?: string
        }
        Update: {
          created_at?: string
          dados_extraidos?: Json
          expedicoes_favoritas?: Json
          id?: string
          interesses?: string | null
          lead_id?: string
          objetivos?: string | null
          orcamento?: number | null
          perfil?: string | null
          restricoes?: string | null
          ultima_atualizacao?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          acompanhantes: number
          canal_atendimento: string | null
          canal_entrada: string | null
          cidade: string | null
          cpf: string | null
          created_at: string
          data_expedicao_id: string | null
          data_interesse: string | null
          data_nascimento: string | null
          email: string | null
          estado: string | null
          etapa_atendimento: string
          expedicao_id: string | null
          expedicao_interesse: string | null
          experiencia_equestre: string | null
          id: string
          lead_score: number
          motivo_perda: string | null
          motivo_perda_detalhe: string | null
          nivel_interesse: number
          nome: string
          observacoes: string | null
          observacoes_medicas: string | null
          origem: string | null
          peso: number | null
          protocolo: string | null
          proxima_acao: string | null
          quantidade_pessoas: number
          responsavel_id: string | null
          restricoes_alimentares: string | null
          resumo_atendimento: string | null
          resumo_ia: string | null
          status: string
          status_atendimento: string
          telefone: string | null
          temperatura_lead: string
          ultima_interacao_at: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          valor_estimado: number | null
        }
        Insert: {
          acompanhantes?: number
          canal_atendimento?: string | null
          canal_entrada?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_expedicao_id?: string | null
          data_interesse?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          etapa_atendimento?: string
          expedicao_id?: string | null
          expedicao_interesse?: string | null
          experiencia_equestre?: string | null
          id?: string
          lead_score?: number
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nivel_interesse?: number
          nome: string
          observacoes?: string | null
          observacoes_medicas?: string | null
          origem?: string | null
          peso?: number | null
          protocolo?: string | null
          proxima_acao?: string | null
          quantidade_pessoas?: number
          responsavel_id?: string | null
          restricoes_alimentares?: string | null
          resumo_atendimento?: string | null
          resumo_ia?: string | null
          status?: string
          status_atendimento?: string
          telefone?: string | null
          temperatura_lead?: string
          ultima_interacao_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_estimado?: number | null
        }
        Update: {
          acompanhantes?: number
          canal_atendimento?: string | null
          canal_entrada?: string | null
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_expedicao_id?: string | null
          data_interesse?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          etapa_atendimento?: string
          expedicao_id?: string | null
          expedicao_interesse?: string | null
          experiencia_equestre?: string | null
          id?: string
          lead_score?: number
          motivo_perda?: string | null
          motivo_perda_detalhe?: string | null
          nivel_interesse?: number
          nome?: string
          observacoes?: string | null
          observacoes_medicas?: string | null
          origem?: string | null
          peso?: number | null
          protocolo?: string | null
          proxima_acao?: string | null
          quantidade_pessoas?: number
          responsavel_id?: string | null
          restricoes_alimentares?: string | null
          resumo_atendimento?: string | null
          resumo_ia?: string | null
          status?: string
          status_atendimento?: string
          telefone?: string | null
          temperatura_lead?: string
          ultima_interacao_at?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          valor_estimado?: number | null
        }
        Relationships: []
      }
      midia: {
        Row: {
          created_at: string
          expedicao_id: string | null
          id: string
          ordem: number
          tipo: string
          titulo: string | null
          url: string
        }
        Insert: {
          created_at?: string
          expedicao_id?: string | null
          id?: string
          ordem?: number
          tipo?: string
          titulo?: string | null
          url: string
        }
        Update: {
          created_at?: string
          expedicao_id?: string | null
          id?: string
          ordem?: number
          tipo?: string
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "midia_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao_indicadores"
            referencedColumns: ["expedicao_id"]
          },
          {
            foreignKeyName: "midia_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes_lidas: {
        Row: {
          created_at: string
          id: string
          lida_em: string
          user_id: string
          webhook_evento_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida_em?: string
          user_id: string
          webhook_evento_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida_em?: string
          user_id?: string
          webhook_evento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_lidas_webhook_evento_id_fkey"
            columns: ["webhook_evento_id"]
            isOneToOne: false
            referencedRelation: "webhooks_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          cliente_nome: string | null
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_prevista: string | null
          expedicao_id: string | null
          forma: string
          id: string
          observacoes: string | null
          parcela_atual: number | null
          parcela_total: number | null
          registrado_por: string | null
          reserva_id: string
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_nome?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_prevista?: string | null
          expedicao_id?: string | null
          forma?: string
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcela_total?: number | null
          registrado_por?: string | null
          reserva_id: string
          status?: string
          tipo?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_nome?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_prevista?: string | null
          expedicao_id?: string | null
          forma?: string
          id?: string
          observacoes?: string | null
          parcela_atual?: number | null
          parcela_total?: number | null
          registrado_por?: string | null
          reserva_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      participantes: {
        Row: {
          acompanhante: string | null
          contato: string | null
          cpf: string | null
          created_at: string
          data_id: string | null
          data_nascimento: string | null
          documento: string | null
          email: string | null
          expedicao_id: string | null
          experiencia_equestre: string | null
          id: string
          nome: string
          observacoes_medicas: string | null
          peso: number | null
          reserva_id: string | null
          restricoes: string | null
          restricoes_alimentares: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          acompanhante?: string | null
          contato?: string | null
          cpf?: string | null
          created_at?: string
          data_id?: string | null
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          expedicao_id?: string | null
          experiencia_equestre?: string | null
          id?: string
          nome: string
          observacoes_medicas?: string | null
          peso?: number | null
          reserva_id?: string | null
          restricoes?: string | null
          restricoes_alimentares?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          acompanhante?: string | null
          contato?: string | null
          cpf?: string | null
          created_at?: string
          data_id?: string | null
          data_nascimento?: string | null
          documento?: string | null
          email?: string | null
          expedicao_id?: string | null
          experiencia_equestre?: string | null
          id?: string
          nome?: string
          observacoes_medicas?: string | null
          peso?: number | null
          reserva_id?: string | null
          restricoes?: string | null
          restricoes_alimentares?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participantes_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          cargo_id: string | null
          created_at: string
          data_entrada: string | null
          id: string
          nome: string | null
          role: string
          telefone: string | null
          ultimo_login: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          cargo_id?: string | null
          created_at?: string
          data_entrada?: string | null
          id?: string
          nome?: string | null
          role?: string
          telefone?: string | null
          ultimo_login?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          cargo_id?: string | null
          created_at?: string
          data_entrada?: string | null
          id?: string
          nome?: string | null
          role?: string
          telefone?: string | null
          ultimo_login?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_counter: {
        Row: {
          ano: number
          valor: number
        }
        Insert: {
          ano: number
          valor?: number
        }
        Update: {
          ano?: number
          valor?: number
        }
        Relationships: []
      }
      protocolo_lead_counter: {
        Row: {
          ano: number
          valor: number
        }
        Insert: {
          ano: number
          valor?: number
        }
        Update: {
          ano?: number
          valor?: number
        }
        Relationships: []
      }
      reserva_documentos: {
        Row: {
          assinado_em: string | null
          created_at: string
          enviado_em: string | null
          id: string
          observacoes: string | null
          reserva_id: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          assinado_em?: string | null
          created_at?: string
          enviado_em?: string | null
          id?: string
          observacoes?: string | null
          reserva_id: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          assinado_em?: string | null
          created_at?: string
          enviado_em?: string | null
          id?: string
          observacoes?: string | null
          reserva_id?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reserva_documentos_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_historico: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          created_at: string
          descricao: string
          id: string
          metadata: Json
          reserva_id: string
          tipo: string
          valor: number | null
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          created_at?: string
          descricao: string
          id?: string
          metadata?: Json
          reserva_id: string
          tipo: string
          valor?: number | null
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          created_at?: string
          descricao?: string
          id?: string
          metadata?: Json
          reserva_id?: string
          tipo?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reserva_historico_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas: {
        Row: {
          aceites: Json
          adicionais: Json
          cliente_cpf: string | null
          cliente_email: string | null
          cliente_nome: string | null
          cliente_telefone: string | null
          contrato_assinado: boolean
          contrato_assinado_em: string | null
          contrato_enviado: boolean
          contrato_enviado_em: string | null
          created_at: string
          data_id: string | null
          data_label: string
          expedicao_id: string | null
          expedicao_nome: string
          forma_pagamento: string | null
          grupo_nome: string | null
          id: string
          lead_id: string | null
          observacoes_internas: string | null
          parcelas: number
          participantes: Json
          protocolo: string
          quantidade_participantes: number
          responsavel: Json
          responsavel_id: string | null
          saldo_restante: number | null
          status: string
          status_financeiro: string
          status_operacional: string
          status_pagamento: string
          updated_at: string
          valor_entrada: number | null
          valor_pago: number
          valor_total: number | null
        }
        Insert: {
          aceites?: Json
          adicionais?: Json
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          contrato_assinado?: boolean
          contrato_assinado_em?: string | null
          contrato_enviado?: boolean
          contrato_enviado_em?: string | null
          created_at?: string
          data_id?: string | null
          data_label: string
          expedicao_id?: string | null
          expedicao_nome: string
          forma_pagamento?: string | null
          grupo_nome?: string | null
          id?: string
          lead_id?: string | null
          observacoes_internas?: string | null
          parcelas?: number
          participantes?: Json
          protocolo: string
          quantidade_participantes?: number
          responsavel: Json
          responsavel_id?: string | null
          saldo_restante?: number | null
          status?: string
          status_financeiro?: string
          status_operacional?: string
          status_pagamento?: string
          updated_at?: string
          valor_entrada?: number | null
          valor_pago?: number
          valor_total?: number | null
        }
        Update: {
          aceites?: Json
          adicionais?: Json
          cliente_cpf?: string | null
          cliente_email?: string | null
          cliente_nome?: string | null
          cliente_telefone?: string | null
          contrato_assinado?: boolean
          contrato_assinado_em?: string | null
          contrato_enviado?: boolean
          contrato_enviado_em?: string | null
          created_at?: string
          data_id?: string | null
          data_label?: string
          expedicao_id?: string | null
          expedicao_nome?: string
          forma_pagamento?: string | null
          grupo_nome?: string | null
          id?: string
          lead_id?: string | null
          observacoes_internas?: string | null
          parcelas?: number
          participantes?: Json
          protocolo?: string
          quantidade_participantes?: number
          responsavel?: Json
          responsavel_id?: string | null
          saldo_restante?: number | null
          status?: string
          status_financeiro?: string
          status_operacional?: string
          status_pagamento?: string
          updated_at?: string
          valor_entrada?: number | null
          valor_pago?: number
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservas_data_id_fkey"
            columns: ["data_id"]
            isOneToOne: false
            referencedRelation: "datas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicao_indicadores"
            referencedColumns: ["expedicao_id"]
          },
          {
            foreignKeyName: "reservas_expedicao_id_fkey"
            columns: ["expedicao_id"]
            isOneToOne: false
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_protection: {
        Row: {
          id: boolean
          password_hash: string | null
          updated_at: string
        }
        Insert: {
          id?: boolean
          password_hash?: string | null
          updated_at?: string
        }
        Update: {
          id?: boolean
          password_hash?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_module_permissions: {
        Row: {
          created_at: string
          id: string
          modulo: string
          pode_editar: boolean
          pode_ver: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          modulo: string
          pode_editar?: boolean
          pode_ver?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          modulo?: string
          pode_editar?: boolean
          pode_ver?: boolean
          updated_at?: string
          user_id?: string
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
      webhooks_eventos: {
        Row: {
          created_at: string
          entidade: string
          entidade_id: string | null
          evento: string
          id: string
          payload: Json
          processado_em: string | null
          status: string
          tentativas: number
          ultimo_erro: string | null
        }
        Insert: {
          created_at?: string
          entidade: string
          entidade_id?: string | null
          evento: string
          id?: string
          payload?: Json
          processado_em?: string | null
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
        }
        Update: {
          created_at?: string
          entidade?: string
          entidade_id?: string | null
          evento?: string
          id?: string
          payload?: Json
          processado_em?: string | null
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      expedicao_indicadores: {
        Row: {
          custos_previstos: number | null
          custos_realizados: number | null
          expedicao_id: string | null
          expedicao_nome: string | null
          lucro_estimado: number | null
          lucro_realizado: number | null
          participantes_confirmados: number | null
          participantes_pendentes: number | null
          receita_prevista: number | null
          receita_recebida: number | null
          slug: string | null
          vagas_disponiveis: number | null
          vagas_ocupadas: number | null
          vagas_totais: number | null
          valor_pendente: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      gerar_protocolo: { Args: never; Returns: string }
      gerar_protocolo_lead: { Args: never; Returns: string }
      get_primary_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_user: { Args: { _user_id: string }; Returns: boolean }
      scan_parcelas_vencimento: { Args: never; Returns: undefined }
      slugify_unique_expedicao: { Args: { base: string }; Returns: string }
    }
    Enums: {
      app_role:
        | "admin"
        | "operador"
        | "financeiro"
        | "midia"
        | "operacional"
        | "atendimento"
        | "superadmin"
        | "ceo"
        | "socia"
        | "desenvolvedor"
        | "ceo_preview"
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
        "admin",
        "operador",
        "financeiro",
        "midia",
        "operacional",
        "atendimento",
        "superadmin",
        "ceo",
        "socia",
        "desenvolvedor",
        "ceo_preview",
      ],
    },
  },
} as const
