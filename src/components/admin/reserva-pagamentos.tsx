import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Wallet, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import {
  TIPOS_PAGAMENTO,
  FORMAS_PAGAMENTO,
  STATUS_PAGAMENTO_NOVO,
  createPagamento,
  confirmarPagamento,
  updatePagamento,
  deletePagamento,
  situacaoPagamento,
  type Pagamento,
} from "@/lib/admin/financeiro-api";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<string, string> = {
  entrada: "Entrada",
  parcela: "Parcela",
  final: "Pagamento final",
  reembolso: "Reembolso",
  ajuste: "Ajuste",
};
const FORMA_LABEL: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  pix_parcelado: "PIX Parcelado",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};
const TONE: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  muted: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
};

function brl(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("pt-BR");
  } catch {
    return s;
  }
}

export function ReservaPagamentos({
  reservaId,
  expedicaoId,
  pagamentos,
  onChanged,
  valorTotal,
}: {
  reservaId: string;
  expedicaoId: string | null;
  pagamentos: Pagamento[];
  onChanged: () => void;
  valorTotal?: number | null;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "parcela",
    forma: "pix",
    valor: "",
    data_prevista: "",
    data_pagamento: "",
    status: "previsto",
    parcela_atual: "",
    parcela_total: "",
    observacoes: "",
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "reserva", reservaId] });
    // Pagamento mexe em receita prevista/recebida/pendente no Dashboard
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["admin", "reservas", "lista"] });
    onChanged();
  };

  const addMut = useMutation({
    mutationFn: async () => {
      const valor = Number(form.valor.replace(",", "."));
      if (!valor || valor <= 0) throw new Error("Informe um valor válido");
      await createPagamento({
        reserva_id: reservaId,
        expedicao_id: expedicaoId,
        cliente_nome: null,
        tipo: form.tipo,
        forma: form.forma,
        valor,
        parcela_atual: form.parcela_atual ? Number(form.parcela_atual) : null,
        parcela_total: form.parcela_total ? Number(form.parcela_total) : null,
        status: form.status,
        data_prevista: form.data_prevista || null,
        data_pagamento: form.data_pagamento || null,
        comprovante_url: null,
        observacoes: form.observacoes || null,
      });
    },
    onSuccess: () => {
      toast.success("Pagamento adicionado ao cronograma");
      setOpen(false);
      setForm({
        tipo: "parcela", forma: "pix", valor: "", data_prevista: "", data_pagamento: "",
        status: "previsto", parcela_atual: "", parcela_total: "", observacoes: "",
      });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const confirmMut = useMutation({
    mutationFn: (id: string) => confirmarPagamento(id),
    onSuccess: () => { toast.success("Pagamento confirmado"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deletePagamento(id),
    onSuccess: () => { toast.success("Removido"); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = pagamentos.reduce((s, p) => s + (p.status === "confirmado" ? Number(p.valor) : 0), 0);
  const previsto = pagamentos.reduce((s, p) => s + (p.status === "previsto" ? Number(p.valor) : 0), 0);

  return (
    <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5">
      <header className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
          <Wallet className="h-3.5 w-3.5" /> Cronograma financeiro
        </div>
        <div className="flex items-center gap-4 text-[11px] text-[color:var(--admin-cinza-3)]">
          <span>Recebido: <b className="text-emerald-300">{brl(total)}</b></span>
          <span>Previsto: <b className="text-amber-300">{brl(previsto)}</b></span>
          <button
            type="button"
            onClick={() => {
              if (!open && valorTotal && !form.valor) {
                setForm(prev => ({ ...prev, valor: String(valorTotal).replace(".", ",") }));
              }
              setOpen(!open);
            }}
            className="inline-flex items-center gap-1 text-xs text-[color:var(--admin-dourado)] hover:underline"
          >
            <Plus className="h-3 w-3" /> Adicionar pagamento
          </button>
        </div>
      </header>

      {open && (
        <div className="mb-4 grid sm:grid-cols-3 gap-3 rounded-lg border border-[color:var(--admin-borda)] p-3 bg-[color:var(--admin-carvao)]/40">
          <Field label="Tipo">
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            >
              {TIPOS_PAGAMENTO.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
            </select>
          </Field>
          <Field label="Forma">
            <select
              value={form.forma}
              onChange={(e) => setForm({ ...form, forma: e.target.value })}
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            >
              {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{FORMA_LABEL[f]}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            >
              {STATUS_PAGAMENTO_NOVO.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              placeholder="0,00"
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="Vencimento">
            <div className="relative">
              <input
                type="date"
                value={form.data_prevista}
                onChange={(e) => setForm({ ...form, data_prevista: e.target.value })}
                className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] pl-8 pr-2 py-1.5 text-sm"
              />
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
          </Field>
          <Field label="Recebido em">
            <div className="relative">
              <input
                type="date"
                value={form.data_pagamento}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm({ 
                    ...form, 
                    data_pagamento: val,
                    status: val ? "confirmado" : form.status 
                  });
                }}
                className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] pl-8 pr-2 py-1.5 text-sm"
              />
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#D4AF37]" />
            </div>
          </Field>
          <Field label="Parcela atual">
            <input
              value={form.parcela_atual}
              onChange={(e) => setForm({ ...form, parcela_atual: e.target.value })}
              placeholder="ex: 1"
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            />
          </Field>
          <Field label="De (total)">
            <input
              value={form.parcela_total}
              onChange={(e) => setForm({ ...form, parcela_total: e.target.value })}
              placeholder="ex: 3"
              className="w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
            />
          </Field>
          <div />
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Observação (opcional)"
            rows={2}
            className="sm:col-span-3 rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            disabled={addMut.isPending}
            onClick={() => addMut.mutate()}
            className="sm:col-span-3 rounded-md bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao)] px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {addMut.isPending ? "Salvando…" : "Salvar pagamento"}
          </button>
        </div>
      )}

      {pagamentos.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">
          Nenhum pagamento registrado. Adicione entrada, parcelas e pagamento final para montar o cronograma da reserva.
        </p>
      ) : (
        <ul className="divide-y divide-[color:var(--admin-borda)]">
          {pagamentos.map((p) => {
            const s = situacaoPagamento(p);
            const label = p.parcela_atual && p.parcela_total
              ? `${TIPO_LABEL[p.tipo] ?? p.tipo} ${p.parcela_atual}/${p.parcela_total}`
              : TIPO_LABEL[p.tipo] ?? p.tipo;
            return (
              <li key={p.id} className="py-3 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ring-1 uppercase tracking-[0.12em]",
                        TONE[s.tone],
                      )}
                    >
                      {s.label}
                    </span>
                    <span className="text-sm text-[color:var(--admin-cinza-1)]">{label}</span>
                    <span className="text-[11px] text-[color:var(--admin-cinza-3)]">
                      · {FORMA_LABEL[p.forma] ?? p.forma}
                    </span>
                  </div>
                  <div className="text-[11px] text-[color:var(--admin-cinza-3)] mt-1 flex gap-3 flex-wrap">
                    <span>Vence: <b className="text-[color:var(--admin-cinza-2)]">{fmtDate(p.data_prevista)}</b></span>
                    <span>Recebido: <b className="text-[color:var(--admin-cinza-2)]">{fmtDate(p.data_pagamento)}</b></span>
                    {p.observacoes && <span>· {p.observacoes}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-base text-[color:var(--admin-cinza-1)]">
                    {brl(p.valor)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.comprovante_url && (
                    <a href={p.comprovante_url} target="_blank" rel="noreferrer"
                       className="text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado)]">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  {p.status !== "confirmado" && p.tipo !== "reembolso" && (
                    <button
                      type="button"
                      onClick={() => confirmMut.mutate(p.id)}
                      className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:underline"
                      title="Confirmar recebimento"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Confirmar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { if (confirm("Excluir pagamento?")) delMut.mutate(p.id); }}
                    className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

// Re-export so the dev-server uses the noop helper to avoid the dev linter warning.
export { updatePagamento as _updatePagamento };
