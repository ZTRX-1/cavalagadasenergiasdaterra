import { useQuery } from "@tanstack/react-query";
import { BarChart3, Eye, Users2, Activity } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { fetchAnalytics, type AnalyticsRange } from "@/lib/admin/analytics-api";

const COLORS = [
  "oklch(0.78 0.11 78)",
  "oklch(0.62 0.14 230)",
  "oklch(0.65 0.16 25)",
  "oklch(0.7 0.14 150)",
  "oklch(0.6 0.13 300)",
  "oklch(0.7 0.05 240)",
  "oklch(0.75 0.12 50)",
];

export function DashboardAnalytics({ range }: { range: AnalyticsRange }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", range.from, range.to],
    queryFn: () => fetchAnalytics(range),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-[color:var(--admin-carvao-deep)]/70 text-[color:var(--admin-dourado)] ring-1 ring-[color:var(--admin-borda)]">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Acessos ao site</p>
          <p className="text-[13px] text-[color:var(--admin-cinza-1)]">Quem visitou, o que viu e de onde veio</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MiniKPI label="Visitas no período" value={isLoading ? "—" : String(data?.visitas ?? 0)} icon={Eye} />
        <MiniKPI label="Sessões únicas" value={isLoading ? "—" : String(data?.sessoes ?? 0)} icon={Users2} />
        <MiniKPI
          label="Páginas/sessão"
          value={isLoading ? "—" : data?.sessoes ? ((data.visitas / data.sessoes) || 0).toFixed(1) : "0"}
          icon={Activity}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="admin-card p-5 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Visitas por dia</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.series ?? []} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <XAxis dataKey="dia" stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="oklch(0.5 0.012 240)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.012 240)", border: "1px solid oklch(0.28 0.018 220 / 0.6)", borderRadius: 8, fontSize: 12, color: "oklch(0.95 0.005 240)" }}
                />
                <Line type="monotone" dataKey="views" stroke="oklch(0.85 0.11 80)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Origem do tráfego</p>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.sources ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  {(data?.sources ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "oklch(0.13 0.012 240)", border: "1px solid oklch(0.28 0.018 220 / 0.6)", borderRadius: 8, fontSize: 12, color: "oklch(0.95 0.005 240)" }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "oklch(0.72 0.012 240)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-card p-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Páginas mais acessadas</p>
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="h-16 animate-pulse rounded bg-[color:var(--admin-petroleo)]/40" />
          ) : (data?.topPages?.length ?? 0) === 0 ? (
            <p className="text-[12px] text-[color:var(--admin-cinza-3)]">Sem visitas registradas ainda — assim que o site receber acessos, os dados aparecem aqui.</p>
          ) : (
            data!.topPages.map((p) => {
              const max = data!.topPages[0].views || 1;
              const pct = (p.views / max) * 100;
              return (
                <div key={p.path} className="rounded-md border border-[color:var(--admin-borda)] px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-mono text-[12px] text-[color:var(--admin-cinza-1)]">{p.path}</span>
                    <span className="tabular-nums text-[12px] text-[color:var(--admin-dourado)]">{p.views}</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[color:var(--admin-borda)]">
                    <div className="h-full bg-gradient-to-r from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Eye }) {
  return (
    <div className="admin-card p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--admin-carvao-deep)]/70 text-[color:var(--admin-dourado)] ring-1 ring-[color:var(--admin-borda)]">
          <Icon className="h-4 w-4" strokeWidth={1.6} />
        </div>
        <div>
          <div className="font-display text-[24px] leading-none text-[color:var(--admin-cinza-1)]">{value}</div>
          <div className="mt-1 text-[11px] text-[color:var(--admin-cinza-3)]">{label}</div>
        </div>
      </div>
    </div>
  );
}
