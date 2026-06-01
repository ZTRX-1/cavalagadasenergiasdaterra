import { supabase } from "@/integrations/supabase/client";

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
  { id: "participante_embarcado", label: "Participante embarcado" },
  { id: "expedicao_concluida", label: "Expedição concluída" },
] as const;

export const TIPOS_PAGAMENTO = ["entrada", "parcela", "final", "reembolso", "ajuste"] as const;
export const FORMAS_PAGAMENTO = ["pix", "cartao", "transferencia", "dinheiro", "boleto"] as const;
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
  receita: number;
  despesa: number;
  lucro: number;
  margem: number;
};

export async function dreExpedicoes(range: { from: string; to: string }): Promise<DREExpedicao[]> {
  const [reservasRes, despesasRes, expedicoesRes] = await Promise.all([
    supabase
      .from("reservas")
      .select("expedicao_id, expedicao_nome, valor_pago, status_pagamento, created_at")
      .gte("created_at", range.from)
      .lte("created_at", range.to),
    supabase
      .from("despesas")
      .select("expedicao_id, valor, data")
      .gte("data", range.from.slice(0, 10))
      .lte("data", range.to.slice(0, 10)),
    supabase.from("expedicoes").select("id, nome"),
  ]);
  if (reservasRes.error) throw reservasRes.error;
  if (despesasRes.error) throw despesasRes.error;

  const nomes = new Map<string, string>();
  (expedicoesRes.data ?? []).forEach((e: { id: string; nome: string }) => nomes.set(e.id, e.nome));

  const map = new Map<string, DREExpedicao>();
  const get = (id: string | null, fallbackNome?: string) => {
    const key = id ?? "_sem_expedicao";
    if (!map.has(key)) {
      map.set(key, {
        expedicao_id: key,
        expedicao_nome: (id && nomes.get(id)) || fallbackNome || "Sem expedição",
        receita: 0,
        despesa: 0,
        lucro: 0,
        margem: 0,
      });
    }
    return map.get(key)!;
  };
  for (const r of reservasRes.data ?? []) {
    if (r.status_pagamento !== "confirmado") continue;
    const row = get(r.expedicao_id, r.expedicao_nome);
    row.receita += Number(r.valor_pago ?? 0);
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
      .select("valor_pago, created_at, status_pagamento")
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
    if (r.status_pagamento !== "confirmado") continue;
    const dia = r.created_at.slice(0, 10);
    ensure(dia).entrada += Number(r.valor_pago ?? 0);
  }
  for (const d of despesasRes.data ?? []) {
    ensure(d.data).saida += Number(d.valor ?? 0);
  }
  return Array.from(map.values())
    .sort((a, b) => a.dia.localeCompare(b.dia))
    .map((r) => ({ ...r, saldo: r.entrada - r.saida }));
}
