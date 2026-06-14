// Edge Function: ia-shadow-openai
// Bloco 6 — Shadow Mode com LLM (via Lovable AI Gateway).
// SEM envio de mensagens, SEM execução de RPCs, SEM mutação de reservas/pagamentos/vagas.
// Apenas gera uma resposta sugerida e grava em ia_decisoes (shadow=true, origem='openai').

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
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

const DEFAULT_PRINCIPAL = "google/gemini-3-flash-preview";
const DEFAULT_FALLBACK = "openai/gpt-5-mini";

// Custos aproximados (USD por 1k tokens) — apenas estimativa do shadow.
const COST_TABLE: Record<string, { in: number; out: number }> = {
  "google/gemini-3-flash-preview": { in: 0.00015, out: 0.0006 },
  "google/gemini-2.5-flash":       { in: 0.00015, out: 0.0006 },
  "google/gemini-2.5-pro":         { in: 0.0012,  out: 0.005 },
  "openai/gpt-5-mini":             { in: 0.00025, out: 0.001 },
  "openai/gpt-5":                  { in: 0.0025,  out: 0.01 },
  "openai/gpt-5-nano":             { in: 0.0001,  out: 0.0004 },
};

function estimarCusto(modelo: string, tin: number, tout: number) {
  const p = COST_TABLE[modelo];
  if (!p) return null;
  return Number(((tin / 1000) * p.in + (tout / 1000) * p.out).toFixed(6));
}

async function hashTelefone(t: string) {
  const data = new TextEncoder().encode(t);
  const h = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface Body {
  telefone: string;
  mensagem: string;
}

async function chamarLLM(modelo: string, system: string, user: string) {
  const t0 = Date.now();
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": LOVABLE_API_KEY,
    },
    body: JSON.stringify({
      model: modelo,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const latencia = Date.now() - t0;
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, json, raw: text, latencia };
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

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "missing_lovable_api_key" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
  if (!telefone || !mensagem) {
    return new Response(JSON.stringify({ error: "telefone_e_mensagem_obrigatorios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  // 1) Monta prompt via ia-prompt-preview (que já enriquece contexto + valida KB)
  const ppRes = await fetch(`${SUPABASE_URL}/functions/v1/ia-prompt-preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": IA_API_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ telefone, mensagem }),
  });
  const ppBody = await ppRes.json();
  if (!ppRes.ok) {
    return new Response(JSON.stringify({ error: "prompt_builder_falhou", detalhe: ppBody }),
      { status: ppRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 2) Modelo: configuração ou defaults
  const { data: cfg } = await admin.from("ia_configuracoes").select("modelo_principal, modelo_fallback").limit(1).maybeSingle();
  const modeloPrincipal = (cfg?.modelo_principal && cfg.modelo_principal !== "modelo_principal")
    ? cfg.modelo_principal : DEFAULT_PRINCIPAL;
  const modeloFallback = cfg?.modelo_fallback ?? DEFAULT_FALLBACK;

  // 3) System adicional: forçar saída JSON estrita
  const systemFinal =
    ppBody.prompt_system +
    `\n\n# FORMATO DE SAÍDA OBRIGATÓRIO (JSON)\n` +
    `Responda ESTRITAMENTE em JSON com este shape:\n` +
    `{"intent":"saudacao|preco|disponibilidade|financeiro|documentacao|cancelamento|operacional|outro",` +
    `"confidence":0.0-1.0,"resposta_sugerida":"texto pronto para enviar ao cliente",` +
    `"handoff":true|false,"motivo_handoff":"texto ou null"}\n` +
    `Nada além do JSON. Sem markdown. Sem comentários.`;

  // userBlock = tudo do prompt_final menos o systemBlock
  const userFinal = ppBody.prompt_final.slice(ppBody.prompt_system.length).trim();

  // 4) Chama LLM (principal -> fallback)
  let modeloUsado = modeloPrincipal;
  let llm = await chamarLLM(modeloPrincipal, systemFinal, userFinal);
  let usouFallback = false;
  if (!llm.ok && modeloFallback && modeloFallback !== modeloPrincipal) {
    usouFallback = true;
    modeloUsado = modeloFallback;
    llm = await chamarLLM(modeloFallback, systemFinal, userFinal);
  }

  if (!llm.ok) {
    const status = llm.status === 429 || llm.status === 402 ? llm.status : 502;
    return new Response(JSON.stringify({
      error: "llm_falhou", status: llm.status, detalhe: llm.raw?.slice(0, 500),
    }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const content = llm.json?.choices?.[0]?.message?.content ?? "";
  const tokensIn = llm.json?.usage?.prompt_tokens ?? null;
  const tokensOut = llm.json?.usage?.completion_tokens ?? null;

  let parsed: any = {};
  try { parsed = JSON.parse(content); } catch { parsed = { intent: "outro", confidence: 0, resposta_sugerida: content, handoff: true, motivo_handoff: "json_invalido" }; }

  const intent = parsed.intent ?? "outro";
  const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? 0)));
  const resposta = (parsed.resposta_sugerida ?? "").toString();
  const handoff = Boolean(parsed.handoff);
  const motivoHandoff = parsed.motivo_handoff ?? null;

  const custo = (tokensIn != null && tokensOut != null)
    ? estimarCusto(modeloUsado, tokensIn, tokensOut) : null;

  // 5) Persiste em ia_decisoes (sempre shadow=true)
  const telHash = await hashTelefone(telefone);
  const tempoTotal = Date.now() - t0;

  const { data: dec, error: decErr } = await admin.from("ia_decisoes").insert({
    lead_id: ppBody?.contexto_resumo?.lead_id ?? null,
    reserva_id: ppBody?.contexto_resumo?.reserva_id ?? null,
    telefone_hash: telHash,
    mensagem_entrada: mensagem,
    contexto_utilizado: { blocos: ppBody.blocos, kb: ppBody.kb_utilizada },
    resposta_sugerida: resposta,
    intent,
    confidence,
    acao_sugerida: handoff ? "handoff" : "responder",
    handoff_recomendado: handoff,
    motivo_handoff: motivoHandoff,
    tokens_estimados: ppBody?.tokens_estimados ?? null,
    modelo: modeloUsado,
    prompt_versao: String(ppBody.prompt_versao ?? ""),
    shadow: true,
    tempo_execucao_ms: tempoTotal,
    origem: "openai",
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    custo_estimado: custo,
    modelo_utilizado: modeloUsado,
    tempo_llm_ms: llm.latencia,
  }).select("id").maybeSingle();

  return new Response(JSON.stringify({
    decisao_id: dec?.id ?? null,
    intent,
    confidence,
    resposta_sugerida: resposta,
    handoff,
    motivo_handoff: motivoHandoff,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    custo_estimado: custo,
    modelo_utilizado: modeloUsado,
    usou_fallback: usouFallback,
    tempo_llm_ms: llm.latencia,
    tempo_total_ms: tempoTotal,
    shadow: true,
    erro_persistencia: decErr?.message ?? null,
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "x-modelo": modeloUsado,
      "x-tempo-ms": String(tempoTotal),
    },
  });
});
