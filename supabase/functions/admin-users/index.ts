// Edge Function — gestão de usuários internos.
// Apenas administradores (role 'admin' em user_roles) podem operar.
//
// Ações suportadas (via POST { action, ...payload }):
//   - create:        { email, password, nome, cargo, role }
//   - update_role:   { user_id, role }
//   - reset_password:{ user_id, password }
//   - set_active:    { user_id, ativo }   (apenas flag em profiles.ativo)
//
// CORS aberto: chamado a partir do painel web autenticado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não suportado" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

  // Cliente "como o usuário" para validar a sessão.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Sessão inválida" }, 401);

  // Cliente admin (service role).
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verifica se o caller é admin (com bypass para o primeiro usuário).
  const { count: totalRoles } = await admin
    .from("user_roles")
    .select("user_id", { count: "exact", head: true });

  const { data: callerRoles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isAdmin =
    (callerRoles ?? []).some((r) => ["admin", "superadmin", "desenvolvedor"].includes(r.role)) || (totalRoles ?? 0) === 0;
  if (!isAdmin) return json({ error: "Apenas administradores podem gerenciar usuários." }, 403);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "JSON inválido" }, 400);
  }
  const action = String(body.action ?? "");

  try {
    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const nome = String(body.nome ?? "").trim();
      const cargo = (body.cargo as string | null) ?? null;
      const role = String(body.role ?? "operador");
      if (!email || !password || password.length < 8) {
        return json({ error: "E-mail e senha (mínimo 8 caracteres) são obrigatórios." }, 400);
      }
      if (!["admin", "operador", "ceo", "socia"].includes(role)) {
        return json({ error: "Papel inválido." }, 400);
      }
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome },
      });
      if (createErr) return json({ error: createErr.message }, 400);
      const uid = created.user!.id;
      // O trigger handle_new_user cria profile e handle_new_internal_user atribui role.
      // Ajustamos cargo e role conforme escolhidos.
      await admin
        .from("profiles")
        .update({ nome, cargo, ativo: true })
        .eq("user_id", uid);
      await admin
        .from("user_roles")
        .delete()
        .eq("user_id", uid);
      await admin
        .from("user_roles")
        .insert({ user_id: uid, role });
      return json({ ok: true, user_id: uid });
    }

    if (action === "update_role") {
      const targetId = String(body.user_id ?? "");
      const role = String(body.role ?? "");
      const cargo = (body.cargo as string | null | undefined) ?? undefined;
      if (!targetId || !["admin", "operador", "ceo", "socia"].includes(role)) {
        return json({ error: "Dados inválidos." }, 400);
      }
      await admin.from("user_roles").delete().eq("user_id", targetId);
      await admin.from("user_roles").insert({ user_id: targetId, role });
      if (cargo !== undefined) {
        await admin.from("profiles").update({ cargo }).eq("user_id", targetId);
      }
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const targetId = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (!targetId || password.length < 8) return json({ error: "Senha inválida." }, 400);
      const { error } = await admin.auth.admin.updateUserById(targetId, { password });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    if (action === "set_active") {
      const targetId = String(body.user_id ?? "");
      const ativo = Boolean(body.ativo);
      if (!targetId) return json({ error: "user_id obrigatório." }, 400);
      await admin.from("profiles").update({ ativo }).eq("user_id", targetId);
      return json({ ok: true });
    }

    if (action === "delete") {
      const targetId = String(body.user_id ?? "");
      const masterPassword = String(body.master_password ?? "");
      if (!targetId) return json({ error: "user_id obrigatório." }, 400);
      if (targetId === userData.user.id) return json({ error: "Não é possível excluir a si mesmo." }, 400);
      // Bloqueia exclusão de superadmin sem senha-mestre
      const { data: targetRoles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", targetId);
      const isSuper = (targetRoles ?? []).some((r) => r.role === "superadmin");
      if (isSuper) {
        const expected = Deno.env.get("SUPERADMIN_MASTER_PASSWORD") ?? "";
        if (!expected || masterPassword !== expected) {
          return json({ error: "Senha-mestre incorreta. Exclusão bloqueada." }, 403);
        }
      }
      await admin.from("user_roles").delete().eq("user_id", targetId);
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
