import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Sparkles,
  CalendarCheck,
  Compass,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatDateRange } from "@/lib/format";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import { DashboardAnalytics } from "@/components/admin/dashboard-analytics";

export const Route = createFileRoute("/admin/_authenticated/")({
  component: DashboardPage,
});

type Preset = "hoje" | "semana" | "mes" | "ano" | "custom";

function rangeFor(preset: Preset, custom?: { from: string; to: string }) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  switch (preset) {
    case "hoje":
      start.setHours(0, 0, 0, 0);
      break;
    case "semana": {
      const day = (start.getDay() + 6) % 7; // segunda como início
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case "mes":
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case "ano":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      if (custom) {
        return { from: new Date(custom.from + "T00:00:00").toISOString(), to: new Date(custom.to + "T23:59:59").toISOString() };
      }
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
  }
  return { from: start.toISOString(), to: end.toISOString() };
}

async function fetchDashboard(range: { from: string; to: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const [
    leadsTotal,
    leadsQualificados,
    leadsConvertidos,
    reservasCriadas,
    leadsAbandonados,
    reservasConfirmadas,
    reservasFinanceiro,
    participantesConfirmados,
    expedicoes,
    datas,
    proximas,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).in("etapa_atendimento", ["qualificado", "pronto_reserva", "convertido"]),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).eq("etapa_atendimento", "convertido"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).eq("status", "abandonado"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).in("status_operacional", ["reserva_confirmada", "participante_confirmado"]),
    supabase.from("reservas").select("valor_total, valor_pago, saldo_restante, status_financeiro, status_pagamento, status_operacional, created_at").gte("created_at", range.from).lte("created_at", range.to),
    supabase.from("participantes").select("id", { count: "exact", head: true }).eq("status", "confirmado"),
    supabase.from("expedicoes").select("id", { count: "exact", head: true }).eq("ativo", true).eq("status", "publicado"),
    supabase.from("datas").select("vagas_disponiveis, vagas_total, preco_pix, preco_cartao, expedicoes(preco)").eq("status", "disponivel").gte("data_inicio", today),
    supabase
      .from("datas")
      .select("id, data_inicio, data_fim, vagas_disponiveis, vagas_total, expedicao_id, expedicoes(nome)")
      .eq("status", "disponivel")
      .gte("data_inicio", today)
      .order("data_inicio", { ascending: true })
      .limit(5),
  ]);

  // Faturamento previsto: soma de valor_total das reservas no período
  const receitaPrevista = (reservasFinanceiro.data ?? []).reduce(
    (s: number, r: { valor_total?: number | null }) => s + Number(r.valor_total ?? 0),
    0,
  );
  const receitaRecebida = (reservasFinanceiro.data ?? []).reduce(
    (s: number, r: { valor_total?: number | null; valor_pago?: number | null; status_pagamento?: string; status_operacional?: string }) => {
      // Se a reserva está confirmada operacionalmente, o financeiro deve contar como recebido (regra de negócio solicitada)
      if (r.status_operacional === "reserva_confirmada" || r.status_operacional === "participante_confirmado") {
        return s + Number(r.valor_total ?? 0);
      }
      return s + (r.status_pagamento === "confirmado" ? Number(r.valor_pago ?? 0) : 0);

    },
    0,
  );
  const receitaPendente = receitaPrevista - receitaRecebida;

  // Faturamento estimado das vagas restantes (50/50 Pix+Cartão)
  const faturamentoEstimadoVagas = (datas.data || []).reduce((acc, d: any) => {
    const vagas = d.vagas_disponiveis || 0;
    const pix = Number(d.preco_pix ?? d.expedicoes?.preco ?? 0);
    const cartao = Number(d.preco_cartao ?? d.preco_pix ?? d.expedicoes?.preco ?? 0);
    const metade = vagas / 2;
    return acc + metade * pix + metade * cartao;
  }, 0);

  const vagasRestantes = (datas.data || []).reduce((acc, d: any) => acc + (d.vagas_disponiveis || 0), 0);
  const vagasTotais = (datas.data || []).reduce((acc, d: any) => acc + (d.vagas_total || 0), 0);

  return {
    leadsTotal: leadsTotal.count ?? 0,
    leadsQualificados: leadsQualificados.count ?? 0,
    leadsConvertidos: leadsConvertidos.count ?? 0,
    reservasCriadas: reservasCriadas.count ?? 0,
    leadsAbandonados: leadsAbandonados.count ?? 0,
    reservasConfirmadas: reservasConfirmadas.count ?? 0,
    participantesConfirmados: participantesConfirmados.count ?? 0,
    expedicoesAtivas: expedicoes.count ?? 0,
    vagasRestantes,
    vagasTotais,
    receitaPrevista,
    receitaRecebida,
    receitaPendente,
    faturamentoEstimadoVagas,
    proximas: proximas.data || [],
  };
}

// Tendência mockada (visual). Substituída quando houver série temporal real.
const trend = [
  { m: "Jan", v: 42000 },
  { m: "Fev", v: 58000 },
  { m: "Mar", v: 71000 },
  { m: "Abr", v: 65000 },
  { m: "Mai", v: 92000 },
  { m: "Jun", v: 118000 },
  { m: "Jul", v: 134000 },
];

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "ano", label: "Ano" },
  { id: "custom", label: "Personalizado" },
];

function DashboardPage() {
  const [preset, setPreset] = useState<Preset>("mes");
  const [custom, setCustom] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  });
  const range = useMemo(() => rangeFor(preset, custom), [preset, custom]);
  const { canEdit } = useCan("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard", range.from, range.to],
    queryFn: () => fetchDashboard(range),
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Visão geral do negócio.</strong> Aqui você acompanha em tempo real quantos leads chegaram, expedições no ar, vagas restantes e o faturamento previsto. Use os filtros de período (Hoje, Semana, Mês, Ano) para focar no que importa agora.
      </AdminPageIntro>
      {/* Header + filtros */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Visão geral</p>
          <h2 className="mt-1 font-display text-[32px] leading-tight text-[color:var(--admin-cinza-1)]">Bem-vindo de volta</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`rounded-md px-3 py-1.5 text-[12px] transition ${
                preset === p.id
                  ? "bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao-deep)]"
                  : "border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/40"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" ? (
            <div className="flex items-center gap-2">
              <input type="date" className="admin-input h-8 text-[12px]" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
              <span className="text-[color:var(--admin-cinza-3)]">→</span>
              <input type="date" className="admin-input h-8 text-[12px]" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
            </div>
          ) : null}
        </div>
      </div>

      {/* KPIs operacionais — funil de vendas */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Funil no período</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Leads recebidos" value={isLoading ? "—" : String(data?.leadsTotal ?? 0)} icon={Sparkles} />
          <KPI label="Leads qualificados" value={isLoading ? "—" : String(data?.leadsQualificados ?? 0)} icon={Users} />
          <KPI label="Reservas criadas" value={isLoading ? "—" : String(data?.reservasCriadas ?? 0)} icon={CalendarCheck} />
          <KPI label="Leads abandonados" value={isLoading ? "—" : String(data?.leadsAbandonados ?? 0)} icon={Users} tone="warn" />
          <KPI label="Reservas confirmadas" value={isLoading ? "—" : String(data?.reservasConfirmadas ?? 0)} icon={Compass} />
        </div>
      </div>

      {/* KPIs receita */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Receita no período</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Receita prevista" value={isLoading ? "—" : formatBRL(data?.receitaPrevista ?? 0)} icon={TrendingUp} tone="warn" />
          <KPI label="Receita recebida" value={isLoading ? "—" : formatBRL(data?.receitaRecebida ?? 0)} icon={TrendingUp} tone="ok" />
          <KPI label="Receita pendente" value={isLoading ? "—" : formatBRL(data?.receitaPendente ?? 0)} icon={TrendingUp} tone="danger" />
          <KPI label="Participantes confirmados" value={isLoading ? "—" : String(data?.participantesConfirmados ?? 0)} icon={Users} />
        </div>
      </div>

      {/* Faturamento + próximas */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="admin-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Potencial das vagas em aberto</p>
              <h3 className="mt-1 font-display text-[26px] text-[color:var(--admin-cinza-1)]">
                {isLoading ? "—" : formatBRL(data?.faturamentoEstimadoVagas ?? 0)}
              </h3>
              <p className="mt-1 text-[12px] text-[color:var(--admin-cinza-3)]">Soma estimada das vagas restantes (50% Pix + 50% Cartão)</p>
              <p className="mt-1 text-[12px] text-[color:var(--admin-cinza-2)]">
                Vagas em aberto: <span className="text-[color:var(--admin-dourado)]">{isLoading ? "—" : `${data?.vagasRestantes ?? 0} / ${data?.vagasTotais ?? 0}`}</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--admin-borda)] px-2.5 py-1 text-[11px] text-[color:var(--admin-cinza-2)]">
              <TrendingUp className="h-3 w-3" strokeWidth={2} /> tendência ilustrativa
            </span>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.095 78)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.78 0.095 78)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.012 240)", border: "1px solid oklch(0.28 0.018 220 / 0.6)", borderRadius: 8, fontSize: 12, color: "oklch(0.95 0.005 240)" }}
                  formatter={(v: number) => formatBRL(v)}
                  labelStyle={{ color: "oklch(0.72 0.012 240)" }}
                />
                <Area type="monotone" dataKey="v" stroke="oklch(0.85 0.11 80)" strokeWidth={2} fill="url(#goldGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Próximas expedições</p>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-[color:var(--admin-petroleo)]/40 animate-pulse" />)
            ) : (data?.proximas?.length ?? 0) === 0 ? (
              <p className="text-[12px] text-[color:var(--admin-cinza-3)]">Nenhuma data próxima.</p>
            ) : (
              data!.proximas.map((d: any) => {
                const ocupadas = (d.vagas_total ?? 0) - (d.vagas_disponiveis ?? 0);
                const total = d.vagas_total ?? 0;
                const pct = total ? (ocupadas / total) * 100 : 0;
                return (
                  <div
                    key={d.id}
                    className="rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-3 hover:border-[color:var(--admin-dourado)]/40 transition-colors"
                  >
                    <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">
                      {d.expedicoes?.nome ?? "Expedição"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[color:var(--admin-cinza-3)]">
                      {formatDateRange(d.data_inicio, d.data_fim)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--admin-borda)]">
                        <div className="h-full bg-gradient-to-r from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-[color:var(--admin-cinza-2)] tabular-nums">
                        {ocupadas}/{total} vagas
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] text-[color:var(--admin-cinza-3)]">
                      {d.vagas_disponiveis} {d.vagas_disponiveis === 1 ? "vaga restante" : "vagas restantes"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Analytics próprio */}
      <DashboardAnalytics range={range} />
    </div>
  );
}

function KPI({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Sparkles; tone?: "ok" | "warn" | "danger" }) {
  const iconColor = 
    tone === "ok" ? "text-emerald-400" : 
    tone === "warn" ? "text-amber-400" : 
    tone === "danger" ? "text-rose-400" : 
    "text-[color:var(--admin-dourado)]";
  
  const valueColor = 
    tone === "ok" ? "text-emerald-400" : 
    tone === "warn" ? "text-amber-400" : 
    tone === "danger" ? "text-rose-400" : 
    "text-[color:var(--admin-cinza-1)]";

  return (
    <div className="admin-card p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--admin-carvao-deep)]/70 ${iconColor} ring-1 ring-[color:var(--admin-borda)]`}>
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </div>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[color:var(--admin-cinza-3)]">
          <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
        </span>
      </div>
      <div className={`mt-4 font-display text-[32px] leading-none ${valueColor}`}>{value}</div>
      <div className="mt-1.5 text-[12px] text-[color:var(--admin-cinza-3)]">{label}</div>
    </div>
  );
}
