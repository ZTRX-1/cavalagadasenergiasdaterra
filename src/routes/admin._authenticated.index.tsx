import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  CalendarCheck,
  Compass,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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

export const Route = createFileRoute("/admin/_authenticated/")({
  component: DashboardPage,
});

type KPI = {
  label: string;
  value: string;
  delta?: { value: string; up: boolean };
  icon: typeof Sparkles;
  hint?: string;
};

async function fetchDashboard() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [leadsMes, preReservas, expedicoes, datas, proximas] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", firstOfMonth),
    supabase.from("reservas").select("id", { count: "exact", head: true }).eq("status", "pre_reserva_enviada"),
    supabase.from("expedicoes").select("id", { count: "exact", head: true }).eq("ativo", true),
    supabase.from("datas").select("vagas_disponiveis, preco_pix").eq("status", "disponivel"),
    supabase
      .from("datas")
      .select("id, data_inicio, data_fim, vagas_disponiveis, vagas_total, expedicao_id, expedicoes(nome)")
      .eq("status", "disponivel")
      .gte("data_inicio", now.toISOString().slice(0, 10))
      .order("data_inicio", { ascending: true })
      .limit(5),
  ]);

  const vagasRestantes = (datas.data || []).reduce((acc, d) => acc + (d.vagas_disponiveis || 0), 0);
  const faturamentoEstimado = (datas.data || []).reduce(
    (acc, d) => acc + Number(d.preco_pix || 0) * (d.vagas_disponiveis || 0),
    0,
  );

  return {
    leadsMes: leadsMes.count ?? 0,
    preReservas: preReservas.count ?? 0,
    expedicoesAtivas: expedicoes.count ?? 0,
    vagasRestantes,
    faturamentoEstimado,
    proximas: proximas.data || [],
  };
}

// Dados mockados de tendência (substituir na etapa 2)
const trend = [
  { m: "Jan", v: 42000 },
  { m: "Fev", v: 58000 },
  { m: "Mar", v: 71000 },
  { m: "Abr", v: 65000 },
  { m: "Mai", v: 92000 },
  { m: "Jun", v: 118000 },
  { m: "Jul", v: 134000 },
];

const atividades = [
  { quando: "há 12 min", quem: "Marina S.", o_que: "iniciou pré-reserva", alvo: "Travessia da Canastra · 14/02" },
  { quando: "há 1 h", quem: "Carlos P.", o_que: "completou cadastro", alvo: "Elas na Sela · 22/03" },
  { quando: "há 3 h", quem: "Site", o_que: "novo lead via WhatsApp", alvo: "Cavalgada Sertão" },
  { quando: "ontem", quem: "Equipe", o_que: "publicou novas fotos", alvo: "Galeria Canastra" },
];

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDateRange(inicio: string, fim: string) {
  const a = new Date(inicio + "T00:00:00");
  const b = new Date(fim + "T00:00:00");
  const di = a.getDate().toString().padStart(2, "0");
  const df = b.getDate().toString().padStart(2, "0");
  const mes = a.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${di}–${df} ${mes}`;
}

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
  });

  const kpis: KPI[] = [
    {
      label: "Leads do mês",
      value: isLoading ? "—" : String(data?.leadsMes ?? 0),
      delta: { value: "+18%", up: true },
      icon: Sparkles,
    },
    {
      label: "Pré-reservas",
      value: isLoading ? "—" : String(data?.preReservas ?? 0),
      delta: { value: "+6%", up: true },
      icon: CalendarCheck,
    },
    {
      label: "Expedições ativas",
      value: isLoading ? "—" : String(data?.expedicoesAtivas ?? 0),
      delta: { value: "0%", up: true },
      icon: Compass,
    },
    {
      label: "Vagas restantes",
      value: isLoading ? "—" : String(data?.vagasRestantes ?? 0),
      delta: { value: "−4%", up: false },
      icon: Users,
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
            Visão geral
          </p>
          <h2 className="mt-1 font-display text-[32px] leading-tight text-[color:var(--admin-cinza-1)]">
            Bem-vindo de volta
          </h2>
        </div>
        <div className="text-right text-[12px] text-[color:var(--admin-cinza-3)]">
          Sincronizado · há instantes
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div
            key={kpi.label}
            className="admin-card p-5 animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-start justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--admin-carvao-deep)]/70 text-[color:var(--admin-dourado)] ring-1 ring-[color:var(--admin-borda)]">
                <kpi.icon className="h-4 w-4" strokeWidth={1.6} />
              </div>
              {kpi.delta && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
                    kpi.delta.up ? "text-[oklch(0.78_0.14_150)]" : "text-[oklch(0.72_0.15_25)]"
                  }`}
                >
                  {kpi.delta.up ? (
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" strokeWidth={2} />
                  )}
                  {kpi.delta.value}
                </span>
              )}
            </div>
            <div className="mt-4 font-display text-[32px] leading-none text-[color:var(--admin-cinza-1)]">
              {kpi.value}
            </div>
            <div className="mt-1.5 text-[12px] text-[color:var(--admin-cinza-3)]">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Linha 2 — gráfico + próximas */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="admin-card p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
                Faturamento estimado
              </p>
              <h3 className="mt-1 font-display text-[26px] text-[color:var(--admin-cinza-1)]">
                {isLoading ? "—" : formatBRL(data?.faturamentoEstimado ?? 0)}
              </h3>
              <p className="mt-1 text-[12px] text-[color:var(--admin-cinza-3)]">
                Soma das vagas disponíveis × preço Pix
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--admin-borda)] px-2.5 py-1 text-[11px] text-[color:var(--admin-cinza-2)]">
              <TrendingUp className="h-3 w-3" strokeWidth={2} />
              últimos 7 meses
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
                <XAxis
                  dataKey="m"
                  stroke="oklch(0.5 0.012 240)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="oklch(0.5 0.012 240)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.012 240)",
                    border: "1px solid oklch(0.28 0.018 220 / 0.6)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "oklch(0.95 0.005 240)",
                  }}
                  formatter={(v: number) => formatBRL(v)}
                  labelStyle={{ color: "oklch(0.72 0.012 240)" }}
                />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="oklch(0.85 0.11 80)"
                  strokeWidth={2}
                  fill="url(#goldGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
            Próximas expedições
          </p>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-[color:var(--admin-petroleo)]/40 animate-pulse" />
              ))
            ) : (data?.proximas?.length ?? 0) === 0 ? (
              <p className="text-[12px] text-[color:var(--admin-cinza-3)]">Nenhuma data próxima.</p>
            ) : (
              data!.proximas.map((d: any) => {
                const lotacao = (d.vagas_total ? (d.vagas_total - d.vagas_disponiveis) / d.vagas_total : 0) * 100;
                return (
                  <div
                    key={d.id}
                    className="group flex items-center gap-3 rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 p-3 hover:border-[color:var(--admin-dourado)]/40 transition-colors"
                  >
                    <div className="flex h-10 w-12 flex-col items-center justify-center rounded-md bg-[color:var(--admin-petroleo)] text-[color:var(--admin-dourado)] text-[10px] uppercase tracking-wider">
                      {formatDateRange(d.data_inicio, d.data_fim).split(" ").slice(-1)}
                      <span className="text-[12px] font-display leading-none text-[color:var(--admin-cinza-1)]">
                        {formatDateRange(d.data_inicio, d.data_fim).split(" ")[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">
                        {d.expedicoes?.nome ?? "Expedição"}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--admin-borda)]">
                          <div
                            className="h-full bg-gradient-to-r from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)]"
                            style={{ width: `${lotacao}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[color:var(--admin-cinza-3)]">
                          {d.vagas_disponiveis}/{d.vagas_total}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Linha 3 — atividades */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
            Últimas atividades
          </p>
          <button className="text-[11px] text-[color:var(--admin-dourado-glow)] hover:underline underline-offset-4">
            Ver tudo
          </button>
        </div>
        <ul className="mt-4 divide-y divide-[color:var(--admin-borda)]">
          {atividades.map((a, i) => (
            <li key={i} className="flex items-center gap-4 py-3">
              <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--admin-dourado)] shadow-[0_0_8px_var(--admin-dourado-glow)]" />
              <div className="flex-1 text-[13px] text-[color:var(--admin-cinza-1)]">
                <span className="font-medium">{a.quem}</span>{" "}
                <span className="text-[color:var(--admin-cinza-3)]">{a.o_que}</span>{" "}
                <span className="text-[color:var(--admin-cinza-2)]">— {a.alvo}</span>
              </div>
              <span className="text-[11px] text-[color:var(--admin-cinza-3)]">{a.quando}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-[11px] text-[color:var(--admin-cinza-3)]">
        Dados em tempo real do banco · módulos avançados nas próximas etapas
      </p>
    </div>
  );
}
