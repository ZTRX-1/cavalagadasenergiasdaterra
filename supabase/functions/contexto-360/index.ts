// Endpoint unificado de contexto operacional (Bloco G - Fase 2)
// Rotas:
//   GET /contexto-360/v1/contexto/lead?id=<uuid>
//   GET /contexto-360/v1/contexto/reserva?id=<uuid>
// Payload estável v1 — consumido por operadores e, futuramente, IA Bárbara / N8N / Evolution.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  try { return new Date(d).toISOString(); } catch { return null; }
}

function humanRelative(d: string | null | undefined) {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora mesmo";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 30) return `há ${dd} dia${dd > 1 ? "s" : ""}`;
  return new Date(d).toLocaleDateString("pt-BR");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  // Aceita tanto /v1/contexto/lead quanto sufixos do supabase functions
  const path = url.pathname.toLowerCase();
  const isLead = path.endsWith("/lead");
  const isReserva = path.endsWith("/reserva");
  if (!isLead && !isReserva) {
    return json({ error: "Rota inválida. Use /v1/contexto/lead ou /v1/contexto/reserva" }, 404);
  }

  const id = url.searchParams.get("id");
  if (!id) return json({ error: "Parâmetro 'id' obrigatório" }, 400);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

  try {
    // Resolve lead_id e reserva_id de forma simétrica
    let leadId: string | null = null;
    let reservaId: string | null = null;

    if (isLead) {
      leadId = id;
      const { data: r } = await supabase
        .from("reservas")
        .select("id")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      reservaId = r?.id ?? null;
    } else {
      reservaId = id;
      const { data: r } = await supabase
        .from("reservas")
        .select("lead_id")
        .eq("id", id)
        .maybeSingle();
      leadId = r?.lead_id ?? null;
    }

    // Fetches em paralelo
    const [
      leadRes, reservaRes, participantesRes, pagamentosRes,
      tarefasRes, handoffsRes, mensagensRes, interacoesRes, memoriaRes,
    ] = await Promise.all([
      leadId ? supabase.from("leads").select("*").eq("id", leadId).maybeSingle() : Promise.resolve({ data: null }),
      reservaId ? supabase.from("reservas").select("*").eq("id", reservaId).maybeSingle() : Promise.resolve({ data: null }),
      reservaId ? supabase.from("participantes").select("*").eq("reserva_id", reservaId).order("created_at") : Promise.resolve({ data: [] }),
      reservaId ? supabase.from("pagamentos").select("*").eq("reserva_id", reservaId).order("created_at") : Promise.resolve({ data: [] }),
      supabase.from("tarefas").select("*")
        .in("status", ["aberta", "em_andamento"])
        .or([
          leadId ? `lead_id.eq.${leadId}` : null,
          reservaId ? `reserva_id.eq.${reservaId}` : null,
        ].filter(Boolean).join(",")),
      supabase.from("ia_handoff_queue").select("*")
        .in("status", ["aberto", "em_andamento"])
        .or([
          leadId ? `lead_id.eq.${leadId}` : null,
          reservaId ? `reserva_id.eq.${reservaId}` : null,
        ].filter(Boolean).join(",")),
      supabase.from("mensagens_canal").select("*")
        .or([
          leadId ? `lead_id.eq.${leadId}` : null,
          reservaId ? `reserva_id.eq.${reservaId}` : null,
        ].filter(Boolean).join(","))
        .order("created_at", { ascending: false }).limit(20),
      leadId ? supabase.from("ia_interacoes").select("*").eq("lead_id", leadId).order("created_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
      leadId ? supabase.from("lead_memoria").select("*").eq("lead_id", leadId).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    const lead: any = leadRes.data;
    const reserva: any = reservaRes.data;
    const participantes: any[] = participantesRes.data ?? [];
    const pagamentos: any[] = pagamentosRes.data ?? [];
    const tarefas: any[] = tarefasRes.data ?? [];
    const handoffs: any[] = handoffsRes.data ?? [];
    const mensagens: any[] = mensagensRes.data ?? [];
    const interacoes: any[] = interacoesRes.data ?? [];
    const memoria: any = memoriaRes.data;

    if (!lead && !reserva) return json({ error: "Não encontrado" }, 404);

    // Expedição + data
    let expedicao: any = null;
    let data_expedicao: any = null;
    const expedicaoId = reserva?.expedicao_id ?? lead?.expedicao_id ?? null;
    const dataId = reserva?.data_id ?? null;
    if (expedicaoId) {
      const { data } = await supabase.from("expedicoes").select("id, nome, slug, moeda, regiao, idioma").eq("id", expedicaoId).maybeSingle();
      expedicao = data;
    }
    if (dataId) {
      const { data } = await supabase.from("datas").select("id, data_inicio, data_fim, label, vagas_total, vagas_disponiveis, moeda").eq("id", dataId).maybeSingle();
      data_expedicao = data;
    }

    // Conhecimento aplicável (filtrado por expedição + idioma + ativo)
    const idioma = (lead?.idioma ?? "pt-BR") as string;
    let kbQuery = supabase.from("ia_knowledge_base").select("id, titulo, categoria, subcategoria, tipo, prioridade, conteudo, tags")
      .eq("ativo", true).eq("idioma", idioma)
      .order("prioridade", { ascending: false }).limit(15);
    if (expedicaoId) {
      kbQuery = kbQuery.or(`escopo.eq.global,expedicao_id.eq.${expedicaoId}`);
    } else {
      kbQuery = kbQuery.eq("escopo", "global");
    }
    const { data: kb } = await kbQuery;

    // Financeiro
    const moeda = reserva?.moeda ?? expedicao?.moeda ?? "BRL";
    const valor_total = Number(reserva?.valor_total ?? 0);
    const valor_pago = Number(reserva?.valor_pago ?? 0);
    const saldo_restante = Math.max(0, valor_total - valor_pago);

    // Contexto temporal
    const ultima_msg_in = mensagens.find(m => m.direcao === "entrada");
    const ultima_msg_out = mensagens.find(m => m.direcao === "saida");
    const ultimo_pagamento = pagamentos
      .filter(p => p.status === "confirmado")
      .sort((a, b) => new Date(b.confirmado_em ?? b.created_at).getTime() - new Date(a.confirmado_em ?? a.created_at).getTime())[0] ?? null;
    const ultima_tarefa = tarefas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] ?? null;

    // Resumo executivo
    const resumo_executivo = {
      cliente: lead?.nome ?? reserva?.cliente_nome ?? "—",
      expedicao: expedicao?.nome ?? reserva?.expedicao_nome ?? lead?.expedicao_interesse ?? "—",
      data: data_expedicao?.label ?? data_expedicao?.data_inicio ?? "—",
      participantes: participantes.length || reserva?.quantidade_participantes || lead?.quantidade_pessoas || 0,
      status_operacional: reserva?.status_operacional ?? lead?.etapa_atendimento ?? "—",
      status_financeiro: reserva?.status_financeiro ?? "—",
      pendencias: tarefas.length + handoffs.length,
      temperatura: lead?.temperatura_lead ?? "—",
      ultimo_contato: humanRelative(lead?.ultima_interacao_at ?? ultima_msg_in?.created_at ?? null),
    };

    const payload = {
      versao: "v1",
      gerado_em: new Date().toISOString(),
      tipo: isLead ? "lead" : "reserva",
      resumo_executivo,
      lead,
      reserva,
      participantes,
      pagamentos,
      expedicao,
      data: data_expedicao,
      financeiro: { moeda, valor_total, valor_pago, saldo_restante, status: reserva?.status_financeiro ?? null },
      tarefas_abertas: tarefas,
      handoffs_abertos: handoffs,
      ultimas_interacoes: { mensagens, ia: interacoes },
      contexto_temporal: {
        ultima_mensagem_recebida: ultima_msg_in ? { id: ultima_msg_in.id, em: fmtDate(ultima_msg_in.created_at), canal: ultima_msg_in.canal, conteudo: ultima_msg_in.conteudo } : null,
        ultima_mensagem_enviada: ultima_msg_out ? { id: ultima_msg_out.id, em: fmtDate(ultima_msg_out.created_at), canal: ultima_msg_out.canal, conteudo: ultima_msg_out.conteudo } : null,
        ultima_movimentacao_etapa: fmtDate(lead?.ultima_interacao_at ?? lead?.updated_at),
        ultimo_pagamento: ultimo_pagamento ? { id: ultimo_pagamento.id, valor: ultimo_pagamento.valor, em: fmtDate(ultimo_pagamento.confirmado_em ?? ultimo_pagamento.created_at) } : null,
        ultima_tarefa_criada: ultima_tarefa ? { id: ultima_tarefa.id, titulo: ultima_tarefa.titulo, em: fmtDate(ultima_tarefa.created_at) } : null,
      },
      memoria_lead: memoria,
      conhecimento_aplicavel: kb ?? [],
    };

    return json(payload, 200);
  } catch (e) {
    console.error("contexto-360 error", e);
    return json({ error: (e as Error).message }, 500);
  }
});
