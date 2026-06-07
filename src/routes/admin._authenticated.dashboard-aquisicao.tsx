import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  Target, 
  Compass, 
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { listLeads, type LeadRow } from "@/lib/admin/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-section";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/_authenticated/dashboard-aquisicao")({
  component: DashboardAquisicao,
});

const COLORS = ["#D4AF37", "#8B4513", "#2F4F4F", "#708090", "#DAA520", "#A0522D"];

function DashboardAquisicao() {
  const { data: leads = [], isLoading } = useQuery({ 
    queryKey: ["admin", "leads", "analytics"], 
    queryFn: listLeads 
  });

  const [periodo, setPeriodo] = useState("30"); // dias

  const stats = useMemo(() => {
    if (!leads.length) return null;

    const agora = new Date();
    const leadsNoPeriodo = leads.filter(l => {
      const dt = new Date(l.created_at);
      const diff = (agora.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= parseInt(periodo);
    });

    // 1. Leads por Origem
    const origens: Record<string, number> = {};
    leadsNoPeriodo.forEach(l => {
      const o = l.origem || "Direto";
      origens[o] = (origens[o] || 0) + 1;
    });
    const dataOrigens = Object.entries(origens)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 2. Leads por Campanha
    const campanhas: Record<string, number> = {};
    leadsNoPeriodo.forEach(l => {
      const c = l.utm_campaign || "Orgânico / Sem Campanha";
      campanhas[c] = (campanhas[c] || 0) + 1;
    });
    const dataCampanhas = Object.entries(campanhas)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // 3. Taxa de Conversão
    const totalLeads = leadsNoPeriodo.length;
    const convertidos = leadsNoPeriodo.filter(l => l.etapa_atendimento === "convertido").length;
    const taxaConversao = totalLeads > 0 ? (convertidos / totalLeads) * 100 : 0;

    // 4. Expedições mais procuradas
    const expedicoes: Record<string, number> = {};
    leadsNoPeriodo.forEach(l => {
      const e = l.expedicao_interesse || "Não informada";
      expedicoes[e] = (expedicoes[e] || 0) + 1;
    });
    const dataExpedicoes = Object.entries(expedicoes)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 5. Evolução temporal (últimos 7 dias do período)
    const dias: Record<string, number> = {};
    leadsNoPeriodo.forEach(l => {
      const d = format(new Date(l.created_at), "dd/MM");
      dias[d] = (dias[d] || 0) + 1;
    });
    const dataEvolucao = Object.entries(dias)
      .map(([date, total]) => ({ date, total }))
      .slice(-15);

    return {
      totalLeads,
      convertidos,
      taxaConversao,
      dataOrigens,
      dataCampanhas,
      dataExpedicoes,
      dataEvolucao
    };
  }, [leads, periodo]);

  if (isLoading) return <div className="p-8 text-center text-[color:var(--admin-cinza-3)]">Carregando métricas…</div>;

  return (
    <div className="space-y-8 pb-12">
      <AdminPageHeader
        eyebrow="Marketing & Inteligência"
        title="Aquisição de Leads"
        description="Acompanhe o desempenho das suas campanhas, origens de tráfego e taxas de conversão em tempo real."
        actions={
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-[color:var(--admin-cinza-3)]" />
            <select 
              className="admin-input py-1.5 text-xs" 
              value={periodo} 
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="365">Todo o período</option>
            </select>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total de Leads" 
          value={stats?.totalLeads ?? 0} 
          icon={Users} 
          trend="+12%" 
          trendType="up" 
        />
        <KPICard 
          title="Conversões" 
          value={stats?.convertidos ?? 0} 
          icon={Target} 
          trend="+5%" 
          trendType="up" 
        />
        <KPICard 
          title="Taxa de Conversão" 
          value={`${stats?.taxaConversao.toFixed(1) ?? 0}%`} 
          icon={TrendingUp} 
          trend="-1%" 
          trendType="down" 
        />
        <KPICard 
          title="Novas Expedições" 
          value={stats?.dataExpedicoes.length ?? 0} 
          icon={Compass} 
          trend="+2" 
          trendType="up" 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evolução de Leads */}
        <div className="admin-card p-6">
          <h3 className="mb-6 font-display text-lg text-[color:var(--admin-cinza-1)] flex items-center gap-2">
            <Activity className="h-4 w-4 text-[color:var(--admin-dourado)]" />
            Evolução de Novos Leads
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.dataEvolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#121212", border: "1px solid #333", borderRadius: "8px" }}
                  itemStyle={{ color: "#D4AF37" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#D4AF37" 
                  strokeWidth={2} 
                  dot={{ fill: "#D4AF37", r: 4 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição por Origem */}
        <div className="admin-card p-6">
          <h3 className="mb-6 font-display text-lg text-[color:var(--admin-cinza-1)] flex items-center gap-2">
            <Filter className="h-4 w-4 text-[color:var(--admin-dourado)]" />
            Origens de Tráfego
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.dataOrigens}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.dataOrigens.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#121212", border: "1px solid #333", borderRadius: "8px" }}
                />
                <Legend 
                  layout="vertical" 
                  align="right" 
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: "12px", color: "#999" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Campanhas em Destaque */}
        <div className="admin-card p-6">
          <h3 className="mb-6 font-display text-lg text-[color:var(--admin-cinza-1)]">Campanhas de Marketing (UTM)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.dataCampanhas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#999" 
                  fontSize={11} 
                  width={150}
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#121212", border: "1px solid #333", borderRadius: "8px" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="value" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expedições Mais Procuradas */}
        <div className="admin-card p-6">
          <h3 className="mb-6 font-display text-lg text-[color:var(--admin-cinza-1)]">Expedições com Mais Interessados</h3>
          <div className="space-y-4">
            {stats?.dataExpedicoes.map((item, i) => (
              <div key={item.name} className="flex items-center gap-4">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--admin-petroleo)] text-sm font-medium text-[color:var(--admin-dourado)]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium text-[color:var(--admin-cinza-1)]">{item.name}</div>
                  <div className="h-1.5 w-full bg-[color:var(--admin-borda)] rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)]" 
                      style={{ width: `${(item.value / (stats?.dataExpedicoes[0].value || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-display text-[color:var(--admin-cinza-2)]">{item.value} leads</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendType 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  trend: string; 
  trendType: "up" | "down" 
}) {
  return (
    <div className="admin-card p-5 group hover:border-[color:var(--admin-dourado)]/40 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-[color:var(--admin-petroleo-soft)]/50 group-hover:bg-[color:var(--admin-dourado)]/10 transition-colors">
          <Icon className="h-5 w-5 text-[color:var(--admin-cinza-3)] group-hover:text-[color:var(--admin-dourado)] transition-colors" />
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-medium ${trendType === "up" ? "text-emerald-400" : "text-rose-400"}`}>
          {trendType === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend}
        </div>
      </div>
      <div className="text-2xl font-display text-[color:var(--admin-cinza-1)] mb-1">{value}</div>
      <div className="text-[11px] uppercase tracking-widest text-[color:var(--admin-cinza-3)]">{title}</div>
    </div>
  );
}
