import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "./api";


export type Despesa = {
  id: string;
  data: string;
  categoria: string;
  descricao: string;
  valor: number;
  expedicao_id: string | null;
  anexo_url: string | null;
  status: string;
  fornecedor: string | null;
  observacoes: string | null;
  created_at: string;
};

export type ContaPagar = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  categoria: string | null;
  fornecedor: string | null;
  expedicao_id: string | null;
  pago_em: string | null;
  observacoes: string | null;
};

export type ContaReceber = {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
  cliente: string | null;
  reserva_id: string | null;
  recebido_em: string | null;
  observacoes: string | null;
};

export const CATEGORIAS_DESPESA = [
  "cavalos",
  "alimentacao",
  "equipe",
  "logistica",
  "marketing",
  "hospedagem",
  "transporte",
  "impostos",
  "outros",
] as const;

export const STATUS_DESPESA = ["pago", "pendente", "atrasado"] as const;
export const STATUS_CONTA = ["pendente", "pago", "atrasado", "cancelado"] as const;
export const TIPOS_CUSTO = ["fixo", "variavel", "comissao"] as const;

export const STATUS_FINANCEIRO = [
  { id: "aguardando_pagamento", label: "Aguardando pagamento" },
  { id: "entrada_paga", label: "Entrada paga" },
  { id: "parcialmente_pago", label: "Parcialmente pago" },
  { id: "pago_integralmente", label: "Pago integralmente" },
  { id: "reembolsado", label: "Reembolsado" },
  { id: "cancelado", label: "Cancelado" },
] as const;

export const STATUS_OPERACIONAL = [
  { id: "pre_reserva", label: "Pré-reserva" },
  { id: "reserva_confirmada", label: "Reserva confirmada" },
  { id: "participante_confirmado", label: "Participante confirmado" },
  { id: "expedicao_concluida", label: "Expedição concluída" },
] as const;

export const TIPOS_PAGAMENTO = ["entrada", "parcela", "final", "reembolso", "ajuste"] as const;
export const FORMAS_PAGAMENTO = ["pix", "cartao", "pix_parcelado", "transferencia", "dinheiro"] as const;
export const STATUS_PAGAMENTO_NOVO = ["previsto", "confirmado", "estornado", "cancelado"] as const;

export type Pagamento = {
  id: string;
  reserva_id: string;
  expedicao_id: string | null;
  cliente_nome: string | null;
  tipo: string;
  forma: string;
  valor: number;
  parcela_atual: number | null;
  parcela_total: number | null;
  status: string;
  data_prevista: string | null;
  data_pagamento: string | null;
  comprovante_url: string | null;
  observacoes: string | null;
  created_at: string;
};

export type ReservaHistorico = {
  id: string;
  reserva_id: string;
  tipo: string;
  descricao: string;
  valor: number | null;
  autor_nome: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ExpedicaoIndicador = {
  expedicao_id: string;
  expedicao_nome: string;
  slug: string;
  moeda: string;
  vagas_totais: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  receita_prevista: number;
  receita_recebida: number;
  valor_pendente: number;
  custos_previstos: number;
  custos_realizados: number;
  lucro_estimado: number;
  lucro_realizado: number;
  participantes_confirmados: number;
  participantes_pendentes: number;
};

// ----- Despesas
export async function listDespesas(range?: { from: string; to: string }): Promise<Despesa[]> {
  let q = supabase.from("despesas").select("*").order("data", { ascending: false });
  if (range) q = q.gte("data", range.from).lte("data", range.to);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Despesa[];
}

export async function createDespesa(input: Omit<Despesa, "id" | "created_at">) {
  const { error } = await supabase.from("despesas").insert(input);
  if (error) throw error;
}

export async function updateDespesa(id: string, patch: Partial<Despesa>) {
  const { error } = await supabase.from("despesas").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteDespesa(id: string) {
  const { error } = await supabase.from("despesas").delete().eq("id", id);
  if (error) throw error;
}

// ----- Contas a pagar
export async function listContasPagar(): Promise<ContaPagar[]> {
  const { data, error } = await supabase.from("contas_pagar").select("*").order("vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContaPagar[];
}

export async function createContaPagar(input: Omit<ContaPagar, "id">) {
  const { error } = await supabase.from("contas_pagar").insert(input);
  if (error) throw error;
}

export async function updateContaPagar(id: string, patch: Partial<ContaPagar>) {
  const { error } = await supabase.from("contas_pagar").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContaPagar(id: string) {
  const { error } = await supabase.from("contas_pagar").delete().eq("id", id);
  if (error) throw error;
}

// ----- Contas a receber
export async function listContasReceber(): Promise<ContaReceber[]> {
  const { data, error } = await supabase.from("contas_receber").select("*").order("vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContaReceber[];
}

export async function createContaReceber(input: Omit<ContaReceber, "id">) {
  const { error } = await supabase.from("contas_receber").insert(input);
  if (error) throw error;
}

export async function updateContaReceber(id: string, patch: Partial<ContaReceber>) {
  const { error } = await supabase.from("contas_receber").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContaReceber(id: string) {
  const { error } = await supabase.from("contas_receber").delete().eq("id", id);
  if (error) throw error;
}

// ----- DRE por expedição
export type DREExpedicao = {
  expedicao_id: string;
  expedicao_nome: string;
  moeda: string;
  receita: number;
  despesa: number;
  lucro: number;
  margem: number;
};

export async function dreExpedicoes(range: { from: string; to: string }): Promise<DREExpedicao[]> {
  const [reservasRes, despesasRes, expedicoesRes] = await Promise.all([
    supabase
      .from("reservas")
      .select("expedicao_id, expedicao_nome, valor_total, valor_pago, status_pagamento, status_operacional, created_at")
      .gte("created_at", range.from)
      .lte("created_at", range.to),
    supabase
      .from("despesas")
      .select("expedicao_id, valor, data")
      .gte("data", range.from.slice(0, 10))
      .lte("data", range.to.slice(0, 10)),
    supabase.from("expedicoes").select("id, nome, moeda"),
  ]);
  if (reservasRes.error) throw reservasRes.error;
  if (despesasRes.error) throw despesasRes.error;

  const expedicoesMap = new Map<string, { nome: string; moeda: string }>();
  (expedicoesRes.data ?? []).forEach((e: any) => expedicoesMap.set(e.id, { nome: e.nome, moeda: e.moeda }));

  const map = new Map<string, DREExpedicao>();
  const get = (id: string | null, fallbackNome?: string) => {
    const key = id ?? "_sem_expedicao";
    if (!map.has(key)) {
      const expInfo = id ? expedicoesMap.get(id) : null;
      map.set(key, {
        expedicao_id: key,
        expedicao_nome: expInfo?.nome || fallbackNome || "Sem expedição",
        moeda: expInfo?.moeda || "BRL",
        receita: 0,
        despesa: 0,
        lucro: 0,
        margem: 0,
      });
    }
    return map.get(key)!;
  };
  for (const r of reservasRes.data ?? []) {
    const isConfirmado = r.status_pagamento === "confirmado" || ["reserva_confirmada", "participante_confirmado"].includes(r.status_operacional);
    if (!isConfirmado) continue;
    const row = get(r.expedicao_id, r.expedicao_nome);
    row.receita += Number(isConfirmado && ["reserva_confirmada", "participante_confirmado"].includes(r.status_operacional) ? (r.valor_total ?? r.valor_pago ?? 0) : (r.valor_pago ?? 0));
  }
  for (const d of despesasRes.data ?? []) {
    const row = get(d.expedicao_id);
    row.despesa += Number(d.valor ?? 0);
  }
  return Array.from(map.values())
    .map((r) => {
      r.lucro = r.receita - r.despesa;
      r.margem = r.receita > 0 ? (r.lucro / r.receita) * 100 : 0;
      return r;
    })
    .sort((a, b) => b.lucro - a.lucro);
}

// ----- Fluxo de caixa (série temporal)
export async function fluxoCaixa(range: { from: string; to: string }) {
  const [reservasRes, despesasRes] = await Promise.all([
    supabase
      .from("reservas")
      .select("valor_total, valor_pago, created_at, status_pagamento, status_operacional")
      .gte("created_at", range.from)
      .lte("created_at", range.to),
    supabase
      .from("despesas")
      .select("valor, data")
      .gte("data", range.from.slice(0, 10))
      .lte("data", range.to.slice(0, 10)),
  ]);
  if (reservasRes.error) throw reservasRes.error;
  if (despesasRes.error) throw despesasRes.error;

  const map = new Map<string, { dia: string; entrada: number; saida: number; saldo: number }>();
  const ensure = (dia: string) => {
    if (!map.has(dia)) map.set(dia, { dia, entrada: 0, saida: 0, saldo: 0 });
    return map.get(dia)!;
  };
  for (const r of reservasRes.data ?? []) {
    const isConfirmado = r.status_pagamento === "confirmado" || ["reserva_confirmada", "participante_confirmado"].includes(r.status_operacional);
    if (!isConfirmado) continue;
    const dia = r.created_at.slice(0, 10);
    ensure(dia).entrada += Number(isConfirmado && ["reserva_confirmada", "participante_confirmado"].includes(r.status_operacional) ? (r.valor_total ?? r.valor_pago ?? 0) : (r.valor_pago ?? 0));
  }
  for (const d of despesasRes.data ?? []) {
    ensure(d.data).saida += Number(d.valor ?? 0);
  }
  return Array.from(map.values())
    .sort((a, b) => a.dia.localeCompare(b.dia))
    .map((r) => ({ ...r, saldo: r.entrada - r.saida }));
}

// ----- Pagamentos por reserva
type DB = ReturnType<typeof supabase.from> extends infer _ ? typeof supabase : never;
const sb = supabase as unknown as DB & {
  from: (t: string) => ReturnType<typeof supabase.from>;
};

export async function listPagamentosByReserva(reservaId: string): Promise<Pagamento[]> {
  const { data, error } = await sb
    .from("pagamentos")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("data_prevista", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as Pagamento[];
}

export async function createPagamento(input: Omit<Pagamento, "id" | "created_at">) {
  const { error } = await sb.from("pagamentos").insert(input as never);
  if (error) throw error;
}

export async function updatePagamento(id: string, patch: Partial<Pagamento>) {
  const { error } = await sb.from("pagamentos").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function updatePagamentoStatus(id: string, status: string) {
  const { error } = await sb.from("pagamentos").update({ status } as never).eq("id", id);
  if (error) throw error;
}

/** Confirma um pagamento previsto, marcando data de recebimento. */
export async function confirmarPagamento(id: string, dataPagamento?: string) {
  const { error } = await sb
    .from("pagamentos")
    .update({
      status: "confirmado",
      data_pagamento: dataPagamento ?? new Date().toISOString().slice(0, 10),
    } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePagamento(id: string) {
  const { error } = await sb.from("pagamentos").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Situação visível de UMA parcela/pagamento:
 *  - "pago" (confirmado)
 *  - "atrasado" (previsto + data_prevista < hoje)
 *  - "vencendo" (previsto + data_prevista <= hoje+5d)
 *  - "em_dia" (previsto + data_prevista > hoje+5d)
 *  - "estornado" / "cancelado"
 */
export function situacaoPagamento(p: Pick<Pagamento, "status" | "data_prevista">): {
  id: "pago" | "atrasado" | "vencendo" | "em_dia" | "estornado" | "cancelado" | "previsto";
  label: string;
  tone: "ok" | "warn" | "danger" | "info" | "muted";
} {
  if (p.status === "confirmado") return { id: "pago", label: "Pago", tone: "ok" };
  if (p.status === "estornado") return { id: "estornado", label: "Estornado", tone: "muted" };
  if (p.status === "cancelado") return { id: "cancelado", label: "Cancelado", tone: "muted" };
  if (!p.data_prevista) return { id: "previsto", label: "Previsto", tone: "info" };
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(p.data_prevista + "T00:00:00");
  const diffDias = Math.round((venc.getTime() - hoje.getTime()) / 86400000);
  if (diffDias < 0) return { id: "atrasado", label: "Atrasado", tone: "danger" };
  if (diffDias <= 5) return { id: "vencendo", label: "Vencendo", tone: "warn" };
  return { id: "em_dia", label: "Em dia", tone: "ok" };
}

// ----- Histórico da reserva
export async function listReservaHistorico(reservaId: string): Promise<ReservaHistorico[]> {
  const { data, error } = await sb
    .from("reserva_historico")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaHistorico[];
}

// ----- Indicadores por expedição (view)
export async function listIndicadoresExpedicoes(): Promise<ExpedicaoIndicador[]> {
  const { data: expedicoes } = await supabase.from("expedicoes").select("id, moeda");
  const moedas = new Map<string, string>();
  (expedicoes ?? []).forEach(e => moedas.set(e.id, e.moeda));

  const { data, error } = await sb
    .from("expedicao_indicadores")
    .select("*")
    .order("receita_prevista", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    const id = String(row.expedicao_id ?? "");
    return {
      expedicao_id: id,
      expedicao_nome: String(row.expedicao_nome ?? ""),
      slug: String(row.slug ?? ""),
      moeda: moedas.get(id) || "BRL",
      vagas_totais: Number(row.vagas_totais ?? 0),
      vagas_ocupadas: Number(row.vagas_ocupadas ?? 0),
      vagas_disponiveis: Number(row.vagas_disponiveis ?? 0),
      receita_prevista: Number(row.receita_prevista ?? 0),
      receita_recebida: Number(row.receita_recebida ?? 0),
      valor_pendente: Number(row.valor_pendente ?? 0),
      custos_previstos: Number(row.custos_previstos ?? 0),
      custos_realizados: Number(row.custos_realizados ?? 0),
      lucro_estimado: Number(row.lucro_estimado ?? 0),
      lucro_realizado: Number(row.lucro_realizado ?? 0),
      participantes_confirmados: Number(row.participantes_confirmados ?? 0),
      participantes_pendentes: Number(row.participantes_pendentes ?? 0),
    };
  });
}

// ----- Reservas (centro operacional)
export type ReservaDetalhada = {
  id: string;
  protocolo: string;
  expedicao_id: string | null;
  expedicao_nome: string;
  data_id: string | null;
  data_label: string;
  status: string;
  status_financeiro: string;
  status_operacional: string;
  contrato_enviado: boolean;
  contrato_assinado: boolean;
  contrato_enviado_em: string | null;
  contrato_assinado_em: string | null;
  quantidade_participantes: number;
  valor_total: number | null;
  valor_pago: number;
  saldo_restante: number | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_telefone: string | null;
  cliente_cpf: string | null;
  observacoes_internas: string | null;
  responsavel_id: string | null;
  lead_id: string | null;
  responsavel: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ReservaDocumento = {
  id: string;
  reserva_id: string;
  tipo: string;
  titulo: string;
  url: string | null;
  status: string;
  enviado_em: string | null;
  assinado_em: string | null;
  observacoes: string | null;
  created_at: string;
};

export const TIPOS_DOCUMENTO_RESERVA = [
  { id: "contrato", label: "Contrato" },
  { id: "comprovante", label: "Comprovante" },
  { id: "documento_participante", label: "Documento do participante" },
  { id: "termo", label: "Termo / Aceite" },
  { id: "outro", label: "Outro" },
] as const;

export async function listReservasDetalhadas(): Promise<ReservaDetalhada[]> {
  const { data, error } = await sb
    .from("reservas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaDetalhada[];
}

export async function getReservaDetalhada(id: string): Promise<ReservaDetalhada | null> {
  const { data, error } = await sb.from("reservas").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ReservaDetalhada) ?? null;
}

export async function deleteReserva(id: string): Promise<void> {
  const { data: res } = await supabase.from("reservas").select("protocolo").eq("id", id).maybeSingle();
  const { error } = await supabase.from("reservas").delete().eq("id", id);
  if (error) throw error;
  await logActivity({
    modulo: "reservas",
    acao: "excluir",
    descricao: res?.protocolo ?? "Reserva",
    metadata: { id },
  });
}

export async function updateReservaCampo(
  id: string,
  patch: Partial<{
    contrato_enviado: boolean;
    contrato_assinado: boolean;
    status_operacional: string;
    status_financeiro: string;
    observacoes_internas: string;
    responsavel_id: string | null;
    motivacao_viagem: string;
    observacoes_importantes: string;
    lead_id: string | null;
  }>,
) {
  const { error } = await sb.from("reservas").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function listReservaDocumentos(reservaId: string): Promise<ReservaDocumento[]> {
  const { data, error } = await sb
    .from("reserva_documentos")
    .select("*")
    .eq("reserva_id", reservaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ReservaDocumento[];
}

export async function createReservaDocumento(
  input: Omit<ReservaDocumento, "id" | "created_at">,
) {
  const { error } = await sb.from("reserva_documentos").insert(input as never);
  if (error) throw error;
}

export async function deleteReservaDocumento(id: string) {
  const { error } = await sb.from("reserva_documentos").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Situação visível da reserva — derivada dos status/contrato/pagamento.
 * Valores possíveis: "confirmado" | "pagamento_pendente" | "contrato_pendente" | "em_risco" | "concluido" | "pre_reserva"
 */
export function calcularSituacaoReserva(r: {
  status_operacional: string;
  status_financeiro: string;
  contrato_enviado: boolean;
  contrato_assinado: boolean;
  data_label?: string | null;
}): { id: string; label: string; tone: "ok" | "warn" | "danger" | "info" } {
  if (r.status_operacional === "pre_reserva") {
    return { id: "pre_reserva", label: "Pré-reserva", tone: "info" };
  }
  if (r.status_operacional === "expedicao_concluida") {
    return { id: "concluido", label: "Concluído", tone: "info" };
  }
  if (
    r.status_operacional === "reserva_confirmada" &&
    r.contrato_assinado &&
    r.status_financeiro === "pago_integralmente"
  ) {
    return { id: "confirmado", label: "Confirmado", tone: "ok" };
  }
  if (!r.contrato_enviado || (r.contrato_enviado && !r.contrato_assinado)) {
    if (
      r.status_financeiro === "aguardando_pagamento" ||
      r.status_financeiro === "parcialmente_pago"
    ) {
      // contrato pendente + pagamento pendente = risco
      if (!r.contrato_enviado && r.status_financeiro === "aguardando_pagamento") {
        return { id: "em_risco", label: "Reserva em risco", tone: "danger" };
      }
    }
    return { id: "contrato_pendente", label: "Contrato pendente", tone: "warn" };
  }
  if (
    r.status_financeiro === "aguardando_pagamento" ||
    r.status_financeiro === "parcialmente_pago" ||
    r.status_financeiro === "entrada_paga"
  ) {
    return { id: "pagamento_pendente", label: "Pagamento pendente", tone: "warn" };
  }
  return { id: "confirmado", label: "Confirmado", tone: "ok" };
}

export type TimelineItem = {
  id: string;
  at: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  fonte: "lead" | "reserva" | "pagamento" | "documento";
  valor?: number | null;
};

/** Timeline unificada da reserva: lead conversas + reserva_historico + pagamentos + documentos. */
export async function buildReservaTimeline(args: {
  reservaId: string;
  leadId?: string | null;
}): Promise<TimelineItem[]> {
  const [hist, pags, docs, conv] = await Promise.all([
    sb.from("reserva_historico").select("*").eq("reserva_id", args.reservaId),
    sb.from("pagamentos").select("*").eq("reserva_id", args.reservaId),
    sb.from("reserva_documentos").select("*").eq("reserva_id", args.reservaId),
    args.leadId
      ? sb.from("lead_conversas").select("*").eq("lead_id", args.leadId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const items: TimelineItem[] = [];

  for (const raw of (hist.data ?? []) as Array<Record<string, unknown>>) {
    items.push({
      id: `h-${raw.id}`,
      at: String(raw.created_at),
      tipo: String(raw.tipo),
      titulo: String(raw.descricao ?? raw.tipo),
      fonte: "reserva",
      valor: (raw.valor as number) ?? null,
    });
  }
  for (const raw of (pags.data ?? []) as Array<Record<string, unknown>>) {
    items.push({
      id: `p-${raw.id}`,
      at: String(raw.created_at),
      tipo: "pagamento",
      titulo: `Pagamento ${raw.tipo} (${raw.forma}) — R$ ${Number(raw.valor ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      descricao: `Status: ${raw.status}`,
      fonte: "pagamento",
      valor: (raw.valor as number) ?? null,
    });
  }
  for (const raw of (docs.data ?? []) as Array<Record<string, unknown>>) {
    items.push({
      id: `d-${raw.id}`,
      at: String(raw.created_at),
      tipo: "documento",
      titulo: `Documento: ${raw.titulo} (${raw.tipo})`,
      descricao: `Status: ${raw.status}`,
      fonte: "documento",
    });
  }
  for (const raw of (conv.data ?? []) as Array<Record<string, unknown>>) {
    items.push({
      id: `c-${raw.id}`,
      at: String(raw.created_at),
      tipo: String(raw.tipo_evento ?? "lead"),
      titulo: String(raw.conteudo ?? raw.tipo_evento ?? "Interação"),
      fonte: "lead",
    });
  }
  items.sort((a, b) => (a.at < b.at ? 1 : -1));
  return items;
}

