// Edge Function: ia-prompt-preview
// Bloco 5 + 5.5 — Prompt Builder com Enriquecimento de Contexto.
// Sem chamada à OpenAI, sem envio de mensagens, sem mutações.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const IA_API_KEY = Deno.env.get("IA_BARBARA_API_KEY") ?? "";

interface Body {
  telefone: string;
  mensagem: string;
  prompt_nome?: string;
  historico_max_chars?: number;
}

const TZ = "America/Sao_Paulo";
const estimateTokens = (s: string) => Math.max(1, Math.round(s.length / 4));

const fmtBRL = (moeda: string | null | undefined, v: number | null | undefined) =>
  v == null ? "—" : `${moeda ?? "BRL"} ${Number(v).toFixed(2)}`;

const fmtDate = (d: string | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("pt-BR", { timeZone: TZ }); } catch { return d; }
};
const fmtDateTime = (d: string | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("pt-BR", { timeZone: TZ }); } catch { return d; }
};

function resumirContexto(ctx: any): string {
  if (!ctx?.encontrado) return "Cliente não identificado pelo telefone.";
  const r = ctx?.resolucao ?? {};
  const c = ctx?.contexto ?? {};
  const linhas: string[] = [];
  linhas.push(`Tipo: ${ctx.tipo ?? "desconhecido"}`);
  if (r?.nome) linhas.push(`Nome: ${r.nome}`);
  if (r?.etapa) linhas.push(`Etapa do lead: ${r.etapa}`);
  if (r?.status_operacional) linhas.push(`Status operacional: ${r.status_operacional}`);
  if (r?.expedicao) linhas.push(`Expedição: ${r.expedicao}`);
  if (r?.data_expedicao) linhas.push(`Data: ${r.data_expedicao}`);
  if (c?.reserva?.protocolo) linhas.push(`Protocolo: ${c.reserva.protocolo}`);
  if (r?.ambiguo) linhas.push("ATENÇÃO: telefone ambíguo, mais de um registro encontrado.");
  return linhas.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  const auth = req.headers.get("authorization") ?? "";
  const okApiKey = IA_API_KEY && apiKey === IA_API_KEY;
  const okJwt = auth.startsWith("Bearer ");
  if (!okApiKey && !okJwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const t0 = Date.now();
  let body: Body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const telefone = (body?.telefone ?? "").toString();
  const mensagem = (body?.mensagem ?? "").toString();
  const promptNome = (body?.prompt_nome ?? "barbara").toString();
  const histMaxChars = Math.max(200, Math.min(8000, Number(body?.historico_max_chars ?? 2400)));
  if (!telefone || !mensagem) {
    return new Response(JSON.stringify({ error: "telefone_e_mensagem_obrigatorios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // ── Bloqueio por KB insuficiente (5.5 #7) — verificado primeiro
  const { count: kbAtivosCount } = await admin
    .from("ia_knowledge_base")
    .select("id", { count: "exact", head: true })
    .eq("ativo", true);

  if (!kbAtivosCount || kbAtivosCount === 0) {
    return new Response(JSON.stringify({
      error: "KB_INSUFICIENTE",
      motivo: "Knowledge Base ativa está vazia. Prompt Builder bloqueado até que existam itens ativos em ia_knowledge_base.",
      kb_ativos: 0,
    }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ── Contexto via ia-contexto-cliente
  let contexto: any = { encontrado: false };
  try {
    const ctxRes = await fetch(`${SUPABASE_URL}/functions/v1/ia-contexto-cliente`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": IA_API_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        apikey: ANON_KEY,
      },
      body: JSON.stringify({ telefone }),
    });
    if (ctxRes.ok) contexto = await ctxRes.json();
  } catch { contexto = { encontrado: false, erro: "ctx_falhou" }; }

  const leadId: string | null = contexto?.lead_id ?? null;
  const reservaId: string | null = contexto?.reserva_id ?? null;

  // ── Reserva detalhada (para FIN/DOCS/expedicao_id)
  let reserva: any = null;
  if (reservaId) {
    const { data } = await admin.from("reservas")
      .select("id, lead_id, expedicao_id, data_id, valor_total, valor_pago, moeda, contrato_assinado, status_financeiro, status_operacional, protocolo")
      .eq("id", reservaId).maybeSingle();
    reserva = data;
  }

  // ── Expedição alvo
  let expedicaoId: string | null = reserva?.expedicao_id ?? null;
  if (!expedicaoId && leadId) {
    const { data: l } = await admin.from("leads")
      .select("expedicao_interesse").eq("id", leadId).maybeSingle();
    if (l?.expedicao_interesse) {
      const { data: exp } = await admin.from("expedicoes")
        .select("id").ilike("nome", `%${l.expedicao_interesse}%`).limit(1).maybeSingle();
      expedicaoId = exp?.id ?? null;
    }
  }

  // ── 1) HISTÓRICO (mensagens_canal + ia_interacoes) últimas 12 cronológicas
  const histPromises: Promise<any>[] = [];
  if (leadId || reservaId) {
    const mcQ = admin.from("mensagens_canal")
      .select("created_at, autor, direcao, canal, conteudo")
      .order("created_at", { ascending: false }).limit(12);
    if (reservaId) mcQ.eq("reserva_id", reservaId);
    else if (leadId) mcQ.eq("lead_id", leadId);
    histPromises.push(mcQ);

    const iaQ = admin.from("ia_interacoes")
      .select("created_at, autor, direcao, canal, conteudo, resposta_final, intent")
      .order("created_at", { ascending: false }).limit(12);
    if (reservaId) iaQ.eq("reserva_id", reservaId);
    else if (leadId) iaQ.eq("lead_id", leadId);
    histPromises.push(iaQ);
  }
  const [mcRes, iaRes] = histPromises.length
    ? await Promise.all(histPromises) : [{ data: [] } as any, { data: [] } as any];

  type HistItem = { ts: string; quem: string; texto: string };
  const hist: HistItem[] = [];
  for (const m of (mcRes?.data ?? [])) {
    const quem = m.autor === "cliente" ? "CLIENTE" : (m.autor ?? "SISTEMA").toUpperCase();
    hist.push({ ts: m.created_at, quem, texto: (m.conteudo ?? "").trim() });
  }
  for (const i of (iaRes?.data ?? [])) {
    const quem = i.autor === "ia" ? "BÁRBARA" : (i.autor ?? "SISTEMA").toUpperCase();
    const txt = (i.resposta_final ?? i.conteudo ?? "").trim();
    if (txt) hist.push({ ts: i.created_at, quem, texto: txt });
  }
  hist.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  const last12 = hist.slice(-12);
  // Aplica limite de chars (mantém os mais recentes)
  let histStr = "";
  for (let i = last12.length - 1; i >= 0; i--) {
    const linha = `[${fmtDateTime(last12[i].ts)}] ${last12[i].quem}: ${last12[i].texto}`;
    if (histStr.length + linha.length + 1 > histMaxChars) break;
    histStr = linha + (histStr ? "\n" + histStr : "");
  }
  const historicoBloco = histStr || "(sem histórico recente)";

  // ── 2) DISPONIBILIDADE (próximas 3 datas da expedição)
  let dispBloco = "(expedição não identificada)";
  if (expedicaoId) {
    const hoje = new Date().toISOString().slice(0, 10);
    const { data: datas } = await admin.from("datas")
      .select("data_inicio, data_fim, vagas_disponiveis, vagas_total, preco_pix, preco_cartao, moeda, status")
      .eq("expedicao_id", expedicaoId)
      .gte("data_inicio", hoje)
      .order("data_inicio", { ascending: true }).limit(3);
    if (datas && datas.length) {
      dispBloco = datas.map((d: any) =>
        `- ${fmtDate(d.data_inicio)} → ${fmtDate(d.data_fim)} | vagas: ${d.vagas_disponiveis}/${d.vagas_total} | PIX: ${fmtBRL(d.moeda, d.preco_pix)} | Cartão: ${fmtBRL(d.moeda, d.preco_cartao)} | status: ${d.status}`
      ).join("\n");
    } else {
      dispBloco = "(sem datas futuras cadastradas para esta expedição)";
    }
  }

  // ── 3) FINANCEIRO
  let finBloco = "(sem reserva ativa)";
  if (reserva) {
    const total = Number(reserva.valor_total ?? 0);
    const pago = Number(reserva.valor_pago ?? 0);
    const saldo = total - pago;
    let proxima = "—";
    const { data: prox } = await admin.from("pagamentos")
      .select("valor, data_prevista, parcela_atual, parcela_total, moeda, tipo")
      .eq("reserva_id", reserva.id)
      .eq("status", "previsto")
      .order("data_prevista", { ascending: true, nullsFirst: false })
      .limit(1).maybeSingle();
    if (prox) {
      proxima = `${fmtBRL(prox.moeda ?? reserva.moeda, prox.valor)} (parcela ${prox.parcela_atual ?? "?"}/${prox.parcela_total ?? "?"}) — vence em ${fmtDate(prox.data_prevista)}`;
    }
    finBloco = [
      `Valor total: ${fmtBRL(reserva.moeda, total)}`,
      `Valor pago: ${fmtBRL(reserva.moeda, pago)}`,
      `Saldo restante: ${fmtBRL(reserva.moeda, saldo)}`,
      `Status financeiro: ${reserva.status_financeiro ?? "—"}`,
      `Próxima parcela: ${proxima}`,
    ].join("\n");
  }

  // ── 4) DOCUMENTOS
  let docBloco = "(sem reserva ativa)";
  if (reserva) {
    const { data: docs } = await admin.from("reserva_documentos")
      .select("tipo, titulo, status, assinado_em")
      .eq("reserva_id", reserva.id);
    const pendentes = (docs ?? []).filter((d: any) => d.status !== "aprovado" && d.status !== "assinado");
    const contratoAssinado = reserva.contrato_assinado === true
      || (docs ?? []).some((d: any) => d.tipo === "contrato" && (d.status === "assinado" || d.assinado_em));
    let fichaPreenchida = false;
    if (reservaId) {
      const { data: parts } = await admin.from("participantes")
        .select("peso, experiencia_equestre").eq("reserva_id", reservaId);
      fichaPreenchida = (parts ?? []).length > 0 &&
        (parts ?? []).every((p: any) => p.peso != null && p.experiencia_equestre);
    }
    docBloco = [
      `Contrato assinado: ${contratoAssinado ? "sim" : "não"}`,
      `Ficha de participantes preenchida: ${fichaPreenchida ? "sim" : "não"}`,
      pendentes.length
        ? `Documentos pendentes (${pendentes.length}):\n` + pendentes.map((d: any) => `- [${d.status}] ${d.titulo} (${d.tipo})`).join("\n")
        : `Documentos pendentes: nenhum`,
    ].join("\n");
  }

  // ── 5) MEMÓRIA do lead
  let memBloco = "(sem memória registrada)";
  if (leadId) {
    const { data: mem } = await admin.from("lead_memoria")
      .select("perfil, objetivos, interesses, restricoes, orcamento")
      .eq("lead_id", leadId).maybeSingle();
    const { data: leadFull } = await admin.from("leads")
      .select("experiencia_equestre, observacoes")
      .eq("id", leadId).maybeSingle();
    const linhas: string[] = [];
    if (mem?.interesses) linhas.push(`Interesses: ${mem.interesses}`);
    if (mem?.objetivos) linhas.push(`Objetivos: ${mem.objetivos}`);
    if (leadFull?.experiencia_equestre) linhas.push(`Experiência equestre: ${leadFull.experiencia_equestre}`);
    if (mem?.restricoes) linhas.push(`Restrições: ${mem.restricoes}`);
    if (mem?.orcamento) linhas.push(`Orçamento: ${mem.orcamento}`);
    if (leadFull?.observacoes) linhas.push(`Observações: ${leadFull.observacoes}`);
    if (linhas.length) memBloco = linhas.join("\n");
  }

  // ── 6) AGORA
  const agora = new Date();
  const agoraBloco = [
    `Data: ${agora.toLocaleDateString("pt-BR", { timeZone: TZ })}`,
    `Hora: ${agora.toLocaleTimeString("pt-BR", { timeZone: TZ })}`,
    `Timezone: ${TZ}`,
  ].join("\n");

  // ── KB top 8
  const { data: kb } = await admin
    .from("ia_knowledge_base")
    .select("id, titulo, categoria, conteudo")
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(8);

  // ── Configuração + Prompt
  const { data: cfg } = await admin.from("ia_configuracoes").select("*").limit(1).maybeSingle();
  const modelo = (cfg as any)?.modelo_principal ?? "modelo_principal";
  const promptVersaoCfg = (cfg as any)?.prompt_versao ?? null;

  let promptQ = admin.from("ia_prompts").select("*").eq("nome", promptNome);
  promptQ = promptVersaoCfg ? promptQ.eq("versao", promptVersaoCfg) : promptQ.eq("ativo", true);
  const { data: prompt } = await promptQ.limit(1).maybeSingle();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt_nao_encontrado", nome: promptNome }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ── Montagem final
  const contextoResumido = resumirContexto(contexto);
  const kbBloco = (kb ?? [])
    .map((k: any, i: number) => `(${i + 1}) [${k.categoria ?? "geral"}] ${k.titulo}\n${(k.conteudo ?? "").slice(0, 800)}`)
    .join("\n\n");

  const systemBlock = [
    `# IDENTIDADE E TOM`,
    prompt.system_prompt,
    ``,
    `# REGRAS OPERACIONAIS`,
    prompt.regras_operacionais ?? "",
    ``,
    `# REGRAS DE HANDOFF`,
    prompt.regras_handoff ?? "",
    ``,
    `# REGRAS DE SEGURANÇA (NÃO NEGOCIÁVEIS)`,
    `- Nunca conceda desconto, brinde, cortesia ou condição comercial fora da tabela.`,
    `- Nunca confirme pagamento sem confirmação do sistema.`,
    `- Nunca altere data, vaga, valor, parcelamento, reembolso ou cancelamento — sempre handoff.`,
    `- Nunca invente disponibilidade, valores, vagas ou itens inclusos.`,
    `- Nunca prometa reserva. Reserva só existe quando o time confirma.`,
    `- Nunca invente informação sobre roteiro, hospedagem, cavalos ou parceiros.`,
    `- Em qualquer dúvida ou contradição com o contexto, abra handoff.`,
    ``,
    `# FORMATO DE SAÍDA`,
    prompt.formato_saida ?? "",
  ].join("\n");

  const contextBlock = [
    `# AGORA`, agoraBloco, ``,
    `# CONTEXTO DO CLIENTE`, contextoResumido, ``,
    `# HISTÓRICO RECENTE`, historicoBloco, ``,
    `# DISPONIBILIDADE`, dispBloco, ``,
    `# FINANCEIRO`, finBloco, ``,
    `# DOCUMENTOS`, docBloco, ``,
    `# MEMÓRIA`, memBloco, ``,
    `# CONHECIMENTO APLICÁVEL (KB)`, kbBloco || "(nenhum item ativo)",
  ].join("\n");

  const userBlock = `# MENSAGEM DO CLIENTE\n${mensagem}`;
  const promptFinal = `${systemBlock}\n\n${contextBlock}\n\n${userBlock}`;
  const tokens = estimateTokens(promptFinal);
  const tempo = Date.now() - t0;

  return new Response(JSON.stringify({
    prompt_nome: prompt.nome,
    prompt_versao: prompt.versao,
    modelo,
    prompt_system: systemBlock,
    contexto_resumido: contextoResumido,
    blocos: {
      agora: agoraBloco,
      historico: historicoBloco,
      disponibilidade: dispBloco,
      financeiro: finBloco,
      documentos: docBloco,
      memoria: memBloco,
    },
    kb_utilizada: (kb ?? []).map((k: any) => ({ id: k.id, titulo: k.titulo, categoria: k.categoria })),
    kb_ativos_total: kbAtivosCount,
    mensagem_usuario: mensagem,
    prompt_final: promptFinal,
    tamanho_chars: promptFinal.length,
    tokens_estimados: tokens,
    tempo_ms: tempo,
    contexto_resumo: {
      encontrado: contexto?.encontrado ?? false,
      tipo: contexto?.tipo ?? null,
      lead_id: leadId,
      reserva_id: reservaId,
      expedicao_id: expedicaoId,
    },
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "x-tokens-estimados": String(tokens),
      "x-tempo-ms": String(tempo),
    },
  });
});
