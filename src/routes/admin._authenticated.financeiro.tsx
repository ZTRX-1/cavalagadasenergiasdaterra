import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { Wallet, Save, Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { listReservas, updatePagamento, listExpedicoes, type ReservaRow } from "@/lib/admin/api";
import {
  listDespesas, createDespesa, updateDespesa, deleteDespesa,
  listContasPagar, createContaPagar, updateContaPagar, deleteContaPagar,
  listContasReceber, createContaReceber, updateContaReceber, deleteContaReceber,
  dreExpedicoes, fluxoCaixa, listIndicadoresExpedicoes,
  CATEGORIAS_DESPESA, STATUS_DESPESA, STATUS_CONTA, TIPOS_CUSTO,
  type Despesa, type ContaPagar, type ContaReceber, type ExpedicaoIndicador,
} from "@/lib/admin/financeiro-api";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";

// Recharts (~300KB) carregado sob demanda apenas quando a aba "Fluxo" é renderizada.
const FluxoCaixaChart = lazy(() => import("@/components/admin/fluxo-caixa-chart"));

export const Route = createFileRoute("/admin/_authenticated/financeiro")({
  component: FinanceiroPage,
});

type Preset = "mes" | "ano" | "tudo" | "custom";

function rangeFor(preset: Preset, custom: { from: string; to: string }) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  switch (preset) {
    case "mes": start.setDate(1); start.setHours(0,0,0,0); break;
    case "ano": start.setMonth(0,1); start.setHours(0,0,0,0); break;
    case "tudo": return { from: "2020-01-01T00:00:00.000Z", to: end.toISOString() };
    case "custom":
      return {
        from: new Date(custom.from + "T00:00:00").toISOString(),
        to: new Date(custom.to + "T23:59:59").toISOString(),
      };
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

const TABS = [
  { id: "expedicoes", label: "Por expedição" },
  { id: "receitas", label: "Reservas" },
  { id: "despesas", label: "Custos" },
  { id: "a-pagar", label: "A pagar" },
  { id: "a-receber", label: "A receber" },
  { id: "fluxo", label: "Fluxo de caixa" },
  { id: "dre", label: "DRE consolidado" },
] as const;
type TabId = typeof TABS[number]["id"];

import { formatPrice } from "@/lib/format";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// NUNCA somar moedas diferentes — agrega por moeda e devolve um map.
type TotaisPorMoeda = Record<string, { confirmado: number; estimado: number; pendente: number }>;
function agregarPorMoeda(reservas: ReservaRow[]): TotaisPorMoeda {
  const out: TotaisPorMoeda = {};
  for (const r of reservas) {
    const m = r.moeda || "BRL";
    if (!out[m]) out[m] = { confirmado: 0, estimado: 0, pendente: 0 };
    const isConf =
      r.status === "reserva_confirmada" ||
      r.status === "participante_confirmado" ||
      r.status_pagamento === "confirmado";
    out[m].estimado += Number(r.valor_total ?? 0);
    out[m].confirmado += isConf ? Number(r.valor_total ?? 0) : Number(r.valor_pago ?? 0);
  }
  for (const m of Object.keys(out)) out[m].pendente = out[m].estimado - out[m].confirmado;
  return out;
}


function FinanceiroPage() {
  const qc = useQueryClient();
  const { canEdit } = useCan("financeiro");
  const [preset, setPreset] = useState<Preset>("mes");
  const [custom, setCustom] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0,10),
    to: new Date().toISOString().slice(0,10),
  });
  const [tab, setTab] = useState<TabId>("expedicoes");
  const range = useMemo(() => rangeFor(preset, custom), [preset, custom]);
  const rangeDate = useMemo(() => ({ from: range.from.slice(0,10), to: range.to.slice(0,10) }), [range]);

  const { data: reservas = [] } = useQuery({ queryKey: ["admin","reservas"], queryFn: listReservas });
  const { data: despesas = [] } = useQuery({
    queryKey: ["admin","despesas", rangeDate.from, rangeDate.to],
    queryFn: () => listDespesas(rangeDate),
  });
  const { data: contasPagar = [] } = useQuery({ queryKey: ["admin","contas-pagar"], queryFn: listContasPagar });
  const { data: contasReceber = [] } = useQuery({ queryKey: ["admin","contas-receber"], queryFn: listContasReceber });

  const reservasNoPeriodo = useMemo(
    () => reservas.filter((r) => r.created_at >= range.from && r.created_at <= range.to),
    [reservas, range],
  );
  // Receitas: agrupadas por moeda (BRL, USD, EUR são independentes — nunca somadas)
  const receitasPorMoeda = useMemo(() => agregarPorMoeda(reservasNoPeriodo), [reservasNoPeriodo]);
  const moedasAtivas = Object.keys(receitasPorMoeda).length > 0 ? Object.keys(receitasPorMoeda) : ["BRL"];

  // Despesas (assumidas em BRL — toda despesa local). Não somar a receitas em moeda estrangeira.
  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0);
  const confirmadoBRL = receitasPorMoeda["BRL"]?.confirmado ?? 0;
  const lucroBRL = confirmadoBRL - totalDespesas;
  const margemBRL = confirmadoBRL > 0 ? (lucroBRL / confirmadoBRL) * 100 : 0;


  function exportCSV() {
    const lines = [
      ["tipo","data","descricao","categoria","moeda","valor"].join(";"),
      ...reservasNoPeriodo.map((r) => ["RECEITA", r.created_at.slice(0,10), r.expedicao_nome, "reserva", r.moeda || "BRL", String(r.valor_pago || 0)].join(";")),
      ...despesas.map((d) => ["DESPESA", d.data, d.descricao, d.categoria, "BRL", String(d.valor)].join(";")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financeiro_${rangeDate.from}_${rangeDate.to}.csv`; a.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Operação" title="Financeiro" description="Receitas, despesas, contas e lucro real por expedição." />
      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Controle financeiro completo.</strong> Aqui você vê <em>o que entrou</em> (reservas pagas), <em>o que saiu</em> (despesas), <em>o que está previsto</em> (contas a pagar/receber), o fluxo de caixa diário, e o <strong>lucro real de cada expedição</strong>. Use o filtro de período no topo para focar no mês, ano ou intervalo desejado.
      </AdminPageIntro>

      {/* Filtros + export */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: "mes" as const, label: "Mês" },
            { id: "ano" as const, label: "Ano" },
            { id: "tudo" as const, label: "Tudo" },
            { id: "custom" as const, label: "Personalizado" },
          ]).map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`rounded-md px-3 py-1.5 text-[12px] transition ${
                preset === p.id
                  ? "bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao-deep)]"
                  : "border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/40"
              }`}
            >{p.label}</button>
          ))}
          {preset === "custom" ? (
            <div className="flex items-center gap-2">
              <input type="date" className="admin-input h-8 text-[12px]" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              <span className="text-[color:var(--admin-cinza-3)]">→</span>
              <input type="date" className="admin-input h-8 text-[12px]" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </div>
          ) : null}
        </div>
        <button className="admin-btn-ghost gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Exportar CSV</button>
      </div>

      {/* KPIs por moeda (sem somar BRL/USD/EUR) */}
      <div className="space-y-3">
        {moedasAtivas.map((m) => {
          const r = receitasPorMoeda[m] ?? { confirmado: 0, estimado: 0, pendente: 0 };
          return (
            <div key={m} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <KPI label={`Faturamento confirmado (${m})`} value={formatPrice(r.confirmado, m)} tone="ok" />
              <KPI label={`Faturamento estimado (${m})`} value={formatPrice(r.estimado, m)} tone="warn" />
              <KPI label={`Pagamentos pendentes (${m})`} value={formatPrice(r.pendente, m)} tone="danger" />
            </div>
          );
        })}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPI label="Despesas totais (BRL)" value={fmtBRL(totalDespesas)} />
          <KPI label="Lucro líquido (BRL)" value={fmtBRL(lucroBRL)} tone={lucroBRL >= 0 ? "ok" : "danger"} />
          <KPI label="Margem BRL" value={`${margemBRL.toFixed(1)}%`} tone={margemBRL >= 0 ? "ok" : "danger"} />
        </div>
      </div>


      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[color:var(--admin-borda)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] transition ${
              tab === t.id
                ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]"
                : "border-transparent text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"
            }`}
          >{t.label}</button>
        ))}
      </div>

      {tab === "expedicoes" && <TabExpedicoes />}
      {tab === "receitas" && <TabReceitas reservas={reservasNoPeriodo} onChanged={() => qc.invalidateQueries({ queryKey: ["admin","reservas"] })} />}
      {tab === "despesas" && <TabDespesas despesas={despesas} canEdit={canEdit} onChanged={() => qc.invalidateQueries({ queryKey: ["admin","despesas"] })} />}
      {tab === "a-pagar" && <TabContasPagar contas={contasPagar} canEdit={canEdit} onChanged={() => qc.invalidateQueries({ queryKey: ["admin","contas-pagar"] })} />}
      {tab === "a-receber" && <TabContasReceber contas={contasReceber} canEdit={canEdit} onChanged={() => qc.invalidateQueries({ queryKey: ["admin","contas-receber"] })} />}
      {tab === "fluxo" && <TabFluxo range={range} />}
      {tab === "dre" && <TabDRE range={range} />}
    </div>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "danger" }) {
  const colorClass = 
    tone === "ok" ? "text-emerald-400" : 
    tone === "warn" ? "text-amber-400" : 
    tone === "danger" ? "text-rose-400" : 
    "text-[color:var(--admin-cinza-1)]";

  return (
    <div className="admin-card p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">{label}</div>
      <div className={`mt-2 font-display text-2xl lg:text-3xl ${colorClass}`}>{value}</div>
    </div>
  );
}

// ============ Tab Receitas ============
function TabReceitas({ reservas, onChanged }: { reservas: ReservaRow[]; onChanged: () => void }) {
  const [edit, setEdit] = useState<ReservaRow | null>(null);
  if (reservas.length === 0)
    return <AdminSection titulo="Reservas no período"><p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma reserva nesse período.</p></AdminSection>;
  return (
    <>
      <AdminSection titulo="Reservas no período">
        <div className="admin-table-wrap">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
              <tr>
                <th className="py-2 font-medium">Protocolo</th>
                <th className="py-2 font-medium">Expedição</th>
                <th className="py-2 font-medium">Data</th>
                <th className="py-2 font-medium">Pax</th>
                <th className="py-2 font-medium">Valor</th>
                <th className="py-2 font-medium">Pago</th>
                <th className="py-2 font-medium">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id} className="border-t border-[color:var(--admin-borda)]">
                  <td className="py-3 font-mono text-xs text-[color:var(--admin-cinza-2)]">{r.protocolo}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-1)] truncate max-w-[200px]">{r.expedicao_nome}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{r.data_label}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{r.quantidade_participantes}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{formatPrice(Number(r.valor_total ?? 0), r.moeda || "BRL")}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{formatPrice(Number(r.valor_pago), r.moeda || "BRL")}</td>

                  <td className="py-3"><StatusBadge status={r.status_pagamento} /></td>
                  <td className="py-3 text-right"><button className="admin-btn-ghost px-3 py-1" onClick={() => setEdit(r)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
      {edit ? <PagamentoDialog reserva={edit} onClose={() => setEdit(null)} onSaved={onChanged} /> : null}
    </>
  );
}

// ============ Tab Despesas ============
function TabDespesas({ despesas, canEdit, onChanged }: { despesas: Despesa[]; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<Despesa | "new" | null>(null);
  const delMut = useMutation({
    mutationFn: (id: string) => deleteDespesa(id),
    onSuccess: () => { toast.success("Despesa removida"); onChanged(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <AdminSection
        titulo="Despesas"
        actions={canEdit ? <button className="admin-btn-primary gap-2" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Nova despesa</button> : undefined}
      >
        {despesas.length === 0 ? (
          <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma despesa lançada nesse período.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                <tr>
                  <th className="py-2 font-medium">Data</th>
                  <th className="py-2 font-medium">Categoria</th>
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium">Fornecedor</th>
                  <th className="py-2 font-medium">Valor</th>
                  <th className="py-2 font-medium">Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {despesas.map((d) => (
                  <tr key={d.id} className="border-t border-[color:var(--admin-borda)]">
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{new Date(d.data).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-2)] capitalize">{d.categoria}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-1)]">{d.descricao}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-3)]">{d.fornecedor ?? "—"}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{fmtBRL(Number(d.valor))}</td>
                    <td className="py-3"><StatusBadge status={d.status} /></td>
                    <td className="py-3 text-right space-x-2">
                      {canEdit ? <button className="admin-btn-ghost px-3 py-1" onClick={() => setEditing(d)}>Editar</button> : null}
                      {canEdit ? <button className="admin-btn-ghost px-2 py-1" onClick={() => { if (confirm("Excluir despesa?")) delMut.mutate(d.id); }}><Trash2 className="h-4 w-4" /></button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
      {editing ? <DespesaDialog despesa={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={onChanged} /> : null}
    </>
  );
}

function DespesaDialog({ despesa, onClose, onSaved }: { despesa: Despesa | null; onClose: () => void; onSaved: () => void }) {
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin","expedicoes-light"], queryFn: () => listExpedicoes() });
  const [form, setForm] = useState({
    data: despesa?.data ?? new Date().toISOString().slice(0,10),
    categoria: despesa?.categoria ?? "outros",
    descricao: despesa?.descricao ?? "",
    valor: despesa?.valor ?? 0,
    expedicao_id: despesa?.expedicao_id ?? "",
    fornecedor: despesa?.fornecedor ?? "",
    status: despesa?.status ?? "pago",
    observacoes: despesa?.observacoes ?? "",
    previsto: (despesa as Despesa & { previsto?: boolean } | null)?.previsto ?? false,
    tipo_custo: (despesa as Despesa & { tipo_custo?: string } | null)?.tipo_custo ?? "variavel",
  });
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        valor: Number(form.valor),
        expedicao_id: form.expedicao_id || null,
        fornecedor: form.fornecedor || null,
        observacoes: form.observacoes || null,
        anexo_url: null,
        created_by: null,
      };
      if (despesa) await updateDespesa(despesa.id, payload as Partial<Despesa>);
      else await createDespesa(payload as Omit<Despesa,"id"|"created_at">);
    },
    onSuccess: () => { toast.success("Despesa salva"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)]">
        <DialogHeader><DialogTitle className="font-display text-2xl">{despesa ? "Editar despesa" : "Nova despesa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Data"><input type="date" className="admin-input" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></AdminField>
            <AdminField label="Valor (R$)"><input type="number" step="0.01" className="admin-input" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></AdminField>
          </div>
          <AdminField label="Descrição"><input className="admin-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Categoria">
              <select className="admin-input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </AdminField>
            <AdminField label="Status">
              <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_DESPESA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Expedição (opcional)">
              <select className="admin-input" value={form.expedicao_id} onChange={(e) => setForm({ ...form, expedicao_id: e.target.value })}>
                <option value="">— Geral —</option>
                {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </AdminField>
            <AdminField label="Fornecedor"><input className="admin-input" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Tipo de custo">
              <select className="admin-input" value={form.tipo_custo} onChange={(e) => setForm({ ...form, tipo_custo: e.target.value })}>
                {TIPOS_CUSTO.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </AdminField>
            <AdminField label="Natureza">
              <select className="admin-input" value={form.previsto ? "previsto" : "realizado"} onChange={(e) => setForm({ ...form, previsto: e.target.value === "previsto" })}>
                <option value="realizado">Já realizado</option>
                <option value="previsto">Previsto (ainda não pago)</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Observações"><textarea className="admin-input min-h-[60px]" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab Contas a Pagar ============
function TabContasPagar({ contas, canEdit, onChanged }: { contas: ContaPagar[]; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<ContaPagar | "new" | null>(null);
  const delMut = useMutation({
    mutationFn: (id: string) => deleteContaPagar(id),
    onSuccess: () => { toast.success("Conta removida"); onChanged(); },
  });
  return (
    <>
      <AdminSection
        titulo="Contas a pagar"
        actions={canEdit ? <button className="admin-btn-primary gap-2" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Nova conta</button> : undefined}
      >
        {contas.length === 0 ? <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma conta lançada.</p> : (
          <div className="admin-table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                <tr><th className="py-2 font-medium">Vencimento</th><th className="py-2 font-medium">Descrição</th><th className="py-2 font-medium">Fornecedor</th><th className="py-2 font-medium">Valor</th><th className="py-2 font-medium">Status</th><th /></tr>
              </thead>
              <tbody>
                {contas.map((c) => (
                  <tr key={c.id} className="border-t border-[color:var(--admin-borda)]">
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{new Date(c.vencimento).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-1)]">{c.descricao}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-3)]">{c.fornecedor ?? "—"}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{fmtBRL(Number(c.valor))}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-right space-x-2">
                      {canEdit ? <button className="admin-btn-ghost px-3 py-1" onClick={() => setEditing(c)}>Editar</button> : null}
                      {canEdit ? <button className="admin-btn-ghost px-2 py-1" onClick={() => { if (confirm("Excluir conta?")) delMut.mutate(c.id); }}><Trash2 className="h-4 w-4" /></button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
      {editing ? <ContaPagarDialog conta={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={onChanged} /> : null}
    </>
  );
}

function ContaPagarDialog({ conta, onClose, onSaved }: { conta: ContaPagar | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    descricao: conta?.descricao ?? "",
    valor: conta?.valor ?? 0,
    vencimento: conta?.vencimento ?? new Date().toISOString().slice(0,10),
    status: conta?.status ?? "pendente",
    categoria: conta?.categoria ?? "",
    fornecedor: conta?.fornecedor ?? "",
  });
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        valor: Number(form.valor),
        categoria: form.categoria || null,
        fornecedor: form.fornecedor || null,
        expedicao_id: null,
        pago_em: null,
        observacoes: null,
      };
      if (conta) await updateContaPagar(conta.id, payload as Partial<ContaPagar>);
      else await createContaPagar(payload as Omit<ContaPagar,"id">);
    },
    onSuccess: () => { toast.success("Conta salva"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)]">
        <DialogHeader><DialogTitle className="font-display text-2xl">{conta ? "Editar conta" : "Nova conta a pagar"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <AdminField label="Descrição"><input className="admin-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Valor (R$)"><input type="number" step="0.01" className="admin-input" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></AdminField>
            <AdminField label="Vencimento"><input type="date" className="admin-input" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Fornecedor"><input className="admin-input" value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} /></AdminField>
            <AdminField label="Status">
              <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_CONTA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </AdminField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab Contas a Receber ============
function TabContasReceber({ contas, canEdit, onChanged }: { contas: ContaReceber[]; canEdit: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState<ContaReceber | "new" | null>(null);
  const delMut = useMutation({
    mutationFn: (id: string) => deleteContaReceber(id),
    onSuccess: () => { toast.success("Conta removida"); onChanged(); },
  });
  return (
    <>
      <AdminSection
        titulo="Contas a receber (extras)"
        actions={canEdit ? <button className="admin-btn-primary gap-2" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Nova conta</button> : undefined}
      >
        <p className="mb-3 text-[12px] text-[color:var(--admin-cinza-3)]">As reservas pagas pelo site já aparecem em <strong>Receitas</strong>. Use esta lista para outros recebimentos manuais (patrocínios, serviços avulsos, etc.).</p>
        {contas.length === 0 ? <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma conta lançada.</p> : (
          <div className="admin-table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                <tr><th className="py-2 font-medium">Vencimento</th><th className="py-2 font-medium">Descrição</th><th className="py-2 font-medium">Cliente</th><th className="py-2 font-medium">Valor</th><th className="py-2 font-medium">Status</th><th /></tr>
              </thead>
              <tbody>
                {contas.map((c) => (
                  <tr key={c.id} className="border-t border-[color:var(--admin-borda)]">
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{new Date(c.vencimento).toLocaleDateString("pt-BR")}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-1)]">{c.descricao}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-3)]">{c.cliente ?? "—"}</td>
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{fmtBRL(Number(c.valor))}</td>
                    <td className="py-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3 text-right space-x-2">
                      {canEdit ? <button className="admin-btn-ghost px-3 py-1" onClick={() => setEditing(c)}>Editar</button> : null}
                      {canEdit ? <button className="admin-btn-ghost px-2 py-1" onClick={() => { if (confirm("Excluir conta?")) delMut.mutate(c.id); }}><Trash2 className="h-4 w-4" /></button> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
      {editing ? <ContaReceberDialog conta={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={onChanged} /> : null}
    </>
  );
}

function ContaReceberDialog({ conta, onClose, onSaved }: { conta: ContaReceber | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    descricao: conta?.descricao ?? "",
    valor: conta?.valor ?? 0,
    vencimento: conta?.vencimento ?? new Date().toISOString().slice(0,10),
    status: conta?.status ?? "pendente",
    cliente: conta?.cliente ?? "",
  });
  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        valor: Number(form.valor),
        cliente: form.cliente || null,
        reserva_id: null,
        recebido_em: null,
        observacoes: null,
      };
      if (conta) await updateContaReceber(conta.id, payload as Partial<ContaReceber>);
      else await createContaReceber(payload as Omit<ContaReceber,"id">);
    },
    onSuccess: () => { toast.success("Conta salva"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)]">
        <DialogHeader><DialogTitle className="font-display text-2xl">{conta ? "Editar conta" : "Nova conta a receber"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <AdminField label="Descrição"><input className="admin-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Valor (R$)"><input type="number" step="0.01" className="admin-input" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></AdminField>
            <AdminField label="Vencimento"><input type="date" className="admin-input" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Cliente"><input className="admin-input" value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></AdminField>
            <AdminField label="Status">
              <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_CONTA.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </AdminField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ Tab Fluxo ============
function TabFluxo({ range }: { range: { from: string; to: string } }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin","fluxo", range.from, range.to],
    queryFn: () => fluxoCaixa(range),
  });
  return (
    <AdminSection titulo="Fluxo de caixa diário">
      {isLoading ? (
        <div className="h-40 animate-pulse rounded bg-[color:var(--admin-petroleo)]/40" />
      ) : data.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">Sem movimento nesse período.</p>
      ) : (
        <Suspense fallback={<div className="h-[280px] animate-pulse rounded bg-[color:var(--admin-petroleo)]/40" />}>
          <FluxoCaixaChart data={data} fmtBRL={fmtBRL} />
        </Suspense>
      )}
    </AdminSection>
  );
}

// ============ Tab DRE ============
function TabDRE({ range }: { range: { from: string; to: string } }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin","dre", range.from, range.to],
    queryFn: () => dreExpedicoes(range),
  });
  return (
    <AdminSection titulo="DRE — Lucro por expedição">
      {isLoading ? <div className="h-40 animate-pulse rounded bg-[color:var(--admin-petroleo)]/40" /> : data.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">Sem dados nesse período.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
              <tr><th className="py-2 font-medium">Expedição</th><th className="py-2 font-medium">Receita</th><th className="py-2 font-medium">Despesa</th><th className="py-2 font-medium">Lucro</th><th className="py-2 font-medium">Margem</th></tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.expedicao_id} className="border-t border-[color:var(--admin-borda)]">
                  <td className="py-3 text-[color:var(--admin-cinza-1)] truncate max-w-[260px]">{r.expedicao_nome}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{fmtBRL(r.receita)}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)]">{fmtBRL(r.despesa)}</td>
                  <td className={`py-3 font-medium ${r.lucro >= 0 ? "text-[color:var(--admin-dourado)]" : "text-red-400"}`}>{fmtBRL(r.lucro)}</td>
                  <td className="py-3 text-[color:var(--admin-cinza-2)] tabular-nums">{r.margem.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminSection>
  );
}

// ============ Pagamento dialog (reservas) ============
function PagamentoDialog({ reserva, onClose, onSaved }: { reserva: ReservaRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    valor_total: reserva.valor_total ?? 0,
    valor_pago: reserva.valor_pago ?? 0,
    forma_pagamento: reserva.forma_pagamento ?? "pix",
    parcelas: reserva.parcelas ?? 1,
    status_pagamento: reserva.status_pagamento ?? "pendente",
  });
  const mut = useMutation({
    mutationFn: () => updatePagamento(reserva.id, form as never),
    onSuccess: () => { toast.success("Pagamento atualizado"); onSaved(); onClose(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)]">
        <DialogHeader><DialogTitle className="font-display text-2xl">{reserva.protocolo}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-[color:var(--admin-cinza-2)]">{reserva.expedicao_nome} · {reserva.data_label}</p>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Valor total"><input type="number" className="admin-input" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: Number(e.target.value) })} /></AdminField>
            <AdminField label="Valor pago"><input type="number" className="admin-input" value={form.valor_pago} onChange={(e) => setForm({ ...form, valor_pago: Number(e.target.value) })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Forma">
              <select className="admin-input" value={form.forma_pagamento} onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}>
                <option value="pix">Pix</option>
                <option value="cartao">Cartão</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </select>
            </AdminField>
            <AdminField label="Parcelas"><input type="number" className="admin-input" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })} /></AdminField>
          </div>
          <AdminField label="Status do pagamento">
            <select className="admin-input" value={form.status_pagamento} onChange={(e) => setForm({ ...form, status_pagamento: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="parcial">Parcial</option>
              <option value="confirmado">Confirmado</option>
            </select>
          </AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// imports usados para evitar "unused"
void Wallet;

// ============ Tab Expedições — visão consolidada =============
function TabExpedicoes() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "indicadores-expedicoes"],
    queryFn: () => listIndicadoresExpedicoes(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-[color:var(--admin-petroleo)]/40" />
        ))}
      </div>
    );
  }

  const ativos = data.filter((d) => d.vagas_totais > 0 || d.receita_prevista > 0);
  if (ativos.length === 0) {
    return (
      <AdminSection titulo="Expedições">
        <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhuma expedição com vagas ou reservas ainda.</p>
      </AdminSection>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Visão financeira por expedição.</strong> Veja para cada saída quanto você <em>vai receber</em>, quanto <em>já entrou</em>, quanto <em>falta</em>, custos e <strong>lucro real</strong>. As vagas mostram lotação por data.
      </AdminPageIntro>
      {ativos.map((e) => (
        <CardExpedicao key={e.expedicao_id} ind={e} />
      ))}
    </div>
  );
}

function CardExpedicao({ ind }: { ind: ExpedicaoIndicador }) {
  const lucroOk = ind.lucro_realizado >= 0;
  const ocup = ind.vagas_totais > 0 ? (ind.vagas_ocupadas / ind.vagas_totais) * 100 : 0;
  return (
    <div className="admin-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Expedição</div>
          <h3 className="mt-1 font-display text-xl md:text-2xl text-[color:var(--admin-cinza-1)]">{ind.expedicao_nome}</h3>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Lucro realizado</div>
          <div className={`mt-1 font-display text-xl md:text-2xl ${lucroOk ? "text-[color:var(--admin-dourado)]" : "text-red-400"}`}>
            {fmtBRL(ind.lucro_realizado)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Mini label="Receita prevista" value={fmtBRL(ind.receita_prevista)} />
        <Mini label="Receita recebida" value={fmtBRL(ind.receita_recebida)} accent />
        <Mini label="A receber" value={fmtBRL(ind.valor_pendente)} />
        <Mini label="Lucro estimado" value={fmtBRL(ind.lucro_estimado)} />
        <Mini label="Custos previstos" value={fmtBRL(ind.custos_previstos)} />
        <Mini label="Custos realizados" value={fmtBRL(ind.custos_realizados)} />
        <Mini label="Participantes confirmados" value={String(ind.participantes_confirmados)} />
        <Mini label="Participantes pendentes" value={String(ind.participantes_pendentes)} />
      </div>

      <div className="mt-5 rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/30 p-4">
        <div className="flex items-center justify-between text-[12px] text-[color:var(--admin-cinza-2)]">
          <span>
            <strong className="text-[color:var(--admin-cinza-1)]">{ind.vagas_ocupadas}</strong>
            <span className="text-[color:var(--admin-cinza-3)]"> / {ind.vagas_totais} vagas ocupadas</span>
          </span>
          <span className="text-[color:var(--admin-cinza-3)]">{ind.vagas_disponiveis} disponíveis · {ocup.toFixed(0)}% lotação</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[color:var(--admin-borda)]">
          <div
            className="h-full bg-[color:var(--admin-dourado)] transition-all"
            style={{ width: `${Math.min(ocup, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{label}</div>
      <div className={`mt-1 font-medium tabular-nums text-[14px] ${accent ? "text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-1)]"}`}>
        {value}
      </div>
    </div>
  );
}
