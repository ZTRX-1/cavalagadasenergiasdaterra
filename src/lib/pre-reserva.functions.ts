/**
 * Pré-reserva pública (rota /reserva/$slug oculta da navegação).
 * Grava no CRM (leads + reservas) e devolve protocolo gerado no banco.
 * Pode ser chamada por visitante anônimo — usa supabaseAdmin no servidor.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const participanteSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  idade: z.number().int().min(1).max(110),
  peso: z.number().min(20).max(110),
  experiencia: z.enum(["nenhuma", "iniciante", "intermediario", "avancado"]),
});

const inputSchema = z.object({
  expedicao_id: z.string().uuid(),
  expedicao_nome: z.string().min(1).max(200),
  data_id: z.string().uuid(),
  data_label: z.string().min(1).max(120),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  preco_unitario: z.number().min(0),
  moeda: z.string().min(1).max(8).default("BRL"),
  responsavel: z.object({
    nome: z.string().trim().min(2).max(160),
    cpf: z.string().trim().min(11).max(20),
    telefone: z.string().trim().min(10).max(32),
    email: z.string().trim().email().max(200),
    cidade: z.string().trim().min(2).max(120),
    estado: z.string().trim().min(2).max(2),
  }),
  participantes: z.array(participanteSchema).min(1).max(20),
  adicionais: z.object({
    tipo_grupo: z.string().max(40),
    forma_pagamento: z.string().max(40),
    como_conheceu: z.string().max(40),
    restricoes: z.string().max(2000).optional(),
    observacoes: z.string().max(2000).optional(),
  }),
  aceites: z.object({
    responsabilidade: z.boolean(),
    cancelamento: z.boolean(),
    riscos: z.boolean(),
  }),
});

export const criarPreReserva = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    if (!data.aceites.responsabilidade || !data.aceites.cancelamento || !data.aceites.riscos) {
      throw new Error("Aceites obrigatórios não confirmados.");
    }

    const qtd = data.participantes.length;
    const valor_total = data.preco_unitario * qtd;

    // 1) Gera protocolo aleatório no banco
    const { data: protoData, error: protoErr } = await supabaseAdmin.rpc("gerar_protocolo");
    if (protoErr || !protoData) throw new Error("Não foi possível gerar protocolo: " + (protoErr?.message ?? ""));
    const protocolo = protoData as string;

    // 2) Cria lead (CRM) — origem pre_reserva_site
    const { data: protoLeadData } = await supabaseAdmin.rpc("gerar_protocolo_lead");
    const leadPayload = {
      nome: data.responsavel.nome,
      email: data.responsavel.email,
      telefone: data.responsavel.telefone,
      cpf: data.responsavel.cpf,
      cidade: data.responsavel.cidade,
      estado: data.responsavel.estado,
      expedicao_interesse: data.expedicao_nome,
      origem: "pre_reserva_site",
      canal_entrada: "site",
      status: "pronto_reserva",
      etapa_atendimento: "pronto_reserva",
      nivel_interesse: 5,
      lead_score: 80,
      quantidade_pessoas: qtd,
      valor_estimado: valor_total,
      data_interesse: data.data_inicio ?? null,
      observacoes: data.adicionais.observacoes ?? null,
      restricoes_alimentares: data.adicionais.restricoes ?? null,
      protocolo: (protoLeadData as string | null) ?? null,
    };
    const { data: leadRow, error: leadErr } = await supabaseAdmin
      .from("leads")
      .insert(leadPayload as never)
      .select("id")
      .single();
    if (leadErr) throw new Error("Falha ao criar lead: " + leadErr.message);

    // 3) Cria reserva vinculada
    const reservaPayload = {
      protocolo,
      lead_id: leadRow.id,
      expedicao_id: data.expedicao_id,
      expedicao_nome: data.expedicao_nome,
      data_id: data.data_id,
      data_label: data.data_label,
      status: "pre_reserva_enviada",
      status_operacional: "pre_reserva",
      status_financeiro: "aguardando_pagamento",
      quantidade_participantes: qtd,
      cliente_nome: data.responsavel.nome,
      cliente_email: data.responsavel.email,
      cliente_telefone: data.responsavel.telefone,
      cliente_cpf: data.responsavel.cpf,
      responsavel: data.responsavel as never,
      participantes: data.participantes as never,
      adicionais: data.adicionais as never,
      aceites: data.aceites as never,
      forma_pagamento: data.adicionais.forma_pagamento,
      valor_total,
    };
    const { data: reservaRow, error: reservaErr } = await supabaseAdmin
      .from("reservas")
      .insert(reservaPayload as never)
      .select("id, protocolo")
      .single();
    if (reservaErr) throw new Error("Falha ao criar reserva: " + reservaErr.message);

    return {
      protocolo: reservaRow.protocolo as string,
      reserva_id: reservaRow.id as string,
      lead_id: leadRow.id as string,
    };
  });

/** Consulta pública por protocolo — devolve apenas dados mínimos para a página "Minha Reserva". */
export const consultarReservaPorProtocolo = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ protocolo: z.string().trim().min(6).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const proto = data.protocolo.toUpperCase();
    const { data: row, error } = await supabaseAdmin
      .from("reservas")
      .select("protocolo, expedicao_nome, data_label, quantidade_participantes, status, status_operacional, status_financeiro, responsavel, created_at")
      .eq("protocolo", proto)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const responsavel = (row.responsavel ?? {}) as { nome?: string };
    return {
      protocolo: row.protocolo as string,
      expedicao_nome: row.expedicao_nome as string,
      data_label: row.data_label as string,
      quantidade_participantes: row.quantidade_participantes as number,
      nome_responsavel: responsavel.nome ?? "—",
      status: (row.status as string) ?? "pre_reserva_enviada",
      status_operacional: (row.status_operacional as string) ?? "pre_reserva",
      status_financeiro: (row.status_financeiro as string) ?? "aguardando_pagamento",
      created_at: row.created_at as string,
    };
  });
