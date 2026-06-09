/**
 * Cliente da pré-reserva pública.
 * Conversa com a Edge Function `pre-reserva`, que valida e grava em
 * public.leads + public.reservas usando service role.
 */
import { supabase } from "@/integrations/supabase/client";

export type PreReservaInput = {
  lead_id?: string;
  expedicao_id: string;
  expedicao_nome: string;
  data_id: string;
  data_label: string;
  data_inicio?: string | null;
  data_fim?: string | null;
  preco_unitario: number;
  moeda?: string;
  responsavel: {
    nome: string;
    cpf: string;
    telefone: string;
    email: string;
    cidade: string;
    estado: string;
  };
  participantes: Array<{
    nome: string;
    cpf: string;
    data_nascimento: string;
    peso: number;
    experiencia: "nenhuma" | "iniciante" | "intermediario" | "avancado";
    telefone?: string;
    email?: string;
  }>;
  adicionais: {
    tipo_grupo: string;
    forma_pagamento: string;
    como_conheceu: string;
    restricoes?: string | null;
    observacoes?: string | null;
  };
  aceites: {
    responsabilidade: boolean;
    cancelamento: boolean;
    riscos: boolean;
  };
};

export type PreReservaResposta = {
  protocolo: string;
  reserva_id: string;
  lead_id: string;
};

export type ReservaConsulta = {
  protocolo: string;
  expedicao_nome: string;
  data_label: string;
  quantidade_participantes: number;
  nome_responsavel: string;
  status: string;
  status_operacional: string;
  status_financeiro: string;
  created_at: string;
};

export async function criarPreReserva(input: PreReservaInput): Promise<PreReservaResposta> {
  const { data, error } = await supabase.functions.invoke("pre-reserva", {
    body: { action: "criar", ...input },
  });
  if (error) throw new Error(error.message || "Falha ao enviar pré-reserva.");
  if (data?.error) throw new Error(data.error);
  return data as PreReservaResposta;
}

export async function consultarReservaPorProtocolo(protocolo: string): Promise<ReservaConsulta | null> {
  const { data, error } = await supabase.functions.invoke("pre-reserva", {
    body: { action: "consultar", protocolo },
  });
  if (error) throw new Error(error.message || "Falha ao consultar reserva.");
  if (data?.error) throw new Error(data.error);
  return (data as ReservaConsulta | null) ?? null;
}

export type CapturaProgressivaInput = {
  lead_id?: string;
  nome: string;
  email: string;
  telefone: string;
  expedicao_interesse?: string;
  etapa_abandono?: string;
  origem?: string;
  cidade?: string;
  estado?: string;
  tipo_grupo?: string;
  motivacao_viagem?: string;
  observacoes_importantes?: string;
  quantidade_pessoas?: number;
  data_interesse?: string;
  canal_atendimento?: string;
  experiencia_equestre?: string;
  idade?: number;
};

export async function capturarLeadProgressivo(input: CapturaProgressivaInput): Promise<{ lead_id: string }> {
  const { data, error } = await supabase.functions.invoke("pre-reserva", {
    body: { action: "captura_progressiva", ...input },
  });
  if (error) throw new Error(error.message || "Falha na captura progressiva.");
  if (data?.error) throw new Error(data.error);
  return data as { lead_id: string };
}
