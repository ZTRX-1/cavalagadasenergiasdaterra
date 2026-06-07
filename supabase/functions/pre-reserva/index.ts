// Edge Function — Pré-reserva pública
// Recebe submissões do formulário /reserva/$slug, valida e grava em
// public.leads + public.reservas usando service role. Também expõe consulta
// pública por protocolo (somente dados mínimos).
//
// Ações:
//   POST { action: "criar", ...payload } -> { protocolo, reserva_id, lead_id }
//   POST { action: "consultar", protocolo } -> { ...dados minimos } | null
//
// Acesso anônimo é permitido (verify_jwt = false em config.toml).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Participante = {
  nome: string;
  idade: number;
  peso: number;
  experiencia: "nenhuma" | "iniciante" | "intermediario" | "avancado";
};

type CriarPayload = {
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
  participantes: Participante[];
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

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function validarCriar(b: any): { ok: true; data: CriarPayload } | { ok: false; error: string } {
  if (!b || typeof b !== "object") return { ok: false, error: "Payload inválido." };
  if (!isUuid(b.expedicao_id)) return { ok: false, error: "expedicao_id inválido." };
  if (!isUuid(b.data_id)) return { ok: false, error: "data_id inválido." };
  if (typeof b.expedicao_nome !== "string" || b.expedicao_nome.length < 1) return { ok: false, error: "expedicao_nome obrigatório." };
  if (typeof b.data_label !== "string" || b.data_label.length < 1) return { ok: false, error: "data_label obrigatório." };
  if (typeof b.preco_unitario !== "number" || b.preco_unitario < 0) return { ok: false, error: "preco_unitario inválido." };

  const r = b.responsavel;
  if (!r || typeof r !== "object") return { ok: false, error: "responsavel obrigatório." };
  for (const k of ["nome", "cpf", "telefone", "email", "cidade", "estado"]) {
    if (typeof r[k] !== "string" || r[k].trim().length < 2) return { ok: false, error: `responsavel.${k} inválido.` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return { ok: false, error: "responsavel.email inválido." };

  if (!Array.isArray(b.participantes) || b.participantes.length < 1 || b.participantes.length > 20) {
    return { ok: false, error: "participantes deve ter entre 1 e 20." };
  }
  for (const p of b.participantes) {
    if (!p || typeof p.nome !== "string" || p.nome.trim().length < 2) return { ok: false, error: "participante.nome inválido." };
    if (typeof p.idade !== "number" || p.idade < 1 || p.idade > 110) return { ok: false, error: "participante.idade inválida." };
    if (typeof p.peso !== "number" || p.peso < 20 || p.peso > 110) return { ok: false, error: "participante.peso inválido." };
    if (!["nenhuma", "iniciante", "intermediario", "avancado"].includes(p.experiencia)) return { ok: false, error: "participante.experiencia inválida." };
  }

  const a = b.adicionais;
  if (!a || typeof a !== "object") return { ok: false, error: "adicionais obrigatório." };
  for (const k of ["tipo_grupo", "forma_pagamento", "como_conheceu"]) {
    if (typeof a[k] !== "string" || a[k].length < 1) return { ok: false, error: `adicionais.${k} obrigatório.` };
  }

  const ac = b.aceites;
  if (!ac || ac.responsabilidade !== true || ac.cancelamento !== true || ac.riscos !== true) {
    return { ok: false, error: "Aceites obrigatórios não confirmados." };
  }

  return { ok: true, data: b as CriarPayload };
}

async function handleCriar(payload: CriarPayload) {
  const qtd = payload.participantes.length;
  const valor_total = payload.preco_unitario * qtd;

  const { data: protoData, error: protoErr } = await admin.rpc("gerar_protocolo");
  if (protoErr || !protoData) return json({ error: "Não foi possível gerar protocolo." }, 500);
  const protocolo = String(protoData);

  const { data: protoLeadData } = await admin.rpc("gerar_protocolo_lead");

  const firstP = payload.participantes[0];
  const leadPayload = {
    nome: payload.responsavel.nome,
    email: payload.responsavel.email,
    telefone: payload.responsavel.telefone,
    cpf: payload.responsavel.cpf,
    cidade: payload.responsavel.cidade,
    estado: payload.responsavel.estado,
    expedicao_interesse: payload.expedicao_nome,
    origem: payload.adicionais.como_conheceu || "pre_reserva_site",
    canal_entrada: "site",
    status: "novo",
    etapa_atendimento: "novo",
    nivel_interesse: 5,
    lead_score: 80,
    quantidade_pessoas: qtd,
    valor_estimado: valor_total,
    data_interesse: payload.data_inicio ?? null,
    observacoes: payload.adicionais.observacoes ?? null,
    restricoes_alimentares: payload.adicionais.restricoes ?? null,
    protocolo: (protoLeadData as string | null) ?? null,
    // Novos campos herdados do primeiro participante
    peso: firstP?.peso,
    experiencia_equestre: firstP?.experiencia,
    data_nascimento: firstP?.idade ? new Date(new Date().getFullYear() - firstP.idade, 0, 1).toISOString().split('T')[0] : null,
  };

  const { data: leadRow, error: leadErr } = await admin
    .from("leads")
    .insert(leadPayload as never)
    .select("id")
    .single();
  if (leadErr) return json({ error: "Falha ao criar lead: " + leadErr.message }, 500);

  const reservaPayload = {
    protocolo,
    lead_id: leadRow.id,
    expedicao_id: payload.expedicao_id,
    expedicao_nome: payload.expedicao_nome,
    data_id: payload.data_id,
    data_label: payload.data_label,
    status: "pre_reserva_enviada",
    status_operacional: "pre_reserva",
    status_financeiro: "aguardando_pagamento",
    quantidade_participantes: qtd,
    cliente_nome: payload.responsavel.nome,
    cliente_email: payload.responsavel.email,
    cliente_telefone: payload.responsavel.telefone,
    cliente_cpf: payload.responsavel.cpf,
    responsavel: payload.responsavel,
    participantes: payload.participantes,
    adicionais: payload.adicionais,
    aceites: payload.aceites,
    forma_pagamento: payload.adicionais.forma_pagamento,
    valor_total,
  };

  const { data: reservaRow, error: reservaErr } = await admin
    .from("reservas")
    .insert(reservaPayload as never)
    .select("id, protocolo")
    .single();
  if (reservaErr) return json({ error: "Falha ao criar reserva: " + reservaErr.message }, 500);

  return json({
    protocolo: reservaRow.protocolo,
    reserva_id: reservaRow.id,
    lead_id: leadRow.id,
  });
}

async function handleConsultar(protocolo: unknown) {
  if (typeof protocolo !== "string" || protocolo.trim().length < 6 || protocolo.trim().length > 40) {
    return json({ error: "Protocolo inválido." }, 400);
  }
  const proto = protocolo.trim().toUpperCase();
  const { data: row, error } = await admin
    .from("reservas")
    .select("protocolo, expedicao_nome, data_label, quantidade_participantes, status, status_operacional, status_financeiro, responsavel, created_at")
    .eq("protocolo", proto)
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!row) return json(null);

  const responsavel = (row.responsavel ?? {}) as { nome?: string };
  return json({
    protocolo: row.protocolo,
    expedicao_nome: row.expedicao_nome,
    data_label: row.data_label,
    quantidade_participantes: row.quantidade_participantes,
    nome_responsavel: responsavel.nome ?? "—",
    status: row.status ?? "pre_reserva_enviada",
    status_operacional: row.status_operacional ?? "pre_reserva",
    status_financeiro: row.status_financeiro ?? "aguardando_pagamento",
    created_at: row.created_at,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não suportado." }, 405);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const action = String(body.action ?? "");
  try {
    if (action === "criar") {
      const v = validarCriar(body);
      if (!v.ok) return json({ error: v.error }, 400);
      return await handleCriar(v.data);
    }
    if (action === "consultar") {
      return await handleConsultar(body.protocolo);
    }
    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ error: (e as Error)?.message ?? "Erro interno." }, 500);
  }
});
