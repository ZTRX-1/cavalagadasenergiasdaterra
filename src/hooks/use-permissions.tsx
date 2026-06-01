import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "superadmin" | "admin" | "ceo" | "socia" | "operador";

export type AdminModule =
  | "dashboard"
  | "expedicoes"
  | "leads"
  | "reservas"
  | "participantes"
  | "financeiro"
  | "midia"
  | "documentos"
  | "configuracoes"
  | "equipe";

export interface MyPermissions {
  role: AppRole | null;
  userId: string | null;
  modulePerms: Record<string, { pode_ver: boolean; pode_editar: boolean }>;
}

async function fetchMyPermissions(): Promise<MyPermissions> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;
  if (!userId) return { role: null, userId: null, modulePerms: {} };

  const [{ data: roleRow }, { data: perms }] = await Promise.all([
    supabase.rpc("get_primary_role", { _user_id: userId }),
    supabase
      .from("user_module_permissions")
      .select("modulo,pode_ver,pode_editar")
      .eq("user_id", userId),
  ]);

  const modulePerms: MyPermissions["modulePerms"] = {};
  for (const p of perms ?? []) {
    modulePerms[p.modulo] = { pode_ver: p.pode_ver, pode_editar: p.pode_editar };
  }

  return {
    role: (roleRow as AppRole | null) ?? null,
    userId,
    modulePerms,
  };
}

export function useMyPermissions() {
  return useQuery({
    queryKey: ["admin", "my-permissions"],
    queryFn: fetchMyPermissions,
    staleTime: 60_000,
  });
}

/**
 * Decide se o usuário corrente pode visualizar ou editar um módulo.
 * Regras:
 *  - superadmin / admin / ceo: tudo
 *  - socia: vê tudo, mas só edita "expedicoes"
 *  - operador: usa user_module_permissions (default = só vê dashboard)
 */
export function useCan(modulo: AdminModule) {
  const { data, isLoading } = useMyPermissions();
  const role = data?.role ?? null;

  if (isLoading || !role) {
    return { canView: false, canEdit: false, role, isLoading };
  }

  if (role === "superadmin" || role === "admin" || role === "ceo") {
    return { canView: true, canEdit: true, role, isLoading: false };
  }

  if (role === "socia") {
    return {
      canView: true,
      canEdit: modulo === "expedicoes",
      role,
      isLoading: false,
    };
  }

  // operador
  const perm = data?.modulePerms[modulo];
  return {
    canView: perm?.pode_ver ?? modulo === "dashboard",
    canEdit: perm?.pode_editar ?? false,
    role,
    isLoading: false,
  };
}
