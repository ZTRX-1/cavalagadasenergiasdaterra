import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  listReservasDetalhadas,
  calcularSituacaoReserva,
  STATUS_FINANCEIRO,
  STATUS_OPERACIONAL,
  type ReservaDetalhada,
} from "@/lib/admin/financeiro-api";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Search, BookOpen, ArrowRight, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/_authenticated/reservas")({
  component: ReservasPage,
});

const TONE_CLASSES: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
};

function SituacaoBadge({ tone, label }: { tone: string; label: string }) {
  const Icon =
    tone === "ok" ? CheckCircle2 : tone === "danger" ? AlertTriangle : Clock;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        TONE_CLASSES[tone] ?? TONE_CLASSES.info,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function fmtBRL(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function ReservasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reservas", "lista"],
    queryFn: listReservasDetalhadas,
  });
  const [q, setQ] = useState("");
  const [situ, setSitu] = useState<string>("");

  const rows = useMemo(() => {
    let r = data ?? [];
    if (q) {
      const t = q.toLowerCase();
      r = r.filter(
        (x) =>
          x.protocolo.toLowerCase().includes(t) ||
          (x.cliente_nome ?? "").toLowerCase().includes(t) ||
          (x.expedicao_nome ?? "").toLowerCase().includes(t),
      );
    }
    if (situ) {
      r = r.filter((x) => calcularSituacaoReserva(x).id === situ);
    }
    return r;
  }, [data, q, situ]);

  const counts = useMemo(() => {
    const c = { total: 0, confirmado: 0, pagamento_pendente: 0, contrato_pendente: 0, em_risco: 0 };
    (data ?? []).forEach((r) => {
      c.total++;
      const s = calcularSituacaoReserva(r).id as keyof typeof c;
      if (s in c) c[s]++;
    });
    return c;
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.24em]">
          <BookOpen className="h-3.5 w-3.5" /> Centro de Reservas
        </div>
        <h1 className="font-display text-2xl text-[color:var(--admin-cinza-1)]">
          Reservas
        </h1>
        <p className="text-sm text-[color:var(--admin-cinza-3)] max-w-2xl">
          Painel operacional unificado de cada reserva: timeline, resumo financeiro,
          contratos, documentos e status do cliente.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { k: "total", label: "Total" },
          { k: "confirmado", label: "Confirmadas" },
          { k: "pagamento_pendente", label: "Pagamento pendente" },
          { k: "contrato_pendente", label: "Contrato pendente" },
          { k: "em_risco", label: "Em risco" },
        ].map((kpi) => (
          <button
            key={kpi.k}
            type="button"
            onClick={() => setSitu(kpi.k === "total" ? "" : kpi.k)}
            className={cn(
              "rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/30 p-4 text-left transition hover:bg-[color:var(--admin-petroleo-soft)]/60",
              (kpi.k === "total" ? !situ : situ === kpi.k) && "ring-1 ring-[color:var(--admin-dourado)]/50",
            )}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
              {kpi.label}
            </div>
            <div className="mt-1 font-display text-2xl text-[color:var(--admin-cinza-1)]">
              {counts[kpi.k as keyof typeof counts]}
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--admin-cinza-3)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por protocolo, cliente ou expedição"
            className="w-full rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <select
          value={situ}
          onChange={(e) => setSitu(e.target.value)}
          className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-3 py-2.5 text-sm"
        >
          <option value="">Todas as situações</option>
          <option value="confirmado">Confirmado</option>
          <option value="pagamento_pendente">Pagamento pendente</option>
          <option value="contrato_pendente">Contrato pendente</option>
          <option value="em_risco">Em risco</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      <div className="admin-card admin-table-wrap p-0">
        <table className="w-full text-sm min-w-[860px]">
          <thead className="bg-[color:var(--admin-petroleo-soft)]/40 text-[color:var(--admin-cinza-3)] text-[11px] uppercase tracking-[0.18em]">
            <tr>
              <th className="text-left px-4 py-3">Protocolo</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Expedição</th>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="text-right px-4 py-3">Recebido</th>
              <th className="text-left px-4 py-3">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[color:var(--admin-cinza-3)]">
                  Carregando reservas…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[color:var(--admin-cinza-3)]">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            ) : (
              rows.map((r) => <Linha key={r.id} r={r} />)
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-[color:var(--admin-cinza-3)]">
        Status financeiro: {STATUS_FINANCEIRO.map((s) => s.label).join(" · ")} ·
        operacional: {STATUS_OPERACIONAL.map((s) => s.label).join(" · ")}
      </p>
    </div>
  );
}

function Linha({ r }: { r: ReservaDetalhada }) {
  const sit = calcularSituacaoReserva(r);
  return (
    <tr className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo-soft)]/20">
      <td className="px-4 py-3 font-mono text-xs">{r.protocolo}</td>
      <td className="px-4 py-3">
        <div className="text-[color:var(--admin-cinza-1)]">{r.cliente_nome ?? "—"}</div>
        <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{r.cliente_email ?? r.cliente_telefone ?? ""}</div>
      </td>
      <td className="px-4 py-3 text-[color:var(--admin-cinza-2)]">{r.expedicao_nome}</td>
      <td className="px-4 py-3 text-[color:var(--admin-cinza-2)]">{r.data_label}</td>
      <td className="px-4 py-3 text-right tabular-nums">{fmtBRL(r.valor_total)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-emerald-300">{fmtBRL(r.valor_pago)}</td>
      <td className="px-4 py-3">
        <SituacaoBadge tone={sit.tone} label={sit.label} />
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          to="/admin/reservas/$id"
          params={{ id: r.id }}
          className="inline-flex items-center gap-1 text-[color:var(--admin-dourado)] text-xs hover:underline"
        >
          Abrir <ArrowRight className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}
