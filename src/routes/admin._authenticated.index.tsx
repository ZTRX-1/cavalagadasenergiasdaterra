import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Sparkles,
  CalendarCheck,
  Compass,
  Users,
  UserX,
  TrendingUp,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  Clock,
  ArrowRight,
} from "lucide-react";
// Recharts removido do dashboard: o gráfico hardcoded `trend` não era renderizado;
// quando voltar, importar lazy de um componente isolado para não inflar o bundle inicial.
import { supabase } from "@/integrations/supabase/client";
import { formatDateRange } from "@/lib/format";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import { DashboardAnalytics } from "@/components/admin/dashboard-analytics";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { CentralOperacional } from "@/components/admin/central-operacional";


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
    participantes,
    expedicoes,
    datas,
    proximas,
    alertasReservas,
  ] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).neq("status", "abandonado"),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).in("etapa_atendimento", ["qualificado", "proposta_enviada", "reserva_pendente", "participante_confirmado", "convertido", "concluido"]),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).in("etapa_atendimento", ["reserva_pendente", "participante_confirmado", "convertido", "concluido"]),
    supabase.from("reservas").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).eq("status", "abandonado"),
    supabase.from("reservas").select("id", { count: "exact", head: true }).gte("created_at", range.from).lte("created_at", range.to).in("status_operacional", ["reserva_confirmada", "participante_confirmado"]),
    supabase.from("reservas").select("valor_total, valor_pago, saldo_restante, status_financeiro, status_pagamento, status_operacional, moeda, created_at").gte("created_at", range.from).lte("created_at", range.to),
    supabase.from("participantes").select("id, cpf, peso, ficha_medica_enviada").eq("status", "confirmado"),
    supabase.from("expedicoes").select("id", { count: "exact", head: true }).eq("ativo", true).eq("status", "publicado"),
    supabase.from("datas").select("vagas_disponiveis, vagas_total, preco_pix, preco_cartao, expedicoes(preco, moeda)").eq("status", "disponivel").gte("data_inicio", today),
    supabase
      .from("datas")
      .select("id, data_inicio, data_fim, vagas_disponiveis, vagas_total, expedicao_id, expedicoes(nome)")
      .eq("status", "disponivel")
      .gte("data_inicio", today)
      .order("data_inicio", { ascending: true })
      .limit(5),
    supabase.from("reservas").select("id, protocolo, cliente_nome, status_operacional, status_financeiro, contrato_assinado").in("status_operacional", ["pre_reserva", "reserva_confirmada"]).limit(10),
  ]);

  // Faturamento multimoeda
  const receitas = (reservasFinanceiro.data ?? []).reduce(
    (acc: any, r) => {
      const moeda = r.moeda || "BRL";
      if (!acc[moeda]) acc[moeda] = { prevista: 0, recebida: 0 };
      
      acc[moeda].prevista += Number(r.valor_total ?? 0);
      
      if (
        r.status_operacional === "reserva_confirmada" || 
        r.status_operacional === "participante_confirmado" ||
        r.status_pagamento === "confirmado"
      ) {
        acc[moeda].recebida += Number(r.valor_total ?? 0);
      } else {
        acc[moeda].recebida += Number(r.valor_pago ?? 0);
      }
      return acc;
    },
    {} as Record<string, { prevista: number; recebida: number }>
  );

  // Alertas operacionais
  const participantesIncompletos = (participantes.data ?? []).filter(p => !p.cpf || !p.peso || !p.ficha_medica_enviada).length;
  const pagamentosPendentes = (reservasFinanceiro.data ?? []).filter(r => r.status_financeiro === "aguardando_pagamento" || r.status_financeiro === "parcialmente_pago").length;
  const contratosPendentes = (alertasReservas.data ?? []).filter(r => !r.contrato_assinado).length;

  const vagasRestantes = (datas.data || []).reduce((acc, d: any) => acc + (d.vagas_disponiveis || 0), 0);
  const vagasTotais = (datas.data || []).reduce((acc, d: any) => acc + (d.vagas_total || 0), 0);

  return {
    leadsTotal: leadsTotal.count ?? 0,
    leadsQualificados: leadsQualificados.count ?? 0,
    leadsConvertidos: leadsConvertidos.count ?? 0,
    reservasCriadas: reservasCriadas.count ?? 0,
    leadsAbandonados: leadsAbandonados.count ?? 0,
    reservasConfirmadas: reservasConfirmadas.count ?? 0,
    participantesTotal: (participantes.data ?? []).length,
    participantesIncompletos,
    pagamentosPendentes,
    contratosPendentes,
    expedicoesAtivas: expedicoes.count ?? 0,
    vagasRestantes,
    vagasTotais,
    receitas,
    proximas: proximas.data || [],
    alertasOperacionais: alertasReservas.data || [],
  };
}

const _trendPlaceholder = [
  { m: "Jan", v: 42000 }, { m: "Fev", v: 58000 }, { m: "Mar", v: 71000 },
  { m: "Abr", v: 65000 }, { m: "Mai", v: 92000 }, { m: "Jun", v: 118000 }, { m: "Jul", v: 134000 },
];
void _trendPlaceholder;

function formatCurrency(n: number, currency: string = "BRL") {
  return n.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
}

const PRESETS: { id: Preset; label: string }[] = [
  { id: "hoje", label: "Hoje" }, { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" }, { id: "ano", label: "Ano" }, { id: "custom", label: "Personalizado" },
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
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      
      {/* Central Operacional — filas acionáveis sempre no topo */}
      <CentralOperacional />

      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[color:var(--admin-borda)] pt-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Visão analítica</p>
          <h2 className="mt-1 font-display text-[28px] leading-tight text-[color:var(--admin-cinza-1)]">Status do negócio</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] transition",
                preset === p.id
                  ? "bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao-deep)]"
                  : "border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>


      {/* Alertas Operacionais - Ações Pendentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard 
          label="Pagamentos Pendentes" 
          value={isLoading ? "—" : String(data?.pagamentosPendentes ?? 0)} 
          icon={Clock} 
          tone="warn"
          desc="Reservas aguardando sinal ou parcelas"
        />
        <ActionCard 
          label="Documentos Pendentes" 
          value={isLoading ? "—" : String(data?.contratosPendentes ?? 0)} 
          icon={FileText} 
          tone="danger"
          desc="Contratos não assinados ou anexos"
        />
        <ActionCard 
          label="Participantes Incompletos" 
          value={isLoading ? "—" : String(data?.participantesIncompletos ?? 0)} 
          icon={AlertTriangle} 
          tone="warn"
          desc="Sem peso, CPF ou ficha médica"
        />
      </div>

      {/* Receita Multimoeda */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)] ml-1">Receita Confirmada / Prevista</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CurrencyCard label="Faturamento BRL" data={data?.receitas?.["BRL"]} currency="BRL" isLoading={isLoading} />
          <CurrencyCard label="Faturamento USD" data={data?.receitas?.["USD"]} currency="USD" isLoading={isLoading} />
          <CurrencyCard label="Faturamento EUR" data={data?.receitas?.["EUR"]} currency="EUR" isLoading={isLoading} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Funil de Vendas */}
          <div className="admin-card p-6">
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] mb-4">Funil de Atendimento</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MiniStat label="Novos Leads" value={data?.leadsTotal} icon={Sparkles} />
              <MiniStat label="Qualificados" value={data?.leadsQualificados} icon={Users} />
              <MiniStat label="Reservas" value={data?.reservasCriadas} icon={CalendarCheck} />
              <MiniStat label="Confirmadas" value={data?.reservasConfirmadas} icon={Compass} tone="ok" />
            </div>
          </div>

          {/* Próximas Expedições e Vagas */}
          <div className="admin-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Ocupação das Próximas Saídas</h3>
              <div className="text-[11px] text-[color:var(--admin-cinza-2)]">
                Vagas totais: <span className="text-[color:var(--admin-dourado)]">{data?.vagasRestantes} / {data?.vagasTotais} livres</span>
              </div>
            </div>
            <div className="space-y-4">
              {isLoading ? <p>Carregando...</p> : data?.proximas.map((d: any) => (
                <div key={d.id} className="group rounded-lg border border-[color:var(--admin-borda)]/60 bg-[color:var(--admin-carvao-deep)]/40 p-4 transition-all hover:border-[color:var(--admin-dourado)]/30">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">{d.expedicoes?.nome}</div>
                      <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{formatDateRange(d.data_inicio, d.data_fim)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-[color:var(--admin-dourado)]">{d.vagas_total - d.vagas_disponiveis} / {d.vagas_total} ocupadas</div>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[color:var(--admin-borda)] overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)] transition-all duration-500" 
                      style={{ width: `${((d.vagas_total - d.vagas_disponiveis) / d.vagas_total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Checklist Operacional */}
        <div className="space-y-6">
          <div className="admin-card p-6">
            <h3 className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] mb-4 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Pendências Críticas
            </h3>
            <div className="space-y-3">
              {isLoading ? <p>Carregando...</p> : (data?.alertasOperacionais ?? []).length === 0 ? (
                <p className="text-xs text-[color:var(--admin-cinza-3)] italic">Tudo em dia!</p>
              ) : data?.alertasOperacionais.map((r: any) => (
                <Link 
                  key={r.id} 
                  to="/admin/reservas/$id" 
                  params={{ id: r.id }}
                  className="block p-3 rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 hover:bg-[color:var(--admin-carvao)] transition group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-[color:var(--admin-cinza-1)] group-hover:text-[color:var(--admin-dourado)] transition-colors">{r.cliente_nome || "Reserva"}</span>
                    {!r.contrato_assinado && <FileText className="h-3 w-3 text-rose-400" />}
                  </div>
                  <div className="text-[10px] text-[color:var(--admin-cinza-3)] mt-1">{r.protocolo} · {r.status_financeiro}</div>
                </Link>
              ))}
              <Link to="/admin/reservas" className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--admin-dourado)] hover:underline">
                Ver todas as reservas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <DashboardAnalytics range={range} />
        </div>
      </div>
    </div>
  );
}

function ActionCard({ label, value, icon: Icon, tone, desc }: { label: string; value: string; icon: any; tone?: string; desc: string }) {
  return (
    <div className="admin-card p-5 border-l-4" style={{ borderLeftColor: tone === "danger" ? "rgba(244,63,94,0.5)" : tone === "warn" ? "rgba(251,191,36,0.5)" : "rgba(212,175,55,0.5)" }}>
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg bg-[color:var(--admin-carvao-deep)] p-2 ring-1 ring-[color:var(--admin-borda)]", tone === "danger" ? "text-rose-400" : tone === "warn" ? "text-amber-400" : "text-[color:var(--admin-dourado)]")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="font-display text-2xl text-[color:var(--admin-cinza-1)]">{value}</div>
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-medium text-[color:var(--admin-cinza-2)]">{label}</div>
        <div className="text-[10px] text-[color:var(--admin-cinza-3)] mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function CurrencyCard({ label, data, currency, isLoading }: { label: string; data?: { prevista: number; recebida: number }; currency: string; isLoading: boolean }) {
  const prevista = data?.prevista ?? 0;
  const recebida = data?.recebida ?? 0;
  const pct = prevista > 0 ? (recebida / prevista) * 100 : 0;

  return (
    <div className="admin-card p-5">
      <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)] mb-3">{label}</div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <div className="text-xl font-display text-emerald-400">{isLoading ? "—" : formatCurrency(recebida, currency)}</div>
          <div className="text-[10px] text-[color:var(--admin-cinza-3)]">Recebido</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-[color:var(--admin-cinza-2)]">{isLoading ? "—" : formatCurrency(prevista, currency)}</div>
          <div className="text-[10px] text-[color:var(--admin-cinza-3)]">Previsto</div>
        </div>
      </div>
      <div className="h-1 w-full rounded-full bg-[color:var(--admin-borda)] overflow-hidden">
        <div className="h-full bg-emerald-500/50" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, tone }: { label: string; value?: number; icon: any; tone?: string }) {
  return (
    <div className="flex flex-col items-center text-center p-2">
      <div className={cn("mb-2 rounded-full bg-[color:var(--admin-carvao-deep)] p-2 ring-1 ring-[color:var(--admin-borda)]", tone === "ok" ? "text-emerald-400" : "text-[color:var(--admin-cinza-3)]")}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-lg font-display text-[color:var(--admin-cinza-1)]">{value ?? 0}</div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{label}</div>
    </div>
  );
}
