// Edge Function: ia-shadow
// Bloco 4 — Modo Sombra: simula a decisão da Bárbara SEM chamar OpenAI,
// sem enviar mensagens e sem executar RPCs de mutação.
// Apenas resolve contexto, classifica via heurística e grava em ia_decisoes.

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

type Intent =
  | "duvida_expedicao"
  | "disponibilidade"
  | "preco"
  | "pagamento"
  | "documentos"
  | "cancelamento"
  | "reagendamento"
  | "acompanhamento"
  | "saudacao"
  | "desconhecido";

type Acao =
  | "responder"
  | "criar_tarefa"
  | "abrir_handoff"
  | "solicitar_dados"
  | "sem_acao";

interface ShadowInput {
  telefone: string;
  mensagem: string;
}

interface ClassifResult {
  intent: Intent;
  confidence: number;
  acao_sugerida: Acao;
  handoff: boolean;
  motivo_handoff?: string;
  resposta_sugerida: string;
}

function classify(msg: string, ctx: any): ClassifResult {
  const m = (msg || "").toLowerCase().trim();
  const has = (...ws: string[]) => ws.some((w) => m.includes(w));

  // Saudações curtas
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|e ai|eai)[\s!?.…]*$/i.test(m) || (m.length <= 12 && has("oi", "olá", "ola"))) {
    return {
      intent: "saudacao",
      confidence: 0.96,
      acao_sugerida: "responder",
      handoff: false,
      resposta_sugerida:
        "Olá! Aqui é a Bárbara da Cavalo Solto 🐎 Como posso te ajudar com sua expedição?",
    };
  }

  if (has("cancelar", "cancelamento", "desistir", "reembolso")) {
    return {
      intent: "cancelamento",
      confidence: 0.92,
      acao_sugerida: "abrir_handoff",
      handoff: true,
      motivo_handoff: "Solicitação de cancelamento/reembolso exige humano",
      resposta_sugerida:
        "Entendi sua intenção de cancelar. Vou te conectar com nosso time agora para cuidar disso com você.",
    };
  }

  if (has("remarcar", "reagendar", "trocar data", "mudar data", "outra data")) {
    return {
      intent: "reagendamento",
      confidence: 0.9,
      acao_sugerida: "abrir_handoff",
      handoff: true,
      motivo_handoff: "Alteração de data exige validação humana",
      resposta_sugerida:
        "Vou pedir para um consultor humano avaliar a troca de data com você 🙌",
    };
  }

  if (has("paguei", "pagamento", "boleto", "pix", "comprovante", "aprovado", "cartão", "cartao", "parcelamento")) {
    return {
      intent: "pagamento",
      confidence: 0.88,
      acao_sugerida: ctx?.encontrado ? "responder" : "solicitar_dados",
      handoff: false,
      resposta_sugerida: ctx?.encontrado
        ? "Vou verificar o status do seu pagamento e te confirmo em instantes."
        : "Pra confirmar seu pagamento, me envie por favor o seu CPF ou número de protocolo.",
    };
  }

  if (has("documento", "contrato", "ficha", "assinar", "rg", "cpf")) {
    return {
      intent: "documentos",
      confidence: 0.85,
      acao_sugerida: "responder",
      handoff: false,
      resposta_sugerida:
        "Posso te ajudar com os documentos da sua reserva. Você precisa enviar, assinar ou conferir algum?",
    };
  }

  if (has("vaga", "disponível", "disponivel", "disponibilidade", "tem para", "tem em", "fevereiro", "março", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro", "janeiro")) {
    return {
      intent: "disponibilidade",
      confidence: 0.86,
      acao_sugerida: "responder",
      handoff: false,
      resposta_sugerida:
        "Posso conferir a disponibilidade. Qual expedição e quantas pessoas?",
    };
  }

  if (has("preço", "preco", "quanto custa", "valor", "quanto é", "quanto fica", "investimento")) {
    return {
      intent: "preco",
      confidence: 0.9,
      acao_sugerida: "responder",
      handoff: false,
      resposta_sugerida:
        "Posso te passar os valores. Qual expedição te interessa e para quantas pessoas?",
    };
  }

  if (has("como é", "como funciona", "expedição", "expedicao", "roteiro", "cavalo", "trilha", "duração", "duracao", "incluso", "inclui")) {
    return {
      intent: "duvida_expedicao",
      confidence: 0.82,
      acao_sugerida: "responder",
      handoff: false,
      resposta_sugerida:
        "Posso te contar tudo sobre a expedição: roteiro, cavalos, hospedagem e o que está incluso. Sobre qual gostaria de saber?",
    };
  }

  if (has("status", "minha reserva", "andamento", "acompanhamento", "previsão", "previsao")) {
    return {
      intent: "acompanhamento",
      confidence: 0.8,
      acao_sugerida: ctx?.encontrado ? "responder" : "solicitar_dados",
      handoff: false,
      resposta_sugerida: ctx?.encontrado
        ? "Vou checar o andamento da sua reserva e já te respondo."
        : "Pode me passar seu protocolo ou CPF para localizar sua reserva?",
    };
  }

  return {
    intent: "desconhecido",
    confidence: 0.35,
    acao_sugerida: "abrir_handoff",
    handoff: true,
    motivo_handoff: "Confiança baixa na classificação",
    resposta_sugerida:
      "Vou pedir para um humano da nossa equipe te responder com mais precisão 🙌",
  };
}

function estimateTokens(...parts: string[]) {
  const total = parts.filter(Boolean).join(" ").length;
  return Math.max(1, Math.round(total / 4));
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Auth: x-api-key (Bárbara) OU Bearer JWT (usuário logado)
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
  let body: ShadowInput;
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
  if (!telefone || !mensagem) {
    return new Response(JSON.stringify({ error: "telefone_e_mensagem_obrigatorios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  // 1) Resolver cliente + 2) carregar contexto (via ia-contexto-cliente)
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
  } catch (_e) {
    contexto = { encontrado: false, erro: "ctx_falhou" };
  }

  // 3) Configurações da Bárbara
  const { data: cfg } = await admin
    .from("ia_configuracoes")
    .select("*")
    .limit(1)
    .maybeSingle();

  const modelo = (cfg as any)?.modelo_principal ?? "modelo_principal";
  const prompt_versao = (cfg as any)?.prompt_versao ?? "v0";

  // 4) KB aplicável (top 5 ativos)
  const { data: kb } = await admin
    .from("ia_knowledge_base")
    .select("id,titulo,categoria")
    .eq("ativo", true)
    .order("updated_at", { ascending: false })
    .limit(5);

  // 5) "Montar prompt" (apenas referencial, não enviado)
  const promptRef = [
    `[PROMPT v${prompt_versao}]`,
    `Modelo: ${modelo}`,
    `Contexto: ${contexto?.encontrado ? contexto?.tipo : "desconhecido"}`,
    `KB: ${(kb ?? []).map((k: any) => k.titulo).join(" | ")}`,
    `Mensagem: ${mensagem}`,
  ].join("\n");

  // 6) Simular decisão
  const decisao = classify(mensagem, contexto);
  const tokens = estimateTokens(promptRef, decisao.resposta_sugerida);
  const telefone_hash = await sha256Hex(telefone);
  const tempo = Date.now() - t0;

  const lead_id = contexto?.lead_id ?? null;
  const reserva_id = contexto?.reserva_id ?? null;

  const { data: ins, error: insErr } = await admin
    .from("ia_decisoes")
    .insert({
      lead_id,
      reserva_id,
      telefone_hash,
      mensagem_entrada: mensagem,
      contexto_utilizado: {
        encontrado: contexto?.encontrado ?? false,
        tipo: contexto?.tipo ?? null,
        resolucao: contexto?.resolucao ?? null,
        kb_ids: (kb ?? []).map((k: any) => k.id),
      },
      resposta_sugerida: decisao.resposta_sugerida,
      intent: decisao.intent,
      confidence: decisao.confidence,
      acao_sugerida: decisao.acao_sugerida,
      handoff_recomendado: decisao.handoff,
      motivo_handoff: decisao.motivo_handoff ?? null,
      tokens_estimados: tokens,
      modelo,
      prompt_versao,
      shadow: true,
      tempo_execucao_ms: tempo,
    })
    .select("id")
    .maybeSingle();

  return new Response(
    JSON.stringify({
      decisao_id: ins?.id ?? null,
      intent: decisao.intent,
      confidence: decisao.confidence,
      resposta_sugerida: decisao.resposta_sugerida,
      acao_sugerida: decisao.acao_sugerida,
      handoff: decisao.handoff,
      motivo_handoff: decisao.motivo_handoff ?? null,
      tokens_estimados: tokens,
      modelo,
      prompt_versao,
      contexto_resumo: {
        encontrado: contexto?.encontrado ?? false,
        tipo: contexto?.tipo ?? null,
      },
      shadow: true,
      tempo_ms: tempo,
      erro_persistencia: insErr?.message ?? null,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "x-tempo-ms": String(tempo),
      },
    },
  );
});
