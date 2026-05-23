import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const responsavelSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  cpf: z.string().trim().min(11).max(20),
  telefone: z.string().trim().min(8).max(30),
  email: z.string().trim().email().max(160),
  cidade: z.string().trim().min(2).max(80),
  estado: z.string().trim().min(2).max(40),
});

const participanteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  idade: z.coerce.number().int().min(1).max(110),
  peso: z.coerce.number().min(20).max(200),
  experiencia: z.enum(["nenhuma", "iniciante", "intermediario", "avancado"]),
});

const adicionaisSchema = z.object({
  forma_pagamento: z.string().min(2).max(60),
  como_conheceu: z.string().min(2).max(60),
  restricoes: z.string().max(500).optional().default(""),
  observacoes: z.string().max(800).optional().default(""),
  tipo_grupo: z.string().min(2).max(60),
});

const aceitesSchema = z.object({
  responsabilidade: z.literal(true),
  cancelamento: z.literal(true),
  riscos: z.literal(true),
});

const createReservaSchema = z.object({
  expedicao_id: z.string().uuid(),
  data_id: z.string().uuid(),
  responsavel: responsavelSchema,
  participantes: z.array(participanteSchema).min(1).max(20),
  adicionais: adicionaisSchema,
  aceites: aceitesSchema,
});

export const createReserva = createServerFn({ method: "POST" })
  .inputValidator((d) => createReservaSchema.parse(d))
  .handler(async ({ data }) => {
    // Buscar expedição e data para labels
    const { data: exp, error: e1 } = await supabaseAdmin
      .from("expedicoes")
      .select("id, nome")
      .eq("id", data.expedicao_id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!exp) throw new Error("Expedição não encontrada");

    const { data: dt, error: e2 } = await supabaseAdmin
      .from("datas")
      .select("id, data_inicio, data_fim")
      .eq("id", data.data_id)
      .maybeSingle();
    if (e2) throw new Error(e2.message);
    if (!dt) throw new Error("Data não encontrada");

    // Gerar protocolo via RPC (SECURITY DEFINER)
    const { data: protoData, error: e3 } = await supabaseAdmin.rpc("gerar_protocolo");
    if (e3) throw new Error(e3.message);
    const protocolo = protoData as string;

    const dataLabel = `${dt.data_inicio} a ${dt.data_fim}`;

    const { error: e4 } = await supabaseAdmin.from("reservas").insert({
      protocolo,
      expedicao_id: exp.id,
      data_id: dt.id,
      expedicao_nome: exp.nome,
      data_label: dataLabel,
      responsavel: data.responsavel,
      participantes: data.participantes,
      adicionais: data.adicionais,
      aceites: data.aceites,
      quantidade_participantes: data.participantes.length,
      status: "pre_reserva_enviada",
    });
    if (e4) throw new Error(e4.message);

    return {
      protocolo,
      expedicao_nome: exp.nome,
      data_inicio: dt.data_inicio,
      data_fim: dt.data_fim,
      quantidade_participantes: data.participantes.length,
      nome_responsavel: data.responsavel.nome,
    };
  });

export const consultarReserva = createServerFn({ method: "POST" })
  .inputValidator((d: { protocolo: string }) =>
    z.object({ protocolo: z.string().trim().min(6).max(40).regex(/^[A-Z0-9-]+$/i) }).parse(d),
  )
  .handler(async ({ data }) => {
    const proto = data.protocolo.toUpperCase();
    const { data: r, error } = await supabaseAdmin
      .from("reservas")
      .select("protocolo, expedicao_nome, data_label, quantidade_participantes, status, created_at, responsavel")
      .eq("protocolo", proto)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) return null;
    const responsavel = r.responsavel as { nome?: string };
    return {
      protocolo: r.protocolo,
      expedicao_nome: r.expedicao_nome,
      data_label: r.data_label,
      quantidade_participantes: r.quantidade_participantes,
      status: r.status,
      created_at: r.created_at,
      nome_responsavel: responsavel?.nome ?? "",
    };
  });
