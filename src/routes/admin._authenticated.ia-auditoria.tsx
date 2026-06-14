import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Bot, Filter, RefreshCw } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/ia-auditoria")({
  component: IAAuditoriaPage,
});

type LinhaDiaria = { dia: string; rpc_nome: string; total: number; sucessos: number; falhas: number };
type AcaoLog = {
  id: string;
  rpc_nome: string;
  autor: string;
  ator_id: string | null;
  lead_id: string | null;
  reserva_id: string | null;
  payload: Record<string, unknown>;
  resultado: Record<string, unknown>;
  sucesso: boolean;
  motivo: string | null;
  created_at: string;
};
type Interacao = {
  id: string;
  lead_id: string | null;
  reserva_id: string | null;
  canal: string | null;
  direcao: string | null;
  modelo: string | null;
  intent: string | null;
  confidence: number | null;
  tokens_in: number | null;
  tokens_out: number | null;
  latencia_ms: number | null;
  motivo_handoff: string | null;
  created_at: string;
};

// Tipos ainda não gerados para as novas tabelas/view — cast amplo.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db: any = supabase;

async function fetchResumoDiario(): Promise<LinhaDiaria[]> {
  const { data, error } = await db.from("vw_ia_auditoria_diaria").select("*").limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as LinhaDiaria[];
}

async function fetchAcoes(filtro: { sucesso?: boolean; rpc?: string }): Promise<AcaoLog[]> {
  let q = db.from("ia_acoes_log").select("*").order("created_at", { ascending: false }).limit(100);
  if (filtro.sucesso === true) q = q.eq("sucesso", true);
  if (filtro.sucesso === false) q = q.eq("sucesso", false);
  if (filtro.rpc) q = q.eq("rpc_nome", filtro.rpc);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AcaoLog[];
}

async function fetchInteracoes(): Promise<Interacao[]> {
  const { data, error } = await db
    .from("ia_interacoes")
    .select("id,lead_id,reserva_id,canal,direcao,modelo,intent,confidence,tokens_in,tokens_out,latencia_ms,motivo_handoff,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Interacao[];
}

function IAAuditoriaPage() {
  const [filtroOk, setFiltroOk] = useState<"todos" | "sucesso" | "falha">("todos");
  const [filtroRpc, setFiltroRpc] = useState<string>("");

  const diario = useQuery({ queryKey: ["ia-aud", "diario"], queryFn: fetchResumoDiario });
  const acoes = useQuery({
    queryKey: ["ia-aud", "acoes", filtroOk, filtroRpc],
    queryFn: () =>
      fetchAcoes({
        sucesso: filtroOk === "todos" ? undefined : filtroOk === "sucesso",
        rpc: filtroRpc || undefined,
      }),
  });
  const interacoes = useQuery({ queryKey: ["ia-aud", "interacoes"], queryFn: fetchInteracoes });

  const rpcs = useMemo(() => {
    const set = new Set<string>();
    (diario.data ?? []).forEach((r) => set.add(r.rpc_nome));
    return Array.from(set).sort();
  }, [diario.data]);

  const totais = useMemo(() => {
    const linhas = diario.data ?? [];
    const t = linhas.reduce((a, l) => a + l.total, 0);
    const ok = linhas.reduce((a, l) => a + l.sucessos, 0);
    const f = linhas.reduce((a, l) => a + l.falhas, 0);
    return { t, ok, f };
  }, [diario.data]);

  const reload = () => {
    diario.refetch();
    acoes.refetch();
    interacoes.refetch();
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Governança · IA"
        title="Auditoria da Bárbara"
        description="Registro imutável de toda ação proposta ou executada pela IA — base de homologação para a Fase 3."
        actions={
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--admin-borda)] px-3 py-2 text-sm text-[color:var(--admin-cinza-1)] hover:bg-[color:var(--admin-petroleo-soft)]/40"
          >
            <RefreshCw className="h-4 w-4" /> Atualizar
          </button>
        }
      />

      <AdminPageIntro>
        Esta tela mostra apenas dados de auditoria — não executa ações. Toda RPC <code>ia_*</code> grava aqui
        seu payload, resultado e motivo de falha. <code>ia_interacoes</code> é imutável (somente leitura/inserção).
      </AdminPageIntro>

      {/* Cards de resumo */}
      <div className="grid gap-3 sm:grid-cols-3 mb-4">
        <KpiCard icon={Activity} label="Ações totais (200d mais recentes)" value={totais.t} tone="neutro" />
        <KpiCard icon={CheckCircle2} label="Sucessos" value={totais.ok} tone="ok" />
        <KpiCard icon={AlertTriangle} label="Falhas" value={totais.f} tone={totais.f > 0 ? "alerta" : "neutro"} />
      </div>

      {/* Resumo diário */}
      <Section title="Resumo por dia / RPC">
        <div className="admin-table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--admin-cinza-3)]">
                <Th>Dia</Th><Th>RPC</Th><Th>Total</Th><Th>Sucesso</Th><Th>Falha</Th>
              </tr>
            </thead>
            <tbody>
              {(diario.data ?? []).map((r, i) => (
                <tr key={i} className="border-t border-[color:var(--admin-borda)]">
                  <Td>{r.dia}</Td>
                  <Td className="font-mono text-xs">{r.rpc_nome}</Td>
                  <Td>{r.total}</Td>
                  <Td className="text-emerald-400">{r.sucessos}</Td>
                  <Td className={r.falhas > 0 ? "text-red-400" : ""}>{r.falhas}</Td>
                </tr>
              ))}
              {diario.data && diario.data.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-[color:var(--admin-cinza-3)] text-sm">Sem registros ainda.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Filtros + log de ações */}
      <Section
        title="Log detalhado de ações"
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-[color:var(--admin-cinza-3)]" />
            <select
              value={filtroOk}
              onChange={(e) => setFiltroOk(e.target.value as "todos" | "sucesso" | "falha")}
              className="admin-input h-8 px-2 text-xs"
            >
              <option value="todos">Todas</option>
              <option value="sucesso">Sucesso</option>
              <option value="falha">Falha</option>
            </select>
            <select
              value={filtroRpc}
              onChange={(e) => setFiltroRpc(e.target.value)}
              className="admin-input h-8 px-2 text-xs"
            >
              <option value="">Todas as RPCs</option>
              {rpcs.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        }
      >
        <div className="admin-table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--admin-cinza-3)]">
                <Th>Quando</Th><Th>RPC</Th><Th>Autor</Th><Th>OK</Th><Th>Motivo / Resultado</Th>
              </tr>
            </thead>
            <tbody>
              {(acoes.data ?? []).map((a) => (
                <tr key={a.id} className="border-t border-[color:var(--admin-borda)] align-top">
                  <Td className="whitespace-nowrap text-xs text-[color:var(--admin-cinza-3)]">
                    {new Date(a.created_at).toLocaleString("pt-BR")}
                  </Td>
                  <Td className="font-mono text-xs">{a.rpc_nome}</Td>
                  <Td className="text-xs">
                    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${a.autor === "ia" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "bg-[color:var(--admin-petroleo-soft)]/40 text-[color:var(--admin-cinza-1)]"}`}>
                      {a.autor === "ia" ? <Bot className="h-3 w-3" /> : null}
                      {a.autor}
                    </span>
                  </Td>
                  <Td>
                    {a.sucesso ? (
                      <span className="text-emerald-400 text-xs">✓</span>
                    ) : (
                      <span className="text-red-400 text-xs">✗</span>
                    )}
                  </Td>
                  <Td className="text-xs text-[color:var(--admin-cinza-2)] max-w-[420px]">
                    {a.motivo ? <div className="text-red-300 mb-1">{a.motivo}</div> : null}
                    <pre className="whitespace-pre-wrap break-words text-[10px] text-[color:var(--admin-cinza-3)]">{JSON.stringify(a.payload, null, 0)}</pre>
                  </Td>
                </tr>
              ))}
              {acoes.data && acoes.data.length === 0 ? (
                <tr><td colSpan={5} className="py-6 text-center text-[color:var(--admin-cinza-3)] text-sm">Sem ações registradas neste filtro.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Interações (LLM) — imutável */}
      <Section title="Interações registradas (ia_interacoes — imutável)">
        <div className="admin-table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[color:var(--admin-cinza-3)]">
                <Th>Quando</Th><Th>Canal</Th><Th>Dir.</Th><Th>Modelo</Th><Th>Intent</Th>
                <Th>Conf.</Th><Th>Tokens</Th><Th>Latência</Th><Th>Handoff</Th>
              </tr>
            </thead>
            <tbody>
              {(interacoes.data ?? []).map((i) => (
                <tr key={i.id} className="border-t border-[color:var(--admin-borda)]">
                  <Td className="whitespace-nowrap text-xs text-[color:var(--admin-cinza-3)]">{new Date(i.created_at).toLocaleString("pt-BR")}</Td>
                  <Td className="text-xs">{i.canal ?? "—"}</Td>
                  <Td className="text-xs">{i.direcao ?? "—"}</Td>
                  <Td className="font-mono text-[11px]">{i.modelo ?? "—"}</Td>
                  <Td className="text-xs">{i.intent ?? "—"}</Td>
                  <Td className="text-xs">{i.confidence != null ? (Number(i.confidence) * 100).toFixed(0) + "%" : "—"}</Td>
                  <Td className="text-xs">{[i.tokens_in, i.tokens_out].filter((x) => x != null).join(" / ") || "—"}</Td>
                  <Td className="text-xs">{i.latencia_ms != null ? `${i.latencia_ms} ms` : "—"}</Td>
                  <Td className="text-xs text-amber-300">{i.motivo_handoff ?? "—"}</Td>
                </tr>
              ))}
              {interacoes.data && interacoes.data.length === 0 ? (
                <tr><td colSpan={9} className="py-6 text-center text-[color:var(--admin-cinza-3)] text-sm">Nenhuma interação registrada ainda.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6 rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-[color:var(--admin-cinza-1)]">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: "ok" | "alerta" | "neutro" }) {
  const color =
    tone === "ok" ? "text-emerald-400"
    : tone === "alerta" ? "text-red-400"
    : "text-[color:var(--admin-dourado)]";
  return (
    <div className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/40 p-4">
      <div className="flex items-center gap-2 text-xs text-[color:var(--admin-cinza-3)]">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-xs font-medium">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
