// Edge Function: ia-prompt-preview
// Bloco 5 — Prompt Builder. Monta o prompt final que SERIA enviado à OpenAI,
// sem chamar OpenAI, sem enviar mensagens, sem mutações.

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
}

const estimateTokens = (...parts: string[]) => {
  const total = parts.filter(Boolean).join(" ").length;
  return Math.max(1, Math.round(total / 4));
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
  if (r?.data_label) linhas.push(`Data: ${r.data_label}`);
  if (c?.reserva?.protocolo) linhas.push(`Protocolo: ${c.reserva.protocolo}`);
  if (c?.reserva?.status_financeiro) linhas.push(`Status financeiro: ${c.reserva.status_financeiro}`);
  if (typeof c?.reserva?.valor_total === "number")
    linhas.push(`Valor total: ${c.reserva.moeda ?? "BRL"} ${c.reserva.valor_total}`);
  if (typeof c?.reserva?.valor_pago === "number")
    linhas.push(`Valor pago: ${c.reserva.moeda ?? "BRL"} ${c.reserva.valor_pago}`);
  if (Array.isArray(c?.participantes))
    linhas.push(`Participantes: ${c.participantes.length}`);
  if (r?.ambiguo) linhas.push("ATENÇÃO: telefone ambíguo, mais de um registro encontrado.");
  return linhas.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = req.headers.get("x-api-key");
  const auth = req.headers.get("authorization") ?? "";
  const okApiKey = IA_API_KEY && apiKey === IA_API_KEY;
  const okJwt = auth.startsWith("Bearer ");
  if (!okApiKey && !okJwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const t0 = Date.now();
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const telefone = (body?.telefone ?? "").toString();
  const mensagem = (body?.mensagem ?? "").toString();
  const promptNome = (body?.prompt_nome ?? "barbara").toString();
  if (!telefone || !mensagem) {
    return new Response(
      JSON.stringify({ error: "telefone_e_mensagem_obrigatorios" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1+2) Resolver cliente + carregar contexto via ia-contexto-cliente
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
    else await ctxRes.text();
  } catch {
    contexto = { encontrado: false, erro: "ctx_falhou" };
  }

  // 3) KB aplicável (top 8 ativos mais recentes)
  const { data: kb } = await admin
    .from("ia_knowledge_base")
    .select("id, titulo, categoria, conteudo")
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(8);

  // 4) Configuração da Bárbara
  const { data: cfg } = await admin
    .from("ia_configuracoes")
    .select("*")
    .limit(1)
    .maybeSingle();

  const modelo = (cfg as any)?.modelo_principal ?? "modelo_principal";
  const promptVersaoCfg = (cfg as any)?.prompt_versao ?? null;

  // 5) Prompt ativo (override por versão se cfg pedir)
  let promptQ = admin.from("ia_prompts").select("*").eq("nome", promptNome);
  promptQ = promptVersaoCfg
    ? promptQ.eq("versao", promptVersaoCfg)
    : promptQ.eq("ativo", true);
  const { data: prompt } = await promptQ.limit(1).maybeSingle();

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "prompt_nao_encontrado", nome: promptNome }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 6) Montar prompt final
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
    `# CONTEXTO DO CLIENTE`,
    contextoResumido,
    ``,
    `# CONHECIMENTO APLICÁVEL (KB)`,
    kbBloco || "(nenhum item ativo)",
  ].join("\n");

  const userBlock = `# MENSAGEM DO CLIENTE\n${mensagem}`;

  const promptFinal = `${systemBlock}\n\n${contextBlock}\n\n${userBlock}`;
  const tokens = estimateTokens(promptFinal);
  const tempo = Date.now() - t0;

  return new Response(
    JSON.stringify({
      prompt_nome: prompt.nome,
      prompt_versao: prompt.versao,
      modelo,
      prompt_system: systemBlock,
      contexto_resumido: contextoResumido,
      kb_utilizada: (kb ?? []).map((k: any) => ({
        id: k.id,
        titulo: k.titulo,
        categoria: k.categoria,
      })),
      mensagem_usuario: mensagem,
      prompt_final: promptFinal,
      tamanho_chars: promptFinal.length,
      tokens_estimados: tokens,
      tempo_ms: tempo,
      contexto_resumo: {
        encontrado: contexto?.encontrado ?? false,
        tipo: contexto?.tipo ?? null,
        lead_id: contexto?.lead_id ?? null,
        reserva_id: contexto?.reserva_id ?? null,
      },
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "x-tokens-estimados": String(tokens),
        "x-tempo-ms": String(tempo),
      },
    },
  );
});
