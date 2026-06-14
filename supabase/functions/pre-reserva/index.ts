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
  data_nascimento: string;
  cpf: string;
  peso: number;
  experiencia: "nenhuma" | "iniciante" | "intermediario" | "avancado";
  telefone?: string;
  email?: string;
  idade?: number;
};

type CriarPayload = {
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
    data_nascimento?: string;
    peso?: number;
  };
  participantes: Participante[];
  adicionais: {
    tipo_grupo: string;
    forma_pagamento: string;
    como_conheceu: string;
    motivacao_viagem: string;
    observacoes_importantes?: string | null;
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
  for (const k of ["nome", "cpf", "telefone", "email", "cidade", "estado", "data_nascimento"]) {
    if (typeof r[k] !== "string" || r[k].trim().length < 2) return { ok: false, error: `responsavel.${k} inválido.` };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return { ok: false, error: "responsavel.email inválido." };

  if (!Array.isArray(b.participantes) || b.participantes.length < 1 || b.participantes.length > 20) {
    return { ok: false, error: "participantes deve ter entre 1 e 20." };
  }
  for (const p of b.participantes) {
    if (!p || typeof p.nome !== "string" || p.nome.trim().length < 2) return { ok: false, error: "participante.nome inválido." };
    if (typeof p.cpf !== "string" || p.cpf.trim().length < 11) return { ok: false, error: "participante.cpf obrigatório." };
    if (typeof p.data_nascimento !== "string" || p.data_nascimento.length < 10) return { ok: false, error: "participante.data_nascimento obrigatória." };
    const age = (new Date().getFullYear()) - (new Date(p.data_nascimento).getFullYear());
    if (age < 8) return { ok: false, error: "Idade mínima permitida é 8 anos." };
    if (typeof p.peso !== "number" || p.peso < 20 || p.peso > 120) return { ok: false, error: "participante.peso inválido." };
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
  console.log("Iniciando handleCriar para expedição:", payload.expedicao_nome);
  
  // SEGURANÇA: Validar preço unitário a partir do banco de dados
  const { data: realData, error: dataErr } = await admin
    .from("datas")
    .select("preco_pix, preco_cartao, status, vagas_disponiveis, moeda, expedicao_id")
    .eq("id", payload.data_id)
    .single();

  if (dataErr || !realData) {
    console.error("Data não encontrada:", payload.data_id, dataErr);
    return json({ error: "Data da expedição não encontrada ou inválida." }, 404);
  }

  // Verifica se ainda há vagas
  if (realData.status !== "disponivel" || (realData.vagas_disponiveis ?? 0) < payload.participantes.length) {
    console.warn("Vagas insuficientes ou status indisponível:", realData);
    return json({ error: "Não há vagas suficientes para esta data." }, 400);
  }

  // Define o preço unitário real baseado na forma de pagamento
  const isPix = payload.adicionais.forma_pagamento?.toLowerCase().includes("pix");
  const precoReal = isPix ? realData.preco_pix : realData.preco_cartao;
  const precoFinal = (precoReal !== null && precoReal !== undefined) ? Number(precoReal) : payload.preco_unitario;

  const qtd = payload.participantes.length;
  const valor_total = precoFinal * qtd;

  let protocolo = "";
  try {
    const { data: protoData, error: protoErr } = await admin.rpc("gerar_protocolo");
    if (protoErr || !protoData) throw protoErr || new Error("Falha no RPC");
    protocolo = String(protoData);
  } catch (err) {
    console.error("Erro ao gerar protocolo via RPC:", err);
    protocolo = `RES-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  let protocoloLead = "";
  try {
    const { data: protoLeadData } = await admin.rpc("gerar_protocolo_lead");
    protocoloLead = (protoLeadData as string | null) ?? "";
  } catch (err) {
    console.error("Erro ao gerar protocolo lead via RPC:", err);
    protocoloLead = `LD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }

  const firstP = payload.participantes[0];
  const leadPayload = {
    nome: payload.responsavel.nome,
    email: payload.responsavel.email,
    telefone: payload.responsavel.telefone,
    cpf: payload.responsavel.cpf,
    cidade: payload.responsavel.cidade,
    estado: payload.responsavel.estado,
    expedicao_interesse: payload.expedicao_nome,
    expedicao_id: payload.expedicao_id,
    data_expedicao_id: payload.data_id,
    origem: payload.adicionais.como_conheceu || "pre_reserva_site",
    canal_entrada: "site",
    status: "novo",
    status_atendimento: "humano", // Ajustado para respeitar a constraint [ia, humano, transferido, encerrado]
    etapa_atendimento: "novo",
    nivel_interesse: 5,
    lead_score: 80,
    quantidade_pessoas: qtd,
    valor_estimado: valor_total,
    data_interesse: payload.data_inicio || null,
    observacoes: payload.adicionais.observacoes || null,
    observacoes_importantes: payload.adicionais.observacoes_importantes || null,
    motivacao_viagem: payload.adicionais.motivacao_viagem || null,
    tipo_grupo: payload.adicionais.tipo_grupo || null,
    protocolo: protocoloLead || null,
    forma_pagamento: payload.adicionais.forma_pagamento,
    peso: payload.responsavel.peso || firstP?.peso,
    experiencia_equestre: firstP?.experiencia,
    data_nascimento: payload.responsavel.data_nascimento || firstP?.data_nascimento || null,
    idade: firstP?.idade || null, // A idade calculada do primeiro participante
  };

  let leadId = payload.lead_id;

  // Se não temos leadId, tentamos encontrar um lead 'abandonado' com o mesmo email/telefone
  // para evitar duplicidade caso o estado do frontend tenha sido perdido
  if (!leadId) {
    const { data: existingLead } = await admin
      .from("leads")
      .select("id")
      .eq("status", "abandonado")
      .or(`email.eq.${payload.responsavel.email},telefone.eq.${payload.responsavel.telefone}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (existingLead) {
      console.log("Reutilizando lead abandonado encontrado:", existingLead.id);
      leadId = existingLead.id;
    }
  }

  if (leadId) {
    const { error: leadErr } = await admin
      .from("leads")
      .update(leadPayload as never)
      .eq("id", leadId);
    if (leadErr) {
      console.error("Erro ao atualizar lead:", JSON.stringify(leadErr));
      return json({ error: `Falha ao atualizar lead: ${leadErr.message}` }, 500);
    }
  } else {
    const { data: leadRow, error: leadErr } = await admin
      .from("leads")
      .insert(leadPayload as never)
      .select("id")
      .single();
    if (leadErr) {
      console.error("Erro ao criar lead:", JSON.stringify(leadErr));
      return json({ error: `Falha ao criar lead: ${leadErr.message}` }, 500);
    }
    leadId = leadRow.id;
  }

  const reservaPayload = {
    protocolo,
    lead_id: leadId,
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
    participantes: payload.participantes, // Mantém JSONB para compatibilidade
    adicionais: payload.adicionais,
    aceites: payload.aceites,
    tipo_grupo: payload.adicionais.tipo_grupo,
    motivacao_viagem: payload.adicionais.motivacao_viagem,
    observacoes_importantes: payload.adicionais.observacoes_importantes,
    forma_pagamento: payload.adicionais.forma_pagamento,
    valor_total,
    moeda: (realData as { moeda?: string }).moeda || payload.moeda || "BRL",
  };

  const { data: reservaRow, error: reservaErr } = await admin
    .from("reservas")
    .insert(reservaPayload as never)
    .select("id, protocolo")
    .single();

  if (reservaErr) {
    console.error("Erro ao criar reserva:", reservaErr);
    return json({ error: "Falha ao criar reserva." }, 500);
  }

  // Inserir participantes na tabela individual
  const participantesParaInserir = payload.participantes.map((p, idx) => ({
    reserva_id: reservaRow.id,
    expedicao_id: payload.expedicao_id,
    data_id: payload.data_id,
    nome: p.nome,
    cpf: p.cpf,
    data_nascimento: p.data_nascimento,
    idade: p.idade || null,
    peso: p.peso,
    experiencia_equestre: p.experiencia,
    telefone: p.telefone || null,
    email: p.email || null,
    status: "pendente",
    responsavel_reserva: idx === 0, // Primeiro participante costuma ser o responsável se ele marcar que participa
  }));

  const { error: partsErr } = await admin
    .from("participantes")
    .insert(participantesParaInserir as never);

  if (partsErr) {
    console.error("Erro ao inserir participantes individuais:", partsErr);
    // Não barramos a conclusão se falhar apenas aqui, mas logamos
  }

  return json({
    protocolo: reservaRow.protocolo,
    reserva_id: reservaRow.id,
    lead_id: leadId,
  });
}

async function handleCapturaProgressiva(payload: any) {
  const { 
    lead_id, nome, email, telefone, expedicao_interesse, etapa_abandono, origem,
    cidade, estado, tipo_grupo, motivacao_viagem, observacoes_importantes,
    quantidade_pessoas, data_interesse, canal_atendimento, experiencia_equestre, idade
  } = payload;

  if (!nome || !email || !telefone) {
    return json({ error: "Nome, email e telefone são obrigatórios para captura." }, 400);
  }

  let valor_estimado = payload.valor_estimado || 0;
  if (!valor_estimado && expedicao_interesse && quantidade_pessoas) {
    try {
      const { data: exp } = await admin
        .from("expedicoes")
        .select("preco")
        .ilike("nome", expedicao_interesse)
        .maybeSingle();
      if (exp?.preco) {
        valor_estimado = exp.preco * Number(quantidade_pessoas);
      }
    } catch (e) {
      console.error("Erro ao estimar valor do lead:", e);
    }
  }

  const leadPayload = {
    nome,
    email,
    telefone,
    expedicao_interesse,
    etapa_abandono,
    origem: origem || "captura_progressiva_site",
    status: "abandonado",
    canal_entrada: "site",
    etapa_atendimento: "novo",
    cidade,
    estado,
    tipo_grupo,
    motivacao_viagem,
    observacoes_importantes,
    quantidade_pessoas: quantidade_pessoas || 1,
    valor_estimado,
    data_interesse,
    canal_atendimento: canal_atendimento || "whatsapp",
    experiencia_equestre,
    idade,
    updated_at: new Date().toISOString(),
  };

  if (lead_id) {
    // SEGURANÇA: Verificar se o lead existe e se ainda está em estado de abandono
    const { data: currentLead, error: fetchErr } = await admin
      .from("leads")
      .select("id, status, email, telefone")
      .eq("id", lead_id)
      .maybeSingle();

    if (fetchErr || !currentLead) return json({ error: "Lead não encontrado." }, 404);
    
    // Só permite atualização anônima se o lead ainda for 'abandonado'
    if (currentLead.status !== "abandonado") {
      return json({ error: "Este lead já foi processado e não pode ser alterado anonimamente." }, 403);
    }

    // Opcional: Impedir alteração se o e-mail/telefone for diferente do já gravado (se já gravado)
    // Mas como é "captura progressiva", o usuário pode estar corrigindo um erro de digitação.
    // O status 'abandonado' já limita bastante o risco.

    const { data, error } = await admin
      .from("leads")
      .update(leadPayload as never)
      .eq("id", lead_id)
      .select("id")
      .single();

    if (error) return json({ error: "Falha ao atualizar captura." }, 500);
    return json({ lead_id: data.id });
  } else {
    let protocoloLeadCap = "";
    try {
      const { data: protoLeadData } = await admin.rpc("gerar_protocolo_lead");
      protocoloLeadCap = (protoLeadData as string | null) ?? "";
    } catch (err) {
      console.error("Erro ao gerar protocolo lead captura via RPC:", err);
      protocoloLeadCap = `LD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    
    const { data, error } = await admin
      .from("leads")
      .insert({
        ...leadPayload,
        protocolo: protocoloLeadCap || null,
        created_at: new Date().toISOString(),
      } as never)
      .select("id")
      .single();

    if (error) return json({ error: "Falha ao criar captura." }, 500);
    return json({ lead_id: data.id });
  }
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
  console.log(`Action: ${action}`, body);
  try {
    if (action === "criar") {
      const v = validarCriar(body);
      if (!v.ok) {
        console.error("Erro de validação:", v.error);
        return json({ error: v.error }, 400);
      }
      return await handleCriar(v.data);
    }
    if (action === "consultar") {
      return await handleConsultar(body.protocolo);
    }
    if (action === "captura_progressiva") {
      return await handleCapturaProgressiva(body);
    }
    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    console.error("Erro interno na função:", e);
    return json({ error: (e as Error)?.message ?? "Erro interno." }, 500);
  }
});
