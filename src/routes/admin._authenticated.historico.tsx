import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Sparkles, BookOpen, Wallet, FileText, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/admin/_authenticated/historico")({
  component: HistoricoPage,
});

type Entrada = {
  tipo: "lead" | "reserva" | "pagamento" | "documento" | "status";
  titulo: string;
  descricao: string;
  data: string;
  badge?: string;
};

async function fetchHistorico(): Promise<Entrada[]> {
  const [leads, reservas, pagamentos, documentos, historico] = await Promise.all([
    supabase.from("leads").select("nome, etapa_atendimento, created_at, protocolo").order("created_at", { ascending: false }).limit(30),
    supabase.from("reservas").select("protocolo, cliente_nome, expedicao_nome, status_operacional, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("pagamentos").select("tipo, valor, forma, status, created_at, reserva_id").order("created_at", { ascending: false }).limit(30),
    supabase.from("documentos_central").select("titulo, categoria, status, created_at").order("created_at", { ascending: false }).limit(30),
    supabase.from("reserva_historico").select("tipo, descricao, created_at").order("created_at", { ascending: false }).limit(30),
  ]);

  const entradas: Entrada[] = [];
  for (const l of leads.data ?? []) {
    entradas.push({ tipo: "lead", titulo: l.nome ?? l.protocolo ?? "Lead", descricao: `Etapa: ${l.etapa_atendimento}`, data: l.created_at, badge: l.etapa_atendimento });
  }
  for (const r of reservas.data ?? []) {
    entradas.push({ tipo: "reserva", titulo: r.protocolo, descricao: `${r.cliente_nome ?? ""} — ${r.expedicao_nome}`, data: r.created_at, badge: r.status_operacional });
  }
  for (const p of pagamentos.data ?? []) {
    entradas.push({ tipo: "pagamento", titulo: `${p.tipo} (${p.forma})`, descricao: `R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, data: p.created_at, badge: p.status });
  }
  for (const d of documentos.data ?? []) {
    entradas.push({ tipo: "documento", titulo: d.titulo, descricao: `Categoria: ${d.categoria}`, data: d.created_at, badge: d.status });
  }
  for (const h of historico.data ?? []) {
    entradas.push({ tipo: "status", titulo: h.tipo, descricao: h.descricao, data: h.created_at });
  }
  return entradas.sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 100);
}

const ICONS = {
  lead: Sparkles,
  reserva: BookOpen,
  pagamento: Wallet,
  documento: FileText,
  status: RefreshCw,
};

const COLORS = {
  lead: "text-blue-300",
  reserva: "text-emerald-300",
  pagamento: "text-amber-300",
  documento: "text-purple-300",
  status: "text-[color:var(--admin-cinza-2)]",
};

function HistoricoPage() {
  const [filtro, setFiltro] = useState<"todos" | Entrada["tipo"]>("todos");
  const { data: entradas = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "historico-global"],
    queryFn: fetchHistorico,
  });

  const filtradas = filtro === "todos" ? entradas : entradas.filter((e) => e.tipo === filtro);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança"
        title="Histórico Global"
        description="Linha do tempo consolidada de leads, reservas, pagamentos, documentos e mudanças de status."
        actions={
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--admin-borda)] px-3 py-2 text-sm text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        }
      />
      <AdminPageIntro>
        Visão única do que está acontecendo na empresa. Útil para auditoria rápida e para futuras automações que precisarão
        ler eventos em ordem cronológica.
      </AdminPageIntro>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["todos", "lead", "reserva", "pagamento", "documento", "status"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-md border px-3 py-1.5 text-xs capitalize ${filtro === f ? "border-[color:var(--admin-dourado)] bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)]"}`}
          >
            {f === "todos" ? "Todos" : f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40">
        {isLoading ? (
          <div className="p-6 text-sm text-[color:var(--admin-cinza-3)]">Carregando…</div>
        ) : filtradas.length === 0 ? (
          <div className="p-6 text-sm text-[color:var(--admin-cinza-3)] flex items-center gap-2"><History className="h-4 w-4" /> Sem entradas para o filtro atual.</div>
        ) : (
          <ul className="divide-y divide-[color:var(--admin-borda)]">
            {filtradas.map((e, i) => {
              const Icon = ICONS[e.tipo];
              return (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className={`mt-0.5 ${COLORS[e.tipo]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[color:var(--admin-cinza-1)] truncate">{e.titulo}</span>
                      {e.badge ? (
                        <span className="rounded-full border border-[color:var(--admin-borda)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{e.badge}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[color:var(--admin-cinza-2)] truncate">{e.descricao}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-[color:var(--admin-cinza-3)]">
                    {new Date(e.data).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
