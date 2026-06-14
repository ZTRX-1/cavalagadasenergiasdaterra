// /v1/ia/contexto-cliente — Fase 3 · Bloco 3
// Resolve quem é o cliente pelo telefone + carrega Contexto 360 consolidado.
// Auth: x-api-key (Bárbara) OU JWT interno.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-cliente",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("IA_BARBARA_API_KEY");
  const authHeader = req.headers.get("Authorization");

  // ── Autenticação
  let supabase;
  let origem: "s2s" | "usuario";
  if (apiKey && expectedKey && apiKey === expectedKey) {
    if (!serviceKey) return json({ error: "Service auth indisponível" }, 500);
    supabase = createClient(url, serviceKey);
    origem = "s2s";
  } else if (authHeader?.startsWith("Bearer ")) {
    supabase = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error } = await supabase.auth.getClaims(token);
    if (error || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    origem = "usuario";
  } else {
    return json({ error: "Unauthorized" }, 401);
  }

  // ── Body
  let body: { telefone?: string };
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }
  const telefone = (body?.telefone ?? "").toString().trim();
  if (!telefone) return json({ error: "Campo 'telefone' obrigatório" }, 400);
  if (telefone.length > 32) return json({ error: "Telefone muito longo" }, 400);

  // ── Service client para gravar log mesmo quando origem=usuario
  const svc = serviceKey ? createClient(url, serviceKey) : supabase;
  const telHash = await sha256Hex(telefone);
  const t0 = Date.now();

  let leadId: string | null = null;
  let reservaId: string | null = null;
  let participanteId: string | null = null;
  let tipo: string | null = null;
  let encontrado = false;
  let sucesso = false;
  let erro: string | null = null;
  let payloadOut: Record<string, unknown> = {};

  try {
    // 1) Resolver
    const { data: resolvido, error: rErr } = await supabase
      .rpc("resolver_lead_por_telefone", { p_telefone: telefone });
    if (rErr) throw new Error("resolver: " + rErr.message);

    const r = (resolvido ?? {}) as Record<string, unknown>;
    encontrado = Boolean(r.encontrado);
    leadId = (r.lead_id as string) ?? null;
    reservaId = (r.reserva_id as string) ?? null;
    participanteId = (r.participante_id as string) ?? null;
    tipo = (r.tipo as string) ?? null;

    if (!encontrado) {
      payloadOut = { encontrado: false };
      sucesso = true;
    } else {
      // 2) Contexto 360 — chama o endpoint interno reaproveitando x-api-key
      const alvoId = leadId ?? reservaId;
      const rota = leadId ? "lead" : "reserva";
      if (!alvoId) throw new Error("Sem lead_id nem reserva_id para contexto");

      const ctxResp = await fetch(
        `${url}/functions/v1/contexto-360/v1/contexto/${rota}?id=${alvoId}`,
        {
          headers: {
            "x-api-key": expectedKey ?? "",
            "x-cliente": "ia-contexto-cliente",
            "apikey": Deno.env.get("SUPABASE_ANON_KEY") ?? "",
          },
        },
      );
      const ctx = await ctxResp.json().catch(() => ({}));
      if (!ctxResp.ok) throw new Error(`contexto-360 ${ctxResp.status}: ${ctx?.error ?? "erro"}`);

      payloadOut = {
        encontrado: true,
        tipo,
        lead_id: leadId,
        reserva_id: reservaId,
        participante_id: participanteId,
        resolucao: r,
        contexto: ctx,
      };
      sucesso = true;
    }
  } catch (e) {
    erro = (e as Error).message;
    payloadOut = { encontrado: false, erro };
  }

  const tempo = Date.now() - t0;
  const corpo = JSON.stringify(payloadOut);
  const tamanho = new TextEncoder().encode(corpo).length;

  // 3) Auditoria (não bloqueia resposta)
  try {
    await svc.from("ia_contexto_logs").insert({
      lead_id: leadId,
      reserva_id: reservaId,
      participante_id: participanteId,
      tipo,
      origem,
      telefone_hash: telHash,
      encontrado,
      tempo_execucao_ms: tempo,
      tamanho_payload: tamanho,
      sucesso,
      erro,
    });
  } catch (e) {
    console.error("ia_contexto_logs insert falhou:", (e as Error).message);
  }

  return new Response(corpo, {
    status: sucesso ? 200 : 500,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "x-tempo-ms": String(tempo),
      "x-tamanho-bytes": String(tamanho),
    },
  });
});
