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
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
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
      leads: {
        Row: {
          acompanhantes: number
          cidade: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          estado: string | null
          expedicao_interesse: string | null
          experiencia_equestre: string | null
          id: string
          nome: string
          observacoes: string | null
          observacoes_medicas: string | null
          origem: string | null
          peso: number | null
          protocolo: string | null
          quantidade_pessoas: number
          restricoes_alimentares: string | null
          status: string
          telefone: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          acompanhantes?: number
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          expedicao_interesse?: string | null
          experiencia_equestre?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          observacoes_medicas?: string | null
          origem?: string | null
          peso?: number | null
          protocolo?: string | null
          quantidade_pessoas?: number
          restricoes_alimentares?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          acompanhantes?: number
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          estado?: string | null
          expedicao_interesse?: string | null
          experiencia_equestre?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          observacoes_medicas?: string | null
          origem?: string | null
          peso?: number | null
          protocolo?: string | null
          quantidade_pessoas?: number
          restricoes_alimentares?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
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
            referencedRelation: "expedicoes"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string
          id: string
          nome: string | null
          role: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          role?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          role?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      reservas: {
        Row: {
          aceites: Json
          adicionais: Json
          created_at: string
          data_id: string | null
          data_label: string
          expedicao_id: string | null
          expedicao_nome: string
          forma_pagamento: string | null
          grupo_nome: string | null
          id: string
          parcelas: number
          participantes: Json
          protocolo: string
          quantidade_participantes: number
          responsavel: Json
          saldo_restante: number | null
          status: string
          status_pagamento: string
          updated_at: string
          valor_pago: number
          valor_total: number | null
        }
        Insert: {
          aceites?: Json
          adicionais?: Json
          created_at?: string
          data_id?: string | null
          data_label: string
          expedicao_id?: string | null
          expedicao_nome: string
          forma_pagamento?: string | null
          grupo_nome?: string | null
          id?: string
          parcelas?: number
          participantes?: Json
          protocolo: string
          quantidade_participantes?: number
          responsavel: Json
          saldo_restante?: number | null
          status?: string
          status_pagamento?: string
          updated_at?: string
          valor_pago?: number
          valor_total?: number | null
        }
        Update: {
          aceites?: Json
          adicionais?: Json
          created_at?: string
          data_id?: string | null
          data_label?: string
          expedicao_id?: string | null
          expedicao_nome?: string
          forma_pagamento?: string | null
          grupo_nome?: string | null
          id?: string
          parcelas?: number
          participantes?: Json
          protocolo?: string
          quantidade_participantes?: number
          responsavel?: Json
          saldo_restante?: number | null
          status?: string
          status_pagamento?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
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
      ],
    },
  },
} as const
