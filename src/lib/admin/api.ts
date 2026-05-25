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

async function gerarSlugUnico(base: string): Promise<string> {
  const baseSlug = slugify(base) || `expedicao-${Date.now().toString(36)}`;
  let candidato = baseSlug;
  let i = 1;
  // até 20 tentativas
  while (i < 20) {
    const { data } = await supabase.from("expedicoes").select("id").eq("slug", candidato).maybeSingle();
    if (!data) return candidato;
    i += 1;
    candidato = `${baseSlug}-${i}`;
  }
  return `${baseSlug}-${Date.now().toString(36)}`;
}

export async function createExpedicao(input: Partial<ExpedicaoRow>): Promise<ExpedicaoRow> {
  const nomeBase = input.nome ?? "Nova expedição";
  const slug = input.slug ?? (await gerarSlugUnico(nomeBase));
  const payload = {
    nome: nomeBase,
    slug,
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
  const { data, error } = await supabase.from("expedicoes").insert(payload).select().maybeSingle();
  if (error) {
    // Conflito de slug raríssimo (corrida) — tenta de novo com sufixo timestamp
    if (error.message.includes("duplicate key") || error.code === "23505") {
      const retrySlug = `${slug}-${Date.now().toString(36)}`;
      const { data: retryData, error: retryErr } = await supabase
        .from("expedicoes").insert({ ...payload, slug: retrySlug }).select().maybeSingle();
      if (retryErr) throw new Error(retryErr.message);
      if (!retryData) throw new Error("Expedição criada mas não retornada.");
      await logActivity({ modulo: "expedicoes", acao: "criar", descricao: retryData.nome });
      return retryData as unknown as ExpedicaoRow;
    }
    throw new Error(error.message);
  }
  if (!data) throw new Error("Expedição criada mas não retornada (verifique permissões internas).");
  await logActivity({ modulo: "expedicoes", acao: "criar", descricao: data.nome });
  return data as unknown as ExpedicaoRow;
}


export async function updateExpedicao(id: string, patch: Partial<ExpedicaoRow>): Promise<ExpedicaoRow> {
  const { data, error } = await supabase
    .from("expedicoes")
    .update(patch as never)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Expedição não encontrada ou sem permissão.");
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
  cpf: string | null;
  peso: number | null;
  data_nascimento: string | null;
  cidade: string | null;
  estado: string | null;
  expedicao_interesse: string | null;
  origem: string | null;
  status: LeadStatusId;
  experiencia_equestre: string | null;
  observacoes_medicas: string | null;
  restricoes_alimentares: string | null;
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
    cpf: input.cpf ?? null,
    peso: input.peso ?? null,
    data_nascimento: input.data_nascimento ?? null,
    cidade: input.cidade ?? null,
    estado: input.estado ?? null,
    expedicao_interesse: input.expedicao_interesse ?? null,
    origem: input.origem ?? "manual",
    status: input.status ?? "novo",
    experiencia_equestre: input.experiencia_equestre ?? null,
    observacoes_medicas: input.observacoes_medicas ?? null,
    restricoes_alimentares: input.restricoes_alimentares ?? null,
    observacoes: input.observacoes ?? null,
    acompanhantes: input.acompanhantes ?? 0,
    quantidade_pessoas: input.quantidade_pessoas ?? 1,
    valor_estimado: input.valor_estimado ?? null,
    protocolo,
  };
  const { data, error } = await supabase.from("leads").insert(payload as never).select().maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead criado mas não retornado (verifique permissões).");
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
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead não encontrado.");
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
  cpf: string | null;
  peso: number | null;
  contato: string | null;
  telefone: string | null;
  email: string | null;
  observacoes_medicas: string | null;
  restricoes_alimentares: string | null;
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
      cpf: input.cpf ?? null,
      peso: input.peso ?? null,
      contato: input.contato ?? null,
      telefone: input.telefone ?? null,
      email: input.email ?? null,
      observacoes_medicas: input.observacoes_medicas ?? null,
      restricoes_alimentares: input.restricoes_alimentares ?? null,
      data_nascimento: input.data_nascimento ?? null,
      experiencia_equestre: input.experiencia_equestre ?? null,
      restricoes: input.restricoes ?? null,
      acompanhante: input.acompanhante ?? null,
      expedicao_id: input.expedicao_id ?? null,
      data_id: input.data_id ?? null,
      reserva_id: input.reserva_id ?? null,
      status: input.status ?? "pendente",
    } as never)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Participante criado mas não retornado.");
  await logActivity({ modulo: "participantes", acao: "criar", descricao: data.nome });
  return data as unknown as ParticipanteRow;
}

export async function updateParticipante(id: string, patch: Partial<ParticipanteRow>): Promise<ParticipanteRow> {
  const { data, error } = await supabase
    .from("participantes")
    .update(patch as never)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Participante não encontrado.");
  await logActivity({ modulo: "participantes", acao: "atualizar", descricao: data.nome });
  return data as unknown as ParticipanteRow;
}

export async function deleteParticipante(id: string): Promise<void> {
  const { error } = await supabase.from("participantes").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ modulo: "participantes", acao: "excluir", metadata: { id } });
}

// ---------- FINANCEIRO / RESERVAS / GRUPOS ----------

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
  grupo_nome: string | null;
  valor_total: number | null;
  valor_pago: number;
  saldo_restante: number | null;
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
  patch: Partial<Pick<ReservaRow, "valor_total" | "valor_pago" | "forma_pagamento" | "parcelas" | "status_pagamento" | "grupo_nome">>,
): Promise<ReservaRow> {
  const { data, error } = await supabase
    .from("reservas")
    .update(patch as never)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Reserva não encontrada.");
  await logActivity({
    modulo: "financeiro",
    acao: "atualizar_pagamento",
    descricao: data.protocolo,
    metadata: patch,
  });
  return data as unknown as ReservaRow;
}

export async function listParticipantesDaReserva(reservaId: string): Promise<ParticipanteRow[]> {
  const { data, error } = await supabase
    .from("participantes")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as ParticipanteRow[];
}

// ---------- DOCUMENTOS ----------

export interface DocumentoRow {
  id: string;
  titulo: string;
  tipo: string;
  categoria: string | null;
  url: string;
  expedicao_id: string | null;
  participante_id: string | null;
  reserva_id: string | null;
  created_at: string;
}

export const TIPOS_DOCUMENTO = [
  { id: "contrato", label: "Contrato" },
  { id: "termo_responsabilidade", label: "Termo de responsabilidade" },
  { id: "politica_cancelamento", label: "Política de cancelamento" },
  { id: "ficha_medica", label: "Ficha médica" },
  { id: "juridico", label: "Documento jurídico" },
  { id: "outro", label: "Outro" },
] as const;

export async function listDocumentos(): Promise<DocumentoRow[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentoRow[];
}

export async function uploadDocumento(args: {
  file: File;
  titulo: string;
  tipo: string;
  expedicao_id?: string | null;
  participante_id?: string | null;
  reserva_id?: string | null;
}): Promise<DocumentoRow> {
  const ext = args.file.name.split(".").pop() ?? "pdf";
  const folder = args.participante_id ?? args.reserva_id ?? args.expedicao_id ?? "geral";
  const bucket = args.participante_id ? "participante-docs" : "expedicao-docs";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, args.file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      titulo: args.titulo || args.file.name,
      tipo: args.tipo,
      categoria: bucket,
      url: path,
      expedicao_id: args.expedicao_id ?? null,
      participante_id: args.participante_id ?? null,
      reserva_id: args.reserva_id ?? null,
    } as never)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Documento criado mas não retornado.");
  return data as unknown as DocumentoRow;
}

export async function deleteDocumento(doc: DocumentoRow): Promise<void> {
  const bucket = doc.categoria || (doc.participante_id ? "participante-docs" : "expedicao-docs");
  try { await supabase.storage.from(bucket).remove([doc.url]); } catch { /* ignora */ }
  const { error } = await supabase.from("documentos").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function getDocumentoSignedUrl(doc: DocumentoRow): Promise<string> {
  const bucket = doc.categoria || (doc.participante_id ? "participante-docs" : "expedicao-docs");
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(doc.url, 60 * 10);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

