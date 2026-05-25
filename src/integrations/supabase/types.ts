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
          created_at: string
          expedicao_id: string | null
          id: string
          participante_id: string | null
          tipo: string
          titulo: string
          url: string
        }
        Insert: {
          created_at?: string
          expedicao_id?: string | null
          id?: string
          participante_id?: string | null
          tipo?: string
          titulo: string
          url: string
        }
        Update: {
          created_at?: string
          expedicao_id?: string | null
          id?: string
          participante_id?: string | null
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
      expedicoes: {
        Row: {
          ativo: boolean
          created_at: string
          descricao_curta: string
          descricao_longa: string
          duracao: string
          galeria: Json
          id: string
          imagem_url: string | null
          inclui: Json
          marca: string
          moeda: string
          nivel: string
          nome: string
          ordem: number
          pais: string
          preco: number
          regiao: string | null
          requisitos: Json
          roteiro: Json
          slug: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao_curta: string
          descricao_longa: string
          duracao: string
          galeria?: Json
          id?: string
          imagem_url?: string | null
          inclui?: Json
          marca?: string
          moeda?: string
          nivel: string
          nome: string
          ordem?: number
          pais?: string
          preco: number
          regiao?: string | null
          requisitos?: Json
          roteiro?: Json
          slug: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao_curta?: string
          descricao_longa?: string
          duracao?: string
          galeria?: Json
          id?: string
          imagem_url?: string | null
          inclui?: Json
          marca?: string
          moeda?: string
          nivel?: string
          nome?: string
          ordem?: number
          pais?: string
          preco?: number
          regiao?: string | null
          requisitos?: Json
          roteiro?: Json
          slug?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          expedicao_interesse: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          expedicao_interesse?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          expedicao_interesse?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
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
          contato: string | null
          created_at: string
          documento: string | null
          id: string
          nome: string
          observacoes_medicas: string | null
          reserva_id: string | null
          updated_at: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          nome: string
          observacoes_medicas?: string | null
          reserva_id?: string | null
          updated_at?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          documento?: string | null
          id?: string
          nome?: string
          observacoes_medicas?: string | null
          reserva_id?: string | null
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
          avatar_url: string | null
          cargo: string | null
          created_at: string
          id: string
          nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          id?: string
          nome?: string | null
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
      reservas: {
        Row: {
          aceites: Json
          adicionais: Json
          created_at: string
          data_id: string | null
          data_label: string
          expedicao_id: string | null
          expedicao_nome: string
          id: string
          participantes: Json
          protocolo: string
          quantidade_participantes: number
          responsavel: Json
          status: string
        }
        Insert: {
          aceites?: Json
          adicionais?: Json
          created_at?: string
          data_id?: string | null
          data_label: string
          expedicao_id?: string | null
          expedicao_nome: string
          id?: string
          participantes?: Json
          protocolo: string
          quantidade_participantes?: number
          responsavel: Json
          status?: string
        }
        Update: {
          aceites?: Json
          adicionais?: Json
          created_at?: string
          data_id?: string | null
          data_label?: string
          expedicao_id?: string | null
          expedicao_nome?: string
          id?: string
          participantes?: Json
          protocolo?: string
          quantidade_participantes?: number
          responsavel?: Json
          status?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_internal_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "operador" | "financeiro" | "midia"
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
      app_role: ["admin", "operador", "financeiro", "midia"],
    },
  },
} as const
