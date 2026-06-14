import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Clock, CircleDollarSign, Users, AlertTriangle, BookOpen } from "lucide-react";

type Props = { leadId?: string; reservaId?: string };

export function Visao360({ leadId, reservaId }: Props) {
  const tipo = reservaId ? "reserva" : "lead";
  const id = reservaId ?? leadId;

  const { data, isLoading, error } = useQuery({
    queryKey: ["visao-360", tipo, id],
    enabled: !!id,
    queryFn: async () => {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/contexto-360/v1/contexto/${tipo}?id=${id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json();
    },
  });

  if (isLoading) return <div className="admin-card h-40 animate-pulse" />;
  if (error) return <div className="admin-card p-4 text-sm text-red-300">Erro ao carregar contexto: {(error as Error).message}</div>;
  if (!data) return null;

  const r = data.resumo_executivo;
  const f = data.financeiro;
  const t = data.contexto_temporal;
  const kb: any[] = data.conhecimento_aplicavel ?? [];
  const tarefas: any[] = data.tarefas_abertas ?? [];
  const handoffs: any[] = data.handoffs_abertos ?? [];

  return (
    <div className="rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-300" />
        <div className="text-[11px] uppercase tracking-[0.18em] text-violet-200/80">
          Visão 360° Operacional — Contexto Bárbara (v{data.versao})
        </div>
      </div>

      {/* Resumo executivo */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Cliente" value={r.cliente} />
        <Card label="Expedição" value={r.expedicao} />
        <Card label="Data" value={r.data} />
        <Card label="Participantes" value={String(r.participantes)} icon={<Users className="h-3 w-3" />} />
        <Card label="Status operacional" value={r.status_operacional} />
        <Card label="Status financeiro" value={r.status_financeiro} />
        <Card label="Temperatura" value={r.temperatura} />
        <Card label="Último contato" value={r.ultimo_contato} icon={<Clock className="h-3 w-3" />} />
      </div>

      {/* Financeiro */}
      <div className="rounded-lg border border-[color:var(--admin-borda)] bg-black/20 p-4">
        <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">
          <CircleDollarSign className="h-3 w-3" /> Financeiro
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <KV k="Moeda" v={f.moeda} />
          <KV k="Total" v={`${f.moeda} ${Number(f.valor_total).toFixed(2)}`} />
          <KV k="Pago" v={`${f.moeda} ${Number(f.valor_pago).toFixed(2)}`} />
          <KV k="Saldo" v={`${f.moeda} ${Number(f.saldo_restante).toFixed(2)}`} />
        </div>
      </div>

      {/* Temporal */}
      <div className="rounded-lg border border-[color:var(--admin-borda)] bg-black/20 p-4">
        <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">
          <Clock className="h-3 w-3" /> Contexto temporal
        </div>
        <ul className="space-y-1.5 text-xs text-[color:var(--admin-cinza-1)]">
          <li>📥 Última msg recebida: {t.ultima_mensagem_recebida ? `${fmt(t.ultima_mensagem_recebida.em)} (${t.ultima_mensagem_recebida.canal})` : "—"}</li>
          <li>📤 Última msg enviada: {t.ultima_mensagem_enviada ? `${fmt(t.ultima_mensagem_enviada.em)} (${t.ultima_mensagem_enviada.canal})` : "—"}</li>
          <li>🔀 Última movimentação de etapa: {fmt(t.ultima_movimentacao_etapa)}</li>
          <li>💰 Último pagamento: {t.ultimo_pagamento ? `${f.moeda} ${t.ultimo_pagamento.valor} em ${fmt(t.ultimo_pagamento.em)}` : "—"}</li>
          <li>📋 Última tarefa criada: {t.ultima_tarefa_criada ? `${t.ultima_tarefa_criada.titulo} (${fmt(t.ultima_tarefa_criada.em)})` : "—"}</li>
        </ul>
      </div>

      {/* Pendências */}
      {(tarefas.length > 0 || handoffs.length > 0) && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wider text-amber-200">
            <AlertTriangle className="h-3 w-3" /> Pendências abertas ({tarefas.length + handoffs.length})
          </div>
          <ul className="space-y-1 text-xs text-amber-100/90">
            {handoffs.map((h) => <li key={h.id}>🚨 Handoff: {h.motivo} ({h.prioridade})</li>)}
            {tarefas.map((tr) => <li key={tr.id}>✔️ {tr.titulo} ({tr.prioridade})</li>)}
          </ul>
        </div>
      )}

      {/* KB aplicável */}
      {kb.length > 0 && (
        <div className="rounded-lg border border-[color:var(--admin-borda)] bg-black/20 p-4">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">
            <BookOpen className="h-3 w-3" /> Conhecimento aplicável ({kb.length})
          </div>
          <ul className="space-y-1 text-xs text-[color:var(--admin-cinza-1)]">
            {kb.slice(0, 8).map((k) => (
              <li key={k.id}>
                <span className="text-[color:var(--admin-dourado)]">[{k.categoria}]</span> {k.titulo}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[color:var(--admin-borda)] bg-black/20 p-3">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] mb-1">
        {icon} {label}
      </div>
      <div className="text-sm font-medium text-[color:var(--admin-cinza-1)] truncate">{value || "—"}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{k}</div>
      <div className="text-sm font-medium text-[color:var(--admin-cinza-1)]">{v}</div>
    </div>
  );
}

function fmt(iso: string | null | undefined) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return "—"; }
}
