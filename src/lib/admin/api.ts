/**
 * Camada de acesso a dados do painel interno.
 * Como o app é SPA Vite, fazemos chamadas diretas ao Supabase com a sessão
 * autenticada do operador. As RLS policies (`is_internal_user`) garantem
 * que apenas usuários internos têm acesso de escrita/leitura aos dados
 * sensíveis. Toda mutação relevante registra entrada em `activity_logs`.
 */
import { supabase } from "@/integrations/supabase/client";

// ---------- Helpers ----------

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function logActivity(args: {
  modulo: string;
  acao: string;
  descricao?: string;
  metadata?: Record<string, unknown>;
}) {
  const usuario = await currentUserId();
  await supabase.from("activity_logs").insert({
    usuario,
    modulo: args.modulo,
    acao: args.acao,
    descricao: args.descricao ?? null,
    metadata: (args.metadata ?? {}) as never,
  });
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ---------- EXPEDIÇÕES ----------

export type ExpedicaoStatus = "rascunho" | "publicado" | "pausado" | "arquivado";

export interface ExpedicaoRow {
  id: string;
  slug: string;
  nome: string;
  subtitulo: string | null;
  descricao_curta: string;
  descricao_longa: string;
  duracao: string;
  nivel: string;
  preco: number;
  moeda: string;
  marca: string;
  pais: string;
  estado: string | null;
  cidade: string | null;
  regiao: string | null;
  imagem_url: string | null;
  capa_url: string | null;
  galeria: string[];
  inclui: string[];
  requisitos: string[];
  roteiro: { dia: string; titulo: string; desc: string }[];
  politicas: { titulo: string; texto: string }[];
  tags: string[];
  observacoes: string | null;
  video_url: string | null;
  vagas_total_padrao: number;
  parcelamento_max: number;
  status: ExpedicaoStatus;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

/** Devolve a URL de capa mais adequada (prioridade: capa_url → imagem_url → 1º asset). */
export function resolveCapa(
  exp: { capa_url?: string | null; imagem_url?: string | null },
  assets?: { url: string; tipo: string; is_capa?: boolean; ordem?: number }[],
): string | null {
  if (exp.capa_url) return exp.capa_url;
  if (exp.imagem_url) return exp.imagem_url;
  if (!assets || assets.length === 0) return null;
  const imagens = assets.filter((a) => a.tipo === "imagem");
  const marcada = imagens.find((a) => a.is_capa);
  if (marcada) return marcada.url;
  const ordenadas = [...imagens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  return ordenadas[0]?.url ?? null;
}

export async function listExpedicoes(): Promise<(ExpedicaoRow & { _capa: string | null })[]> {
  const { data, error } = await supabase
    .from("expedicoes")
    .select("*, expedicao_assets(url, tipo, is_capa, ordem)")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { expedicao_assets, ...rest } = row as unknown as ExpedicaoRow & {
      expedicao_assets: { url: string; tipo: string; is_capa: boolean; ordem: number }[];
    };
    return { ...(rest as ExpedicaoRow), _capa: resolveCapa(rest, expedicao_assets) };
  });
}

export async function getExpedicao(id: string): Promise<ExpedicaoRow | null> {
  const { data, error } = await supabase.from("expedicoes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ExpedicaoRow) ?? null;
}

export async function createExpedicao(input: Partial<ExpedicaoRow>): Promise<ExpedicaoRow> {
  const payload = {
    nome: input.nome ?? "Nova expedição",
    slug: input.slug ?? slugify(input.nome ?? `expedicao-${Date.now()}`),
    subtitulo: input.subtitulo ?? null,
    descricao_curta: input.descricao_curta ?? "",
    descricao_longa: input.descricao_longa ?? "",
    duracao: input.duracao ?? "",
    nivel: input.nivel ?? "Iniciante",
    preco: input.preco ?? 0,
    moeda: input.moeda ?? "BRL",
    marca: input.marca ?? "cavalgadas",
    pais: input.pais ?? "brasil",
    estado: input.estado ?? null,
    cidade: input.cidade ?? null,
    regiao: input.regiao ?? null,
    status: input.status ?? "rascunho",
    ativo: input.ativo ?? true,
    ordem: input.ordem ?? 0,
    inclui: (input.inclui ?? []) as never,
    requisitos: (input.requisitos ?? []) as never,
    roteiro: (input.roteiro ?? []) as never,
    galeria: (input.galeria ?? []) as never,
    politicas: (input.politicas ?? []) as never,
    tags: input.tags ?? [],
    observacoes: input.observacoes ?? null,
    video_url: input.video_url ?? null,
    vagas_total_padrao: input.vagas_total_padrao ?? 10,
    parcelamento_max: input.parcelamento_max ?? 1,
  };
  const { data, error } = await supabase.from("expedicoes").insert(payload).select().single();
  if (error) throw error;
  await logActivity({ modulo: "expedicoes", acao: "criar", descricao: data.nome });
  return data as unknown as ExpedicaoRow;
}

export async function updateExpedicao(id: string, patch: Partial<ExpedicaoRow>): Promise<ExpedicaoRow> {
  const { data, error } = await supabase
    .from("expedicoes")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity({ modulo: "expedicoes", acao: "atualizar", descricao: data.nome });
  return data as unknown as ExpedicaoRow;
}

export async function deleteExpedicao(id: string): Promise<void> {
  const { error } = await supabase.from("expedicoes").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ modulo: "expedicoes", acao: "excluir", metadata: { id } });
}

export async function duplicateExpedicao(id: string): Promise<ExpedicaoRow> {
  const original = await getExpedicao(id);
  if (!original) throw new Error("Expedição não encontrada");
  const { id: _omit, created_at: _c, updated_at: _u, ...rest } = original;
  void _omit; void _c; void _u;
  const novoSlug = `${original.slug}-copia-${Date.now().toString(36)}`;
  return createExpedicao({ ...rest, nome: `${original.nome} (cópia)`, slug: novoSlug, status: "rascunho" });
}

// ---------- ASSETS ----------

export interface AssetRow {
  id: string;
  expedicao_id: string;
  tipo: "imagem" | "video" | "pdf";
  url: string;
  titulo: string | null;
  ordem: number;
  is_capa: boolean;
  created_at: string;
}

export async function listAssets(expedicaoId: string): Promise<AssetRow[]> {
  const { data, error } = await supabase
    .from("expedicao_assets")
    .select("*")
    .eq("expedicao_id", expedicaoId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as AssetRow[];
}

export async function uploadAsset(
  expedicaoId: string,
  file: File,
  tipo: AssetRow["tipo"] = "imagem",
): Promise<AssetRow> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${expedicaoId}/${crypto.randomUUID()}.${ext}`;
  const bucket = tipo === "pdf" ? "expedicao-docs" : "expedicao-midia";
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (upErr) throw upErr;
  const url =
    bucket === "expedicao-midia"
      ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      : path;

  const { data: assets } = await supabase
    .from("expedicao_assets")
    .select("ordem")
    .eq("expedicao_id", expedicaoId)
    .order("ordem", { ascending: false })
    .limit(1);
  const nextOrdem = (assets?.[0]?.ordem ?? -1) + 1;

  const { data, error } = await supabase
    .from("expedicao_assets")
    .insert({
      expedicao_id: expedicaoId,
      tipo,
      url,
      titulo: file.name,
      ordem: nextOrdem,
      is_capa: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as AssetRow;
}

export async function deleteAsset(asset: AssetRow): Promise<void> {
  // tenta remover do storage
  try {
    if (asset.tipo !== "pdf") {
      const marker = "/expedicao-midia/";
      const idx = asset.url.indexOf(marker);
      if (idx >= 0) {
        const path = asset.url.slice(idx + marker.length);
        await supabase.storage.from("expedicao-midia").remove([path]);
      }
    } else {
      await supabase.storage.from("expedicao-docs").remove([asset.url]);
    }
  } catch {
    /* ignora */
  }
  const { error } = await supabase.from("expedicao_assets").delete().eq("id", asset.id);
  if (error) throw error;
}

export async function setCapa(asset: AssetRow): Promise<void> {
  await supabase
    .from("expedicao_assets")
    .update({ is_capa: false } as never)
    .eq("expedicao_id", asset.expedicao_id);
  await supabase.from("expedicao_assets").update({ is_capa: true } as never).eq("id", asset.id);
  await supabase
    .from("expedicoes")
    .update({ capa_url: asset.url, imagem_url: asset.url } as never)
    .eq("id", asset.expedicao_id);
}

export async function moveAsset(asset: AssetRow, direction: "up" | "down"): Promise<void> {
  const assets = await listAssets(asset.expedicao_id);
  const idx = assets.findIndex((a) => a.id === asset.id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= assets.length) return;
  const other = assets[swapIdx];
  await supabase.from("expedicao_assets").update({ ordem: other.ordem } as never).eq("id", asset.id);
  await supabase.from("expedicao_assets").update({ ordem: asset.ordem } as never).eq("id", other.id);
}

// ---------- DATAS ----------

export interface DataRow {
  id: string;
  expedicao_id: string;
  data_inicio: string;
  data_fim: string;
  vagas_total: number;
  vagas_disponiveis: number;
  status: string;
  preco_pix: number | null;
  preco_cartao: number | null;
}

export async function listDatas(expedicaoId: string): Promise<DataRow[]> {
  const { data, error } = await supabase
    .from("datas")
    .select("*")
    .eq("expedicao_id", expedicaoId)
    .order("data_inicio", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DataRow[];
}

export async function createData(input: Omit<DataRow, "id">): Promise<DataRow> {
  const { data, error } = await supabase.from("datas").insert(input as never).select().single();
  if (error) throw error;
  return data as unknown as DataRow;
}
export async function updateData(id: string, patch: Partial<DataRow>): Promise<DataRow> {
  const { data, error } = await supabase
    .from("datas")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as DataRow;
}
export async function deleteData(id: string): Promise<void> {
  const { error } = await supabase.from("datas").delete().eq("id", id);
  if (error) throw error;
}

// ---------- LEADS ----------

export const LEAD_STATUS = [
  { id: "novo", label: "Novo lead" },
  { id: "contato_realizado", label: "Contato realizado" },
  { id: "negociacao", label: "Em negociação" },
  { id: "pagamento_pendente", label: "Pagamento pendente" },
  { id: "confirmado", label: "Confirmado" },
  { id: "cancelado", label: "Cancelado" },
  { id: "pos_venda", label: "Pós-venda" },
] as const;
export type LeadStatusId = (typeof LEAD_STATUS)[number]["id"];

export interface LeadRow {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  expedicao_interesse: string | null;
  origem: string | null;
  status: LeadStatusId;
  observacoes: string | null;
  acompanhantes: number;
  quantidade_pessoas: number;
  valor_estimado: number | null;
  protocolo: string | null;
  created_at: string;
  updated_at: string;
}

export async function listLeads(): Promise<LeadRow[]> {
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadRow[];
}

export async function getLead(id: string): Promise<LeadRow | null> {
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as LeadRow) ?? null;
}

export async function createLead(input: Partial<LeadRow>): Promise<LeadRow> {
  let protocolo = input.protocolo ?? null;
  if (!protocolo) {
    const { data: p } = await supabase.rpc("gerar_protocolo_lead");
    protocolo = (p as string | null) ?? null;
  }
  const payload = {
    nome: input.nome ?? "Sem nome",
    email: input.email ?? null,
    telefone: input.telefone ?? null,
    cidade: input.cidade ?? null,
    estado: input.estado ?? null,
    expedicao_interesse: input.expedicao_interesse ?? null,
    origem: input.origem ?? "manual",
    status: input.status ?? "novo",
    observacoes: input.observacoes ?? null,
    acompanhantes: input.acompanhantes ?? 0,
    quantidade_pessoas: input.quantidade_pessoas ?? 1,
    valor_estimado: input.valor_estimado ?? null,
    protocolo,
  };
  const { data, error } = await supabase.from("leads").insert(payload).select().single();
  if (error) throw error;
  await addLeadActivity(data.id, "criacao", `Lead criado · ${data.nome}`);
  await logActivity({ modulo: "leads", acao: "criar", descricao: data.nome });
  return data as unknown as LeadRow;
}

export async function updateLead(id: string, patch: Partial<LeadRow>): Promise<LeadRow> {
  const before = await getLead(id);
  const { data, error } = await supabase
    .from("leads")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  if (before && patch.status && before.status !== patch.status) {
    const labelDe = LEAD_STATUS.find((s) => s.id === before.status)?.label ?? before.status;
    const labelPara = LEAD_STATUS.find((s) => s.id === patch.status)?.label ?? patch.status;
    await addLeadActivity(id, "mudanca_status", `${labelDe} → ${labelPara}`);
  }
  await logActivity({ modulo: "leads", acao: "atualizar", descricao: data.nome });
  return data as unknown as LeadRow;
}

export async function deleteLead(id: string): Promise<void> {
  await supabase.from("lead_atividades").delete().eq("lead_id", id);
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ modulo: "leads", acao: "excluir", metadata: { id } });
}

export interface LeadAtividade {
  id: string;
  lead_id: string;
  tipo: string;
  descricao: string | null;
  autor_id: string | null;
  created_at: string;
}

export async function listLeadAtividades(leadId: string): Promise<LeadAtividade[]> {
  const { data, error } = await supabase
    .from("lead_atividades")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadAtividade[];
}

export async function addLeadActivity(
  leadId: string,
  tipo: "criacao" | "mudanca_status" | "observacao" | "contato",
  descricao: string,
) {
  const autor = await currentUserId();
  await supabase.from("lead_atividades").insert({
    lead_id: leadId,
    tipo,
    descricao,
    autor_id: autor,
  });
}

// ---------- PARTICIPANTES ----------

export interface ParticipanteRow {
  id: string;
  reserva_id: string | null;
  nome: string;
  documento: string | null;
  contato: string | null;
  observacoes_medicas: string | null;
  data_nascimento: string | null;
  experiencia_equestre: string | null;
  restricoes: string | null;
  acompanhante: string | null;
  expedicao_id: string | null;
  data_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listParticipantes(): Promise<ParticipanteRow[]> {
  const { data, error } = await supabase
    .from("participantes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ParticipanteRow[];
}

export async function getParticipante(id: string): Promise<ParticipanteRow | null> {
  const { data, error } = await supabase.from("participantes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ParticipanteRow) ?? null;
}

export async function createParticipante(input: Partial<ParticipanteRow>): Promise<ParticipanteRow> {
  const { data, error } = await supabase
    .from("participantes")
    .insert({
      nome: input.nome ?? "Sem nome",
      documento: input.documento ?? null,
      contato: input.contato ?? null,
      observacoes_medicas: input.observacoes_medicas ?? null,
      data_nascimento: input.data_nascimento ?? null,
      experiencia_equestre: input.experiencia_equestre ?? null,
      restricoes: input.restricoes ?? null,
      acompanhante: input.acompanhante ?? null,
      expedicao_id: input.expedicao_id ?? null,
      data_id: input.data_id ?? null,
      reserva_id: input.reserva_id ?? null,
      status: input.status ?? "pendente",
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity({ modulo: "participantes", acao: "criar", descricao: data.nome });
  return data as unknown as ParticipanteRow;
}

export async function updateParticipante(id: string, patch: Partial<ParticipanteRow>): Promise<ParticipanteRow> {
  const { data, error } = await supabase
    .from("participantes")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity({ modulo: "participantes", acao: "atualizar", descricao: data.nome });
  return data as unknown as ParticipanteRow;
}

export async function deleteParticipante(id: string): Promise<void> {
  const { error } = await supabase.from("participantes").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ modulo: "participantes", acao: "excluir", metadata: { id } });
}

// ---------- FINANCEIRO ----------

export interface ReservaRow {
  id: string;
  protocolo: string;
  expedicao_id: string | null;
  expedicao_nome: string;
  data_id: string | null;
  data_label: string;
  status: string;
  quantidade_participantes: number;
  responsavel: Record<string, unknown>;
  valor_total: number | null;
  valor_pago: number;
  forma_pagamento: string | null;
  parcelas: number;
  status_pagamento: string;
  created_at: string;
  updated_at: string;
}

export async function listReservas(): Promise<ReservaRow[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaRow[];
}

export async function getReserva(id: string): Promise<ReservaRow | null> {
  const { data, error } = await supabase.from("reservas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ReservaRow) ?? null;
}

export async function updatePagamento(
  id: string,
  patch: Partial<Pick<ReservaRow, "valor_total" | "valor_pago" | "forma_pagamento" | "parcelas" | "status_pagamento">>,
): Promise<ReservaRow> {
  const { data, error } = await supabase
    .from("reservas")
    .update(patch as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  await logActivity({
    modulo: "financeiro",
    acao: "atualizar_pagamento",
    descricao: data.protocolo,
    metadata: patch,
  });
  return data as unknown as ReservaRow;
}
