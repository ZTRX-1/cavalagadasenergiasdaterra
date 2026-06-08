import { supabase } from "@/integrations/supabase/client";

export const MODULOS_PERMISSAO = [
  // Operação
  { chave: "dashboard",    nome: "Dashboard" },
  { chave: "expedicoes",   nome: "Expedições" },
  { chave: "leads",        nome: "Leads" },
  { chave: "crm",          nome: "CRM" },
  { chave: "reservas",     nome: "Reservas" },
  { chave: "participantes",nome: "Participantes" },
  { chave: "equipe",       nome: "Equipe" },
  { chave: "financeiro",   nome: "Financeiro" },
  { chave: "midia",        nome: "Mídia" },
  { chave: "documentos",   nome: "Documentos" },
  // Governança
  { chave: "ia",           nome: "IA" },
  { chave: "automacoes",   nome: "Automações" },
  { chave: "historico",    nome: "Histórico" },
  { chave: "integracoes",  nome: "Integrações" },
  { chave: "usuarios",     nome: "Usuários" },
  { chave: "cargos",       nome: "Cargos" },
  { chave: "configuracoes",nome: "Configurações" },
] as const;

export const ACOES_PERMISSAO = ["visualizar", "criar", "editar", "excluir"] as const;
export type AcaoPermissao = (typeof ACOES_PERMISSAO)[number];

export interface CargoRow {
  id: string;
  chave: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  protegido: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CargoPermissaoRow {
  id: string;
  cargo_id: string;
  modulo: string;
  acao: AcaoPermissao;
  permitido: boolean;
}

export async function listCargos(): Promise<CargoRow[]> {
  const { data, error } = await supabase
    .from("cargos" as never)
    .select("*")
    .order("protegido", { ascending: false })
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CargoRow[];
}

export async function listCargoPermissoes(cargo_id: string): Promise<CargoPermissaoRow[]> {
  const { data, error } = await supabase
    .from("cargo_permissoes" as never)
    .select("*")
    .eq("cargo_id", cargo_id);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CargoPermissaoRow[];
}

export async function createCargo(input: {
  chave: string;
  nome: string;
  descricao?: string | null;
  cor?: string | null;
}): Promise<CargoRow> {
  const { data, error } = await supabase
    .from("cargos" as never)
    .insert(input as never)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as CargoRow;
}

export async function updateCargo(id: string, patch: Partial<CargoRow>): Promise<void> {
  const { error } = await supabase
    .from("cargos" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCargo(id: string): Promise<void> {
  const { error } = await supabase.from("cargos" as never).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateCargo(origem: CargoRow): Promise<CargoRow> {
  const sufixo = Math.random().toString(36).slice(2, 6);
  const novo = await createCargo({
    chave: `${origem.chave}-${sufixo}`,
    nome: `${origem.nome} (cópia)`,
    descricao: origem.descricao,
    cor: origem.cor,
  });
  const perms = await listCargoPermissoes(origem.id);
  if (perms.length > 0) {
    const rows = perms.map((p) => ({
      cargo_id: novo.id,
      modulo: p.modulo,
      acao: p.acao,
      permitido: p.permitido,
    }));
    const { error } = await supabase.from("cargo_permissoes" as never).insert(rows as never);
    if (error) throw new Error(error.message);
  }
  return novo;
}

export async function setPermissao(
  cargo_id: string,
  modulo: string,
  acao: AcaoPermissao,
  permitido: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("cargo_permissoes" as never)
    .upsert(
      { cargo_id, modulo, acao, permitido } as never,
      { onConflict: "cargo_id,modulo,acao" } as never,
    );
  if (error) throw new Error(error.message);
}

export async function setPermissoesEmLote(
  cargo_id: string,
  modulo: string,
  permitido: boolean,
): Promise<void> {
  const rows = ACOES_PERMISSAO.map((acao) => ({ cargo_id, modulo, acao, permitido }));
  const { error } = await supabase
    .from("cargo_permissoes" as never)
    .upsert(rows as never, { onConflict: "cargo_id,modulo,acao" } as never);
  if (error) throw new Error(error.message);
}

// ---------- Último login ----------
export async function registrarUltimoLogin(): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase
    .from("profiles")
    .update({ ultimo_login: new Date().toISOString() } as never)
    .eq("user_id", u.user.id);
}
