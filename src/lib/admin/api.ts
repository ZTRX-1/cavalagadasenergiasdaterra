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

export async function getMe() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
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
  como_chegar_titulo: string | null;
  como_chegar_conteudo: string | null;
  como_chegar_aeroporto: string | null;
  como_chegar_referencia: string | null;
  como_chegar_observacoes: string | null;
  como_chegar_distancias: string | null;
  mensagem_comercial_publica: string | null;
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
    mensagem_comercial_publica: input.mensagem_comercial_publica ?? null,
    como_chegar_distancias: input.como_chegar_distancias ?? null,
  };
  const { data, error } = await supabase.from("expedicoes").insert(payload).select().single();
  if (error) {
    // Conflito de slug raríssimo (corrida) — tenta de novo com sufixo timestamp
    if (error.message.includes("duplicate key") || error.code === "23505") {
      const retrySlug = `${slug}-${Date.now().toString(36)}`;
      const { data: retryData, error: retryErr } = await supabase
        .from("expedicoes").insert({ ...payload, slug: retrySlug }).select().single();
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
  const { id: _omit, created_at: _c, updated_at: _u, slug: _s, ...rest } = original;
  void _omit; void _c; void _u; void _s;
  const novoSlug = await gerarSlugUnico(`${original.slug}-copia`);
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

/** Atualiza metadados do asset (legenda etc). */
export async function updateAsset(
  assetId: string,
  patch: Partial<Pick<AssetRow, "titulo" | "ordem">>,
): Promise<void> {
  const { error } = await supabase
    .from("expedicao_assets")
    .update(patch as never)
    .eq("id", assetId);
  if (error) throw error;
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

// ---------- LEADS (CRM) ----------

/** Etapas do Atendimento — coluna do Kanban e progresso do lead. */
export const LEAD_ETAPAS = [
  { id: "novo", label: "Novo", descricao: "Acabou de chegar" },
  { id: "triagem_ia", label: "Triagem / IA", descricao: "IA ou equipe inicializando contato" },
  { id: "qualificado", label: "Qualificado", descricao: "Tem perfil para a viagem" },
  { id: "proposta_enviada", label: "Proposta Enviada", descricao: "Proposta de viagem enviada" },
  { id: "reserva_pendente", label: "Reserva Pendente", descricao: "Aguardando sinal ou reserva" },
  { id: "participante_confirmado", label: "Participante Confirmado", descricao: "Reserva e pagamentos validados" },
  { id: "convertido", label: "Convertido", descricao: "Lead transformado em reserva" },
  { id: "concluido", label: "Pós-venda / Concluído", descricao: "Expedição realizada com sucesso" },
  { id: "perdido", label: "Perdido", descricao: "Não avançou no processo" },
] as const;
export type LeadEtapaId = (typeof LEAD_ETAPAS)[number]["id"];

// Compat
export const LEAD_STATUS = LEAD_ETAPAS.map((e) => ({ id: e.id, label: e.label }));
export type LeadStatusId = LeadEtapaId;

export interface LeadRow {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf: string | null;
  peso: number | null;
  data_nascimento: string | null;
  idade: number | null;
  cidade: string | null;
  estado: string | null;
  expedicao_interesse: string | null;
  origem: string | null;
  status: string;
  etapa_atendimento: LeadEtapaId;
  etapa_operacional: string;
  reserva_id?: string | null;
  nivel_interesse: number;
  lead_score: number;
  responsavel_id: string | null;
  resumo_atendimento: string | null;
  resumo_ia: string | null;
  proxima_acao: string | null;
  ultima_interacao_at: string | null;
  data_interesse: string | null;
  canal_entrada: string | null;
  canal_atendimento: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
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
  temperatura_lead: LeadTemperaturaId;
  status_atendimento: LeadStatusAtendimentoId;
  motivo_perda: LeadMotivoPerdaId | null;
  motivo_perda_detalhe: string | null;
  expedicao_id: string | null;
  data_expedicao_id: string | null;
  motivacao_viagem: string | null;
  observacoes_importantes: string | null;
  tipo_grupo: string | null;
  perfil: string | null;
  objetivos: string | null;
  interesses: string | null;
  restricoes: string | null;
  orcamento: string | null;
}

// ---------- TEMPERATURA / STATUS DE ATENDIMENTO / MOTIVO DE PERDA ----------

export const LEAD_TEMPERATURAS = [
  { id: "frio", label: "Frio", emoji: "🥶" },
  { id: "morno", label: "Morno", emoji: "🌤️" },
  { id: "quente", label: "Quente", emoji: "🔥" },
  { id: "urgente", label: "Urgente", emoji: "🚨" },
] as const;
export type LeadTemperaturaId = (typeof LEAD_TEMPERATURAS)[number]["id"];

export const LEAD_STATUS_ATENDIMENTO = [
  { id: "ia", label: "Atendimento IA" },
  { id: "humano", label: "Atendimento Humano" },
  { id: "transferido", label: "Transferido" },
  { id: "encerrado", label: "Encerrado" },
] as const;
export type LeadStatusAtendimentoId = (typeof LEAD_STATUS_ATENDIMENTO)[number]["id"];

export const LEAD_MOTIVOS_PERDA = [
  { id: "preco", label: "Preço" },
  { id: "data", label: "Data" },
  { id: "sem_disponibilidade", label: "Sem disponibilidade" },
  { id: "nao_respondeu", label: "Não respondeu" },
  { id: "concorrente", label: "Concorrente" },
  { id: "outro", label: "Outro" },
] as const;
export type LeadMotivoPerdaId = (typeof LEAD_MOTIVOS_PERDA)[number]["id"];

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
  const etapa = (input.etapa_atendimento ?? "novo") as LeadEtapaId;
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
    status: input.status ?? etapa,
    etapa_atendimento: etapa,
    nivel_interesse: input.nivel_interesse ?? 3,
    lead_score: input.lead_score ?? 0,
    responsavel_id: input.responsavel_id ?? null,
    resumo_atendimento: input.resumo_atendimento ?? null,
    proxima_acao: input.proxima_acao ?? null,
    data_interesse: input.data_interesse ?? null,
    canal_entrada: input.canal_entrada ?? null,
    canal_atendimento: input.canal_atendimento ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
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
  await logActivity({ modulo: "leads", acao: "criar", descricao: data.nome });
  return data as unknown as LeadRow;
}

export async function updateLead(id: string, patch: Partial<LeadRow>): Promise<LeadRow> {
  const { data, error } = await supabase
    .from("leads")
    .update(patch as never)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Lead não encontrado.");
  await logActivity({ modulo: "leads", acao: "atualizar", descricao: data.nome });
  return data as unknown as LeadRow;
}

export async function deleteLead(id: string): Promise<void> {
  await supabase.from("lead_atividades").delete().eq("lead_id", id);
  await supabase.from("lead_conversas").delete().eq("lead_id", id);
  await supabase.from("lead_memoria").delete().eq("lead_id", id);
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ modulo: "leads", acao: "excluir", metadata: { id } });
}

// ---------- LEAD CONVERSAS (timeline auditável) ----------

export type LeadConversaTipo =
  | "mensagem_ia"
  | "mensagem_humana"
  | "ligacao"
  | "pagamento"
  | "contrato"
  | "alteracao_status"
  | "observacao_interna"
  | "email"
  | "sistema";

export const CONVERSA_TIPOS: Array<{ id: LeadConversaTipo; label: string }> = [
  { id: "observacao_interna", label: "Observação interna" },
  { id: "mensagem_humana", label: "Mensagem (humana)" },
  { id: "ligacao", label: "Ligação" },
  { id: "email", label: "E-mail" },
  { id: "contrato", label: "Contrato" },
  { id: "pagamento", label: "Pagamento" },
  { id: "mensagem_ia", label: "Mensagem (IA)" },
];

export interface LeadConversaRow {
  id: string;
  lead_id: string;
  tipo_evento: LeadConversaTipo;
  conteudo: string | null;
  metadata: Record<string, unknown>;
  autor_id: string | null;
  autor_nome: string | null;
  direcao: string | null;
  canal: string | null;
  created_at: string;
}

export async function listLeadConversas(leadId: string): Promise<LeadConversaRow[]> {
  const { data, error } = await supabase
    .from("lead_conversas")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as LeadConversaRow[];
}

export async function addLeadConversa(input: {
  leadId: string;
  tipo: LeadConversaTipo;
  conteudo: string;
  canal?: string | null;
  direcao?: "entrada" | "saida" | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const autor = await currentUserId();
  const { error } = await supabase.from("lead_conversas").insert({
    lead_id: input.leadId,
    tipo_evento: input.tipo,
    conteudo: input.conteudo,
    canal: input.canal ?? null,
    direcao: input.direcao ?? null,
    metadata: (input.metadata ?? {}) as never,
    autor_id: autor,
  } as never);
  if (error) throw new Error(error.message);
}

// ---------- LEAD MEMÓRIA (pronto para IA conversacional) ----------

export interface LeadMemoriaRow {
  lead_id: string;
  perfil: string | null;
  objetivos: string | null;
  interesses: string | null;
  restricoes: string | null;
  expedicoes_favoritas: string[];
  orcamento: string | null;
  dados_extraidos: Record<string, unknown>;
  ultima_atualizacao: string;
}

export async function getLeadMemoria(leadId: string): Promise<LeadMemoriaRow | null> {
  const { data, error } = await supabase
    .from("lead_memoria")
    .select("*")
    .eq("lead_id", leadId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as LeadMemoriaRow) ?? null;
}

export async function upsertLeadMemoria(leadId: string, patch: Partial<LeadMemoriaRow>): Promise<void> {
  const { error } = await supabase
    .from("lead_memoria")
    .upsert(
      {
        lead_id: leadId,
        perfil: patch.perfil ?? null,
        objetivos: patch.objetivos ?? null,
        interesses: patch.interesses ?? null,
        restricoes: patch.restricoes ?? null,
        expedicoes_favoritas: (patch.expedicoes_favoritas ?? []) as never,
        orcamento: patch.orcamento ?? null,
        dados_extraidos: (patch.dados_extraidos ?? {}) as never,
        ultima_atualizacao: new Date().toISOString(),
      } as never,
      { onConflict: "lead_id" },
    );
  if (error) throw new Error(error.message);
}

// ---- compat antigo (LeadAtividade) ----
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
  cpf_recebido: boolean;
  pagamento_recebido: boolean;
  contrato_assinado: boolean;
  ficha_medica_enviada: boolean;
  documentacao_aprovada: boolean;
  responsavel_reserva: boolean;
  documento_validado: boolean;
}

export async function listParticipantes(): Promise<ParticipanteRow[]> {
  const { data, error } = await supabase
    .from("participantes")
    .select("*, cpf_recebido, pagamento_recebido, contrato_assinado, ficha_medica_enviada, documentacao_aprovada")
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

export async function deleteReserva(id: string): Promise<void> {
  // O trigger de banco ou RLS deve lidar com as cascatas se houver, 
  // mas aqui garantimos o log de atividade.
  const { data: res } = await supabase.from("reservas").select("protocolo").eq("id", id).maybeSingle();
  const { error } = await supabase.from("reservas").delete().eq("id", id);
  if (error) throw error;
  await logActivity({ 
    modulo: "reservas", 
    acao: "excluir", 
    descricao: res?.protocolo ?? "Reserva",
    metadata: { id } 
  });
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
  escopo: "institucional" | "expedicao" | "participante";
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
  escopo?: "institucional" | "expedicao" | "participante";
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
  const escopo: "institucional" | "expedicao" | "participante" =
    args.escopo ??
    (args.participante_id ? "participante" : args.expedicao_id || args.reserva_id ? "expedicao" : "institucional");
  const { data, error } = await supabase
    .from("documentos")
    .insert({
      titulo: args.titulo || args.file.name,
      tipo: args.tipo,
      categoria: bucket,
      url: path,
      escopo,
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

export async function listDocumentosByParticipante(participanteId: string): Promise<DocumentoRow[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("participante_id", participanteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DocumentoRow[];
}



// ---------- CONFIGURAÇÕES ----------

export interface ConfiguracoesRow {
  id: string;
  empresa_nome: string | null;
  empresa_cnpj: string | null;
  endereco: string | null;
  email: string | null;
  whatsapp: string | null;
  emails_notificacao: string[];
  instagram: string | null;
  logo_url: string | null;
  cor_destaque: string | null;
  preferencias: Record<string, unknown>;
  updated_at: string;
}

export async function getConfiguracoes(): Promise<ConfiguracoesRow | null> {
  const { data, error } = await supabase
    .from("configuracoes" as never)
    .select("*")
    .eq("singleton", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as unknown as ConfiguracoesRow) ?? null;
}

export async function saveConfiguracoes(patch: Partial<ConfiguracoesRow>): Promise<ConfiguracoesRow> {
  const { data, error } = await supabase
    .from("configuracoes" as never)
    .update(patch as never)
    .eq("singleton", true)
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Configurações não encontradas.");
  await logActivity({ modulo: "configuracoes", acao: "atualizar" });
  return data as unknown as ConfiguracoesRow;
}

// ---------- USUÁRIOS INTERNOS ----------

export const CARGOS_EQUIPE = [
  "CEO",
  "Administrador(a)",
  "Gerente Operacional",
  "Coordenador(a) de Expedições",
  "Guia de Campo",
  "Financeiro",
  "Marketing / Comunicação",
  "Atendimento / Reservas",
  "Suporte",
  "Developer",
  "Estrategista Digital",
  "Arquiteto de Operações",
] as const;

export type AppRole =
  | "desenvolvedor"
  | "superadmin"
  | "admin"
  | "ceo"
  | "ceo_preview"
  | "socia"
  | "operador";

export const ROLE_LABELS: Record<AppRole, string> = {
  desenvolvedor: "Desenvolvedor (protegido)",
  superadmin: "Super Administrador (Vexon)",
  admin: "Administrador",
  ceo: "CEO",
  ceo_preview: "CEO Preview",
  socia: "Sócia",
  operador: "Operador",
};

export interface UsuarioInternoRow {
  user_id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url: string | null;
  bio: string | null;
  telefone: string | null;
  ativo: boolean;
  role: AppRole | null;
}

export async function listUsuariosInternos(): Promise<UsuarioInternoRow[]> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("user_id, nome, cargo, avatar_url, bio, telefone, ativo");
  if (error) throw new Error(error.message);
  const { data: roles } = await supabase.from("user_roles").select("user_id, role");
  const map = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));
  return (profiles ?? [])
    .filter((p) => map.has(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      nome: p.nome,
      cargo: p.cargo,
      avatar_url: p.avatar_url,
      bio: (p as { bio?: string | null }).bio ?? null,
      telefone: (p as { telefone?: string | null }).telefone ?? null,
      ativo: (p as { ativo?: boolean }).ativo ?? true,
      role: map.get(p.user_id) ?? null,
    }));
}

async function callAdminUsers(body: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke("admin-users", { body });
  if (error) {
    const msg = (data as { error?: string } | null)?.error || error.message;
    throw new Error(msg);
  }
  const result = data as { ok?: boolean; error?: string } | null;
  if (result?.error) throw new Error(result.error);
  return data;
}

export async function criarUsuarioInterno(input: {
  email: string; password: string; nome: string; cargo: string | null; role: AppRole;
}): Promise<void> {
  await callAdminUsers({ action: "create", ...input });
  await logActivity({ modulo: "usuarios", acao: "criar", descricao: input.email });
}

export async function atualizarRoleUsuario(user_id: string, role: AppRole, cargo?: string | null): Promise<void> {
  await callAdminUsers({ action: "update_role", user_id, role, cargo });
  await logActivity({ modulo: "usuarios", acao: "atualizar_role", metadata: { user_id, role } });
}

export async function redefinirSenhaUsuario(user_id: string, password: string): Promise<void> {
  await callAdminUsers({ action: "reset_password", user_id, password });
  await logActivity({ modulo: "usuarios", acao: "reset_senha", metadata: { user_id } });
}

export async function alternarAtivoUsuario(user_id: string, ativo: boolean): Promise<void> {
  await callAdminUsers({ action: "set_active", user_id, ativo });
}

export async function excluirUsuarioInterno(user_id: string, master_password?: string): Promise<void> {
  await callAdminUsers({ action: "delete", user_id, master_password });
  await logActivity({ modulo: "usuarios", acao: "excluir", metadata: { user_id } });
}

// ---------- PERFIL PESSOAL ----------

export interface MeuPerfil {
  user_id: string;
  email: string | null;
  nome: string | null;
  cargo: string | null;
  bio: string | null;
  telefone: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  role: AppRole | null;
  cargo_id: string | null;
  cargo_nome: string | null;
  ultimo_login: string | null;
  data_entrada: string | null;
  login_attempts: number;
}

export async function getMeuPerfil(): Promise<MeuPerfil | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, nome, cargo, avatar_url, banner_url, bio, telefone, cargo_id, ultimo_login, data_entrada, login_attempts")
    .eq("user_id", u.user.id)
    .maybeSingle();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", u.user.id)
    .maybeSingle();
  const p = profile as (Record<string, unknown> & { cargo_id?: string | null; ultimo_login?: string | null; data_entrada?: string | null; bio?: string | null; telefone?: string | null }) | null;
  let cargo_nome: string | null = null;
  if (p?.cargo_id) {
    const { data: cargo } = await supabase
      .from("cargos")
      .select("nome")
      .eq("id", p.cargo_id)
      .maybeSingle();
    cargo_nome = (cargo as { nome?: string } | null)?.nome ?? null;
  }
  return {
    user_id: u.user.id,
    email: u.user.email ?? null,
    nome: profile?.nome ?? null,
    cargo: profile?.cargo ?? null,
    bio: (p?.bio as string | null) ?? null,
    telefone: (p?.telefone as string | null) ?? null,
    avatar_url: profile?.avatar_url ?? null,
    banner_url: (p?.banner_url as string | null) ?? null,
    role: (role?.role as AppRole | undefined) ?? null,
    cargo_id: p?.cargo_id ?? null,
    cargo_nome,
    ultimo_login: p?.ultimo_login ?? null,
    data_entrada: p?.data_entrada ?? null,
    login_attempts: (p?.login_attempts as number) ?? 0,
  };
}

export async function atualizarMeuPerfil(patch: {
  nome?: string | null; cargo?: string | null; bio?: string | null; telefone?: string | null; avatar_url?: string | null; banner_url?: string | null;
}): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Não autenticado");
  const { error } = await supabase
    .from("profiles")
    .update(patch as never)
    .eq("user_id", u.user.id);
  if (error) throw new Error(error.message);
}

export async function alterarMinhaSenha(novaSenha: string): Promise<void> {
  if (!novaSenha || novaSenha.length < 8) throw new Error("A senha deve ter ao menos 8 caracteres.");
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(error.message);
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Não autenticado");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WebP.");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("Arquivo acima de 2 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${u.user.id}/avatar-${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
    cacheControl: "3600", upsert: true, contentType: file.type,
  });
  if (upErr) throw new Error(upErr.message);
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- MÍDIA EXTERNA ----------

export async function addVideoUrl(expedicaoId: string, url: string, titulo?: string): Promise<AssetRow> {
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
      tipo: "video",
      url,
      titulo: titulo ?? "Vídeo externo",
      ordem: nextOrdem,
      is_capa: false,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as AssetRow;
}

// ---------- CONVERSÃO LEAD → RESERVA ----------

export interface ConverterLeadInput {
  expedicao_id: string;
  expedicao_nome: string;
  data_id: string;
  data_label: string;
  quantidade_participantes: number;
  preco_unitario: number;
  forma_pagamento?: string | null;
  observacoes?: string | null;
}

export interface ConverterLeadResult {
  reserva_id: string;
  protocolo: string;
}

/**
 * Converte um lead em reserva confirmada.
 * - Gera protocolo único
 * - Cria a reserva vinculada ao lead, com dados do responsável copiados
 * - Cria N registros em participantes (1 por vaga) já vinculados à reserva,
 *   data e expedição. O primeiro participante leva o nome do responsável.
 * - Move o lead para a etapa "convertido"
 * Tudo em sequência; se falhar, lança erro e a operação para.
 */
export async function converterLeadEmReserva(
  leadId: string,
  input: ConverterLeadInput,
): Promise<ConverterLeadResult> {
  const lead = await getLead(leadId);
  if (!lead) throw new Error("Lead não encontrado.");

  const { data: reservaExistente, error: reservaExistenteErr } = await supabase
    .from("reservas")
    .select("id, protocolo")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reservaExistenteErr) throw new Error("Falha ao verificar reserva existente: " + reservaExistenteErr.message);
  if (reservaExistente) {
    if (lead.etapa_atendimento !== "reserva_pendente" && lead.etapa_atendimento !== "participante_confirmado") {
      await updateLead(leadId, { etapa_atendimento: "reserva_pendente" });
      await logActivity({ modulo: "leads", acao: "converter_lead", descricao: "Convertido em reserva pendente", metadata: { lead_id: leadId, reserva_id: reservaExistente.id } });
    }
    return { reserva_id: reservaExistente.id, protocolo: reservaExistente.protocolo };
  }

  if (input.quantidade_participantes < 1) {
    throw new Error("Quantidade de participantes deve ser pelo menos 1.");
  }
  if (input.preco_unitario < 0) {
    throw new Error("Preço unitário inválido.");
  }

  const valor_total = input.preco_unitario * input.quantidade_participantes;

  // 1) gera protocolo
  const { data: protoData, error: protoErr } = await supabase.rpc("gerar_protocolo");
  if (protoErr || !protoData) {
    throw new Error("Falha ao gerar protocolo: " + (protoErr?.message ?? "sem retorno do banco"));
  }
  const protocolo = String(protoData);

  const responsavel = {
    nome: lead.nome,
    email: lead.email ?? "",
    telefone: lead.telefone ?? "",
    cpf: lead.cpf ?? "",
    cidade: lead.cidade ?? "",
    estado: lead.estado ?? "",
  };

  // 2) cria reserva
  const { data: reservaRow, error: reservaErr } = await supabase
    .from("reservas")
    .insert({
      protocolo,
      lead_id: leadId,
      expedicao_id: input.expedicao_id,
      expedicao_nome: input.expedicao_nome,
      data_id: input.data_id,
      data_label: input.data_label,
      status: "pre_reserva_enviada",
      status_operacional: "pre_reserva",
      status_financeiro: "aguardando_pagamento",
      quantidade_participantes: input.quantidade_participantes,
      cliente_nome: lead.nome,
      cliente_email: lead.email,
      cliente_telefone: lead.telefone,
      cliente_cpf: lead.cpf,
      responsavel,
      forma_pagamento: input.forma_pagamento ?? null,
      valor_total,
      observacoes_internas: input.observacoes ?? null,
    } as never)
    .select("id, protocolo")
    .maybeSingle();
  if (reservaErr) throw new Error("Falha ao criar reserva: " + reservaErr.message);
  if (!reservaRow) throw new Error("Reserva criada mas não retornada.");

  // 3) cria participantes (1 por vaga; primeiro herda o nome do responsável)
  const participantesPayload = Array.from({ length: input.quantidade_participantes }).map(
    (_, i) => ({
      reserva_id: reservaRow.id,
      expedicao_id: input.expedicao_id,
      data_id: input.data_id,
      nome: i === 0 ? lead.nome : "(preencher)",
      cpf: i === 0 ? lead.cpf : null,
      telefone: i === 0 ? lead.telefone : null,
      email: i === 0 ? lead.email : null,
      peso: i === 0 ? lead.peso : null,
      data_nascimento: i === 0 ? lead.data_nascimento : null,
      experiencia_equestre: i === 0 ? lead.experiencia_equestre : null,
      observacoes_medicas: i === 0 ? lead.observacoes_medicas : null,
      restricoes_alimentares: i === 0 ? lead.restricoes_alimentares : null,
      status: "pendente",
    }),
  );
  const { error: partErr } = await supabase
    .from("participantes")
    .insert(participantesPayload as never);
  if (partErr) {
    // rollback manual
    await supabase.from("reservas").delete().eq("id", reservaRow.id);
    throw new Error("Falha ao criar participantes: " + partErr.message);
  }

  // 4) move lead para reserva_pendente
  await updateLead(leadId, {
    etapa_atendimento: "reserva_pendente",
  });

  // 5) registra na timeline da reserva
  await supabase.from("reserva_historico").insert({
    reserva_id: reservaRow.id,
    tipo: "criacao",
    descricao: `Reserva criada a partir do lead ${lead.protocolo ?? lead.nome}`,
    metadata: { lead_id: leadId, lead_protocolo: lead.protocolo },
  } as never);

  await logActivity({
    modulo: "leads",
    acao: "converter_lead",
    descricao: `Lead convertido em reserva ${reservaRow.protocolo}`,
    metadata: { lead_id: leadId, reserva_id: reservaRow.id },
  });

  return { reserva_id: reservaRow.id, protocolo };
}
