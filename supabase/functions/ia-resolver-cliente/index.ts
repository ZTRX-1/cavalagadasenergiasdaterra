// /v1/ia/resolver-cliente — Fase 3 · Bloco 2
// Identifica quem está falando a partir do telefone, sem criar/alterar nada.
// Auth: x-api-key (Bárbara) OU JWT interno (Bearer).

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const apiKey = req.headers.get("x-api-key");
  const expectedKey = Deno.env.get("IA_BARBARA_API_KEY");
  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL")!;

  let supabase;
  let origem: "s2s" | "usuario";

  if (apiKey && expectedKey && apiKey === expectedKey) {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

  let body: { telefone?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const telefone = (body?.telefone ?? "").toString().trim();
  if (!telefone) return json({ error: "Campo 'telefone' obrigatório" }, 400);
  if (telefone.length > 32) return json({ error: "Telefone muito longo" }, 400);

  const t0 = Date.now();
  const { data, error } = await supabase.rpc("resolver_lead_por_telefone", { p_telefone: telefone });
  const ms = Date.now() - t0;

  if (error) {
    console.error("[ia-resolver-cliente]", origem, error);
    return json({ error: error.message }, 500);
  }

  return json({ ...(data as object), _origem: origem, _latencia_ms: ms });
});
