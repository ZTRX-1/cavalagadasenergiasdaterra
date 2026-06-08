import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "desenvolvedor"
  | "superadmin"
  | "admin"
  | "ceo"
  | "ceo_preview"
  | "socia"
  | "operador";

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
  | "equipe"
  | "usuarios"
  | "cargos"
  | "ia"
  | "automacoes"
  | "historico"
  | "integracoes";

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

const CEO_PREVIEW_MODULES: AdminModule[] = ["dashboard", "expedicoes"];

// CEO: vê e edita Dashboard, Expedições e Leads.
// Demais módulos operacionais/governança aparecem no menu mas levam à tela "Próxima etapa".
const CEO_LIBERADO: AdminModule[] = ["dashboard", "expedicoes", "leads"];
const CEO_LOCKED: AdminModule[] = [
  "reservas",
  "participantes",
  "financeiro",
  "midia",
  "documentos",
  "ia",
  "automacoes",
  "integracoes",
];

/**
 * Decide se o usuário corrente pode visualizar, editar ou se o módulo aparece bloqueado.
 */
export function useCan(modulo: AdminModule) {
  const { data, isLoading } = useMyPermissions();
  const role = data?.role ?? null;
  const isMaster = data?.userId === "20b7839f-b3c3-494c-90df-515ba0a0de4f"; // Vexson Master ID

  if (isLoading || !role) {
    return { canView: false, canEdit: false, locked: false, role, isLoading };
  }

  // Master/Developer/Superadmin bypass
  if (isMaster || role === "desenvolvedor" || role === "superadmin" || role === "admin") {
    return { canView: true, canEdit: true, locked: false, role, isLoading: false };
  }

  // CEO: visão executiva — Dashboard, Expedições e Leads liberados;
  // operação/governança sensíveis aparecem como "Próxima etapa";
  // administração total (Usuários, Cargos, Configurações, Histórico) fica oculta.
  if (role === "ceo") {
    if (CEO_LIBERADO.includes(modulo)) {
      return { canView: true, canEdit: true, locked: false, role, isLoading: false };
    }
    if (CEO_LOCKED.includes(modulo)) {
      return { canView: true, canEdit: false, locked: true, role, isLoading: false };
    }
    return { canView: false, canEdit: false, locked: false, role, isLoading: false };
  }

  if (role === "ceo_preview") {
    const liberado = CEO_PREVIEW_MODULES.includes(modulo);
    return {
      canView: true,
      canEdit: liberado,
      locked: !liberado,
      role,
      isLoading: false,
    };
  }

  if (role === "socia") {
    return {
      canView: true,
      canEdit: modulo === "expedicoes",
      locked: false,
      role,
      isLoading: false,
    };
  }

  // operador
  const perm = data?.modulePerms[modulo];
  return {
    canView: perm?.pode_ver ?? modulo === "dashboard",
    canEdit: perm?.pode_editar ?? false,
    locked: false,
    role,
    isLoading: false,
  };
}
