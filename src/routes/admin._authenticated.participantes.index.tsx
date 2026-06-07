import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Users, Trash2, FileDown, Search, LayoutGrid, List, Calendar, Wallet, UserCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminField } from "@/components/admin/admin-section";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import {
  listParticipantes,
  createParticipante,
  updateParticipante,
  deleteParticipante,
  listExpedicoes,
  type ParticipanteRow,
} from "@/lib/admin/api";
import { exportarFichaGuiaPDF } from "@/lib/admin/participantes-pdf";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/admin/_authenticated/participantes/")({
  component: ParticipantesPage,
});

function calcIdade(nasc: string | null): string {
  if (!nasc) return "—";
  const d = new Date(nasc);
  const diff = Date.now() - d.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return `${age} anos`;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ----------------- Tipos auxiliares para vista agrupada -----------------

type ReservaSlim = {
  id: string;
  protocolo: string;
  cliente_nome: string | null;
  data_id: string | null;
  expedicao_id: string | null;
  data_label: string;
  expedicao_nome: string;
  valor_total: number | null;
  valor_pago: number;
  status_operacional: string;
  status_financeiro: string;
};
type DataSlim = {
  id: string;
  expedicao_id: string;
  data_inicio: string;
  data_fim: string;
  vagas_total: number;
  vagas_disponiveis: number;
  preco_pix: number | null;
  preco_cartao: number | null;
};

async function fetchReservasSlim(): Promise<ReservaSlim[]> {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, protocolo, cliente_nome, data_id, expedicao_id, data_label, expedicao_nome, valor_total, valor_pago, status_operacional, status_financeiro");
  if (error) throw error;
  return (data ?? []) as unknown as ReservaSlim[];
}
async function fetchDatasSlim(): Promise<DataSlim[]> {
  const { data, error } = await supabase
    .from("datas")
    .select("id, expedicao_id, data_inicio, data_fim, vagas_total, vagas_disponiveis, preco_pix, preco_cartao")
    .order("data_inicio", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as DataSlim[];
}

function fmtDateRange(inicio: string, fim: string) {
  try {
    const a = new Date(inicio + "T00:00:00");
    const b = new Date(fim + "T00:00:00");
    return `${a.toLocaleDateString("pt-BR")} → ${b.toLocaleDateString("pt-BR")}`;
  } catch {
    return `${inicio} → ${fim}`;
  }
}

// ----------------- Página -----------------

function ParticipantesPage() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["admin", "participantes"], queryFn: listParticipantes });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const { data: reservas = [] } = useQuery({ queryKey: ["admin", "reservas-slim"], queryFn: fetchReservasSlim });
  const { data: datas = [] } = useQuery({ queryKey: ["admin", "datas-slim"], queryFn: fetchDatasSlim });

  const [novo, setNovo] = useState(false);
  const [edit, setEdit] = useState<ParticipanteRow | null>(null);
  const [del, setDel] = useState<ParticipanteRow | null>(null);
  const [view, setView] = useState<"agrupado" | "lista">("agrupado");
  const [filtroExp, setFiltroExp] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroStatusFinanceiro, setFiltroStatusFinanceiro] = useState<string>("");
  const [apenasConfirmados, setApenasConfirmados] = useState(false);
  const [busca, setBusca] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "participantes"] });
  const { canEdit } = useCan("participantes");

  const delMut = useMutation({
    mutationFn: (id: string) => deleteParticipante(id),
    onSuccess: () => { toast.success("Removido"); refresh(); setDel(null); },
  });

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return list.filter((p) => {
      if (filtroExp && p.expedicao_id !== filtroExp) return false;
      if (filtroStatus && p.status !== filtroStatus) return false;
      if (filtroStatusFinanceiro) {
        const res = reservas.find(r => r.id === p.reserva_id);
        if (!res || res.status_financeiro !== filtroStatusFinanceiro) return false;
      }
      if (apenasConfirmados) {
        const res = reservas.find(r => r.id === p.reserva_id);
        if (!res || res.status_operacional !== "reserva_confirmada") return false;
      }
      if (q && !(p.nome ?? "").toLowerCase().includes(q) && !(p.email ?? "").toLowerCase().includes(q) && !(p.cpf ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [list, filtroExp, filtroStatus, filtroStatusFinanceiro, apenasConfirmados, busca, reservas]);

  const exportar = () => {
    if (!filtroExp) { toast.error("Selecione uma expedição para gerar a ficha do guia"); return; }
    const exp = expedicoes.find((e) => e.id === filtroExp);
    if (!exp) return;
    const confirmados = filtrados.filter((p) => p.status === "confirmado");
    const alvo = confirmados.length > 0 ? confirmados : filtrados;
    if (alvo.length === 0) { toast.error("Nenhum participante para exportar"); return; }
    exportarFichaGuiaPDF({ expedicaoNome: exp.nome, participantes: alvo });
    toast.success("PDF gerado");
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Participantes"
        description="Cavaleiros e amazonas agrupados por expedição e data, com receita e ocupação em tempo real."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden md:flex items-center rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-0.5">
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "agrupado" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("agrupado")}
              ><LayoutGrid className="h-3.5 w-3.5" /> Por expedição</button>
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "lista" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("lista")}
              ><List className="h-3.5 w-3.5" /> Lista</button>
            </div>
            <button className="admin-btn-ghost flex items-center justify-center gap-2 h-10" onClick={exportar} title="Gerar PDF com a ficha completa">
              <FileDown className="h-4 w-4 shrink-0" /> 
              <span className="whitespace-nowrap">Ficha do guia (PDF)</span>
            </button>

            <button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Novo participante</button>
          </div>
        }
      />

      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Quem vai pra cada expedição.</strong> A visão <em>Por expedição</em> mostra vagas, confirmados, pendentes e receita prevista/recebida de cada data. Participantes nascem automaticamente quando o lead vira reserva — você só precisa completar os dados (peso, CPF, restrições).
      </AdminPageIntro>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative group">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[color:var(--admin-cinza-3)] group-focus-within:text-[color:var(--admin-dourado)] transition-colors" />
            <input
              className="admin-input pl-7 w-[180px] sm:w-[240px] text-[12px] h-[38px] placeholder:text-[color:var(--admin-cinza-3)] placeholder:text-[11px]"
              placeholder="Buscar por Nome, E-mail ou CPF"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] ml-1">Filtrar Expedição</span>
          <select className="admin-input w-auto h-[38px]" value={filtroExp} onChange={(e) => setFiltroExp(e.target.value)}>
            <option value="">Todas as expedições</option>
            {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] ml-1">Status Participante</span>
          <select className="admin-input w-auto h-[38px]" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="pendente">Pendente</option>
            <option value="confirmado">Confirmado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)] ml-1">Situação Financeira</span>
          <select 
            className="admin-input w-auto h-[38px]" 
            value={filtroStatusFinanceiro} 
            onChange={(e) => setFiltroStatusFinanceiro(e.target.value)}
          >
            <option value="">Todas as situações</option>
            <option value="aguardando_pagamento">Aguardando Pagamento</option>
            <option value="parcialmente_pago">Parcialmente Pago</option>
            <option value="pago_integralmente">Pago Integralmente</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-[color:var(--admin-carvao-deep)]/40 border border-[color:var(--admin-borda)] rounded-lg px-3 py-1.5 h-[38px]">
          <input 
            type="checkbox" 
            className="accent-[color:var(--admin-dourado)]" 
            checked={apenasConfirmados} 
            onChange={(e) => setApenasConfirmados(e.target.checked)} 
          />
          <span className="text-[12px] text-[color:var(--admin-cinza-2)] whitespace-nowrap">Somente Reservas Confirmadas</span>
        </label>
        <span className="text-[11px] text-[color:var(--admin-cinza-3)] ml-auto">
          {filtrados.length} de {list.length}
        </span>
      </div>

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : filtrados.length === 0 && list.length === 0 ? (
        <AdminEmpty
          icon={Users}
          titulo="Nenhum participante ainda"
          descricao="Os participantes aparecem aqui automaticamente quando um lead vira reserva. Você também pode cadastrar manualmente."
          acao={<button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Cadastrar manualmente</button>}
        />
      ) : filtrados.length === 0 ? (
        <AdminEmpty icon={Users} titulo="Nenhum participante corresponde aos filtros" descricao="Ajuste os filtros acima ou limpe para ver todos." />
      ) : view === "agrupado" ? (
        <VistaAgrupada
          participantes={filtrados}
          reservas={reservas}
          datas={datas}
          expedicoes={expedicoes}
          onEdit={(p) => setEdit(p)}
          onDelete={(p) => setDel(p)}
        />
      ) : (
        <VistaLista
          participantes={filtrados}
          expedicoes={expedicoes}
          onEdit={(p) => setEdit(p)}
          onDelete={(p) => setDel(p)}
        />
      )}

      <ParticipanteDialog
        open={novo}
        onOpenChange={setNovo}
        expedicoes={expedicoes}
        reservas={reservas}
        onSaved={refresh}
      />
      {edit ? (
        <ParticipanteDialog
          open={!!edit}
          onOpenChange={(v) => !v && setEdit(null)}
          expedicoes={expedicoes}
          reservas={reservas}
          initial={edit}
          onSaved={refresh}
        />
      ) : null}

      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Remover participante" destructive onConfirm={() => { if (del) delMut.mutate(del.id); }} />
    </div>
  );
}

// ----------------- Vista agrupada por Expedição + Data -----------------

function VistaAgrupada({
  participantes,
  reservas,
  datas,
  expedicoes,
  onEdit,
  onDelete,
}: {
  participantes: ParticipanteRow[];
  reservas: ReservaSlim[];
  datas: DataSlim[];
  expedicoes: { id: string; nome: string }[];
  onEdit: (p: ParticipanteRow) => void;
  onDelete: (p: ParticipanteRow) => void;
}) {
  // Agrupa participantes por (expedicao_id, data_id)
  const grupos = useMemo(() => {
    // Create a map for all existing dates first
    const map = new Map<string, { expedicao_id: string | null; data_id: string | null; participantes: ParticipanteRow[] }>();
    
    // Initialize with all dates to ensure they appear even without participants
    datas.forEach(d => {
      const key = `${d.expedicao_id}|${d.id}`;
      map.set(key, { expedicao_id: d.expedicao_id, data_id: d.id, participantes: [] });
    });

    // Add participants to their respective groups
    participantes.forEach((p) => {
      const key = `${p.expedicao_id ?? "sem-exp"}|${p.data_id ?? "sem-data"}`;
      if (!map.has(key)) {
        map.set(key, { expedicao_id: p.expedicao_id, data_id: p.data_id, participantes: [] });
      }
      map.get(key)!.participantes.push(p);
    });

    return Array.from(map.values()).sort((a, b) => {
      const da = datas.find((d) => d.id === a.data_id)?.data_inicio ?? "9999-12-31";
      const db = datas.find((d) => d.id === b.data_id)?.data_inicio ?? "9999-12-31";
      return da.localeCompare(db);
    });
  }, [participantes, datas]);

  return (
    <div className="space-y-6">
      {grupos.map((g) => {
        const exp = expedicoes.find((e) => e.id === g.expedicao_id);
        const data = datas.find((d) => d.id === g.data_id);
        const reservasGrupo = reservas.filter(
          (r) => r.expedicao_id === g.expedicao_id && r.data_id === g.data_id,
        );
        const confirmados = g.participantes.filter((p) => p.status === "confirmado").length;
        const pendentes = g.participantes.filter((p) => p.status === "pendente").length;
        const vagasTotal = data?.vagas_total ?? g.participantes.length;
        const vagasDisp = data?.vagas_disponiveis ?? 0;
        const receitaPrevista = reservasGrupo.reduce((s, r) => s + Number(r.valor_total ?? 0), 0);
        const receitaRecebida = reservasGrupo.reduce((s, r) => s + Number(r.valor_pago ?? 0), 0);
        const aReceber = receitaPrevista - receitaRecebida;

        return (
          <section
            key={`${g.expedicao_id}-${g.data_id}`}
            className="admin-card overflow-hidden border-[color:var(--admin-borda-strong)]/40 shadow-xl"
          >
            <header className="border-b border-[color:var(--admin-borda)] bg-gradient-to-r from-[color:var(--admin-petroleo-soft)]/40 to-transparent px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-dourado)] font-semibold">
                    Expedição
                  </div>
                  <h3 className="font-display text-xl text-[color:var(--admin-cinza-1)]">
                    {exp?.nome ?? "Sem expedição"}
                  </h3>
                  <div className="flex items-center gap-3 text-[12px] text-[color:var(--admin-cinza-3)] font-medium">
                    <span className="flex items-center gap-1.5 bg-[color:var(--admin-carvao)]/50 px-2 py-0.5 rounded border border-[color:var(--admin-borda)]">
                      <Calendar className="h-3.5 w-3.5 text-[color:var(--admin-dourado)]" />
                      {data ? fmtDateRange(data.data_inicio, data.data_fim) : "Sem data definida"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Pill icon={Users} label="Vagas" value={`${vagasTotal - vagasDisp}/${vagasTotal}`} />
                  <Pill icon={UserCheck} label="Confirmados" value={String(confirmados)} tone="ok" />
                  {pendentes > 0 ? (
                    <Pill icon={AlertCircle} label="Pendentes" value={String(pendentes)} tone="warn" />
                  ) : null}
                  <div className="h-8 w-px bg-[color:var(--admin-borda)]/30 mx-1 hidden sm:block" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-[color:var(--admin-cinza-3)] uppercase tracking-wider">Receita:</span>
                      <span className="text-emerald-300 font-mono font-medium">{fmtBRL(receitaRecebida)}</span>
                      <span className="text-[color:var(--admin-cinza-3)]">/ {fmtBRL(receitaPrevista)}</span>
                    </div>
                    {aReceber > 0 && (
                      <div className="flex items-center gap-1 text-[9px] text-amber-300 font-medium uppercase tracking-tighter">
                        <AlertCircle className="h-2.5 w-2.5" /> {fmtBRL(aReceber)} a receber
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>
            
            <div className="admin-table-wrap p-0">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="bg-[color:var(--admin-petroleo-soft)]/20 text-left text-[10px] uppercase tracking-[0.16em] text-[color:var(--admin-cinza-3)]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Participante</th>
                    <th className="px-3 py-3.5 font-semibold">Idade / Peso</th>
                    <th className="px-3 py-3.5 font-semibold">Experiência</th>
                    <th className="px-3 py-3.5 font-semibold text-center">Docs</th>
                    <th className="px-3 py-3.5 font-semibold">Status</th>
                    <th className="px-3 py-3.5 font-semibold">Origem (Reserva)</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--admin-borda)]/50">
                  {g.participantes.map((p) => {
                    const res = reservas.find(r => r.id === p.reserva_id);
                    return (
                      <tr key={p.id} className="group hover:bg-[color:var(--admin-petroleo)]/10 transition-colors">
                        <td className="px-5 py-4">
                          <Link
                            to="/admin/participantes/$id"
                            params={{ id: p.id }}
                            className="font-semibold text-[color:var(--admin-cinza-1)] group-hover:text-[color:var(--admin-dourado)] transition-colors text-left block"
                          >
                            {p.nome}
                          </Link>
                          <div className="text-[11px] text-[color:var(--admin-cinza-3)] mt-0.5">{p.telefone ?? p.email ?? "—"}</div>
                        </td>
                        <td className="px-3 py-4">
                          <div className="text-[color:var(--admin-cinza-2)] font-medium">{calcIdade(p.data_nascimento)}</div>
                          <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{p.peso ? `${p.peso} kg` : "—"}</div>
                        </td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                            p.experiencia_equestre === 'avancado' ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/5" :
                            p.experiencia_equestre === 'intermediario' ? "border-sky-500/30 text-sky-300 bg-sky-500/5" :
                            "border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-3)]"
                          )}>
                            {p.experiencia_equestre ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-center">
                          <div className="flex justify-center">
                            {p.documento ? (
                              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Documento informado" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-rose-500/30 border border-rose-500/50" title="Documento pendente" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="px-3 py-4">
                          {res ? (
                            <Link
                              to="/admin/reservas/$id"
                              params={{ id: res.id }}
                              className="group/res block"
                            >
                              <div className="text-[11px] text-[color:var(--admin-dourado)] font-mono font-medium group-hover/res:underline">{res.protocolo}</div>
                              <div className="text-[10px] text-[color:var(--admin-cinza-3)] truncate max-w-[140px] group-hover/res:text-[color:var(--admin-cinza-2)]">
                                {res.cliente_nome}
                              </div>
                            </Link>
                          ) : (
                            <span className="text-[11px] text-[color:var(--admin-cinza-3)]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(p)} className="admin-btn-ghost p-1.5" title="Editar"><Users className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onDelete(p)} className="admin-btn-ghost p-1.5 hover:!text-rose-300" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <footer className="bg-[color:var(--admin-petroleo-soft)]/10 px-5 py-3 border-t border-[color:var(--admin-borda)]/30">
              <div className="text-[11px] text-[color:var(--admin-cinza-3)] flex items-center justify-between">
                <span>{g.participantes.length} participantes vinculados</span>
                <span className="font-mono">{exp?.nome} · {data?.data_inicio ? new Date(data.data_inicio).getFullYear() : ''}</span>
              </div>
            </footer>
          </section>
        );
      })}
    </div>

  );
}

function Pill({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone?: "ok" | "warn" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
      : "border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 text-[color:var(--admin-cinza-2)]";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cls}`}>
      <Icon className="h-3 w-3" />
      <span className="text-[10px] uppercase tracking-[0.16em] opacity-80">{label}</span>
      <span className="font-medium">{value}</span>
    </span>
  );
}

// ----------------- Vista lista (tabela simples antiga) -----------------

function VistaLista({
  participantes,
  expedicoes,
  onEdit,
  onDelete,
}: {
  participantes: ParticipanteRow[];
  expedicoes: { id: string; nome: string }[];
  onEdit: (p: ParticipanteRow) => void;
  onDelete: (p: ParticipanteRow) => void;
}) {
  return (
    <>
      <div className="admin-card admin-table-wrap p-0 hidden md:block">
        <table className="w-full text-left text-sm min-w-[720px]">
          <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
            <tr>
              <th className="px-5 py-3.5 font-medium">Nome</th>
              <th className="px-3 py-3.5 font-medium">Idade</th>
              <th className="px-3 py-3.5 font-medium">Peso</th>
              <th className="px-3 py-3.5 font-medium">Experiência</th>
              <th className="px-3 py-3.5 font-medium">Expedição</th>
              <th className="px-3 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((p) => {
              const exp = expedicoes.find((e) => e.id === p.expedicao_id);
              return (
                <tr key={p.id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                  <td className="px-5 py-4">
                    <Link to="/admin/participantes/$id" params={{ id: p.id }} className="font-medium text-[color:var(--admin-cinza-1)] hover:text-[color:var(--admin-dourado)]">{p.nome}</Link>
                    <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{p.telefone ?? p.email ?? "—"}</div>
                  </td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{calcIdade(p.data_nascimento)}</td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{p.peso ? `${p.peso} kg` : "—"}</td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)] capitalize">{p.experiencia_equestre ?? "—"}</td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)] truncate max-w-[200px]">{exp?.nome ?? "—"}</td>
                  <td className="px-3 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => onDelete(p)} className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 md:hidden">
        {participantes.map((p) => {
          const exp = expedicoes.find((e) => e.id === p.expedicao_id);
          return (
            <div key={p.id} className="admin-card p-4">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => onEdit(p)} className="text-left">
                  <div className="font-medium text-[color:var(--admin-cinza-1)]">{p.nome}</div>
                  <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{p.telefone ?? p.email ?? "—"}</div>
                </button>
                <StatusBadge status={p.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[color:var(--admin-cinza-3)]">
                <div><span className="block text-[10px] uppercase tracking-wider">Idade</span><span className="text-[color:var(--admin-cinza-2)]">{calcIdade(p.data_nascimento)}</span></div>
                <div><span className="block text-[10px] uppercase tracking-wider">Peso</span><span className="text-[color:var(--admin-cinza-2)]">{p.peso ? `${p.peso} kg` : "—"}</span></div>
                <div><span className="block text-[10px] uppercase tracking-wider">Exp.</span><span className="capitalize text-[color:var(--admin-cinza-2)]">{p.experiencia_equestre ?? "—"}</span></div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                <span className="truncate text-[color:var(--admin-cinza-3)]">{exp?.nome ?? "Sem expedição"}</span>
                <button onClick={() => onDelete(p)} className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ----------------- Dialog (criar/editar) -----------------

function ParticipanteDialog({
  open, onOpenChange, expedicoes, reservas, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expedicoes: { id: string; nome: string }[];
  reservas: ReservaSlim[];
  initial?: ParticipanteRow;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<ParticipanteRow>>(initial ?? {});
  const mut = useMutation({
    mutationFn: () => (initial ? updateParticipante(initial.id, form) : createParticipante(form)),
    onSuccess: () => { toast.success("Salvo"); onSaved(); onOpenChange(false); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)] sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">{initial ? "Editar participante" : "Novo participante"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {!initial && (
            <AdminField label="Vincular a uma Reserva Confirmada (Auto-preencher)">
              <select 
                className="admin-input border-[color:var(--admin-dourado)]/30"
                onChange={(e) => {
                  const rId = e.target.value;
                  if (!rId) return;
                  const res = reservas.find(r => r.id === rId);
                  if (res) {
                    // Tenta buscar dados do cliente da reserva para pré-preencher
                    // Como temos apenas ReservaSlim aqui, talvez precisemos de mais dados ou apenas vincular o ID.
                    // Mas o usuário quer "preenche automaticamente os dados".
                    // Vou buscar os dados completos da reserva se selecionada.
                    supabase.from("reservas").select("*").eq("id", rId).maybeSingle().then(({ data }) => {
                      if (data) {
                        setForm(f => ({
                          ...f,
                          reserva_id: rId,
                          expedicao_id: data.expedicao_id,
                          data_id: data.data_id,
                          nome: data.cliente_nome ?? f.nome,
                          email: data.cliente_email ?? f.email,
                          telefone: data.cliente_telefone ?? f.telefone,
                          cpf: data.cliente_cpf ?? f.cpf,
                        }));
                      }
                    });
                  }
                }}
              >
                <option value="">Selecione uma reserva...</option>
                {reservas
                  .filter(r => r.status_operacional === "reserva_confirmada")
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.protocolo || r.id.slice(0,8)} - {r.cliente_nome} ({r.expedicao_nome})
                    </option>
                  ))}
              </select>
              <p className="mt-1 text-[10px] text-[color:var(--admin-cinza-3)]">Isso preencherá os dados do responsável pela reserva.</p>
            </AdminField>
          )}
          <AdminField label="Nome completo"><input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="CPF"><input className="admin-input" value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></AdminField>
            <AdminField label="Documento (RG)"><input className="admin-input" value={form.documento ?? ""} onChange={(e) => setForm({ ...form, documento: e.target.value })} /></AdminField>
            <AdminField label="Peso (kg)"><input type="number" step="0.1" className="admin-input" value={form.peso ?? ""} onChange={(e) => setForm({ ...form, peso: e.target.value ? Number(e.target.value) : null })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Telefone"><input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></AdminField>
            <AdminField label="E-mail"><input type="email" className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Data de nascimento"><input type="date" className="admin-input" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></AdminField>
            <AdminField label="Experiência equestre">
              <select className="admin-input" value={form.experiencia_equestre ?? ""} onChange={(e) => setForm({ ...form, experiencia_equestre: e.target.value })}>
                <option value="">Não informado</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Expedição vinculada">
            <select className="admin-input" value={form.expedicao_id ?? ""} onChange={(e) => setForm({ ...form, expedicao_id: e.target.value || null })}>
              <option value="">Nenhuma</option>
              {expedicoes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
            </select>
          </AdminField>
          <AdminField label="Acompanhante"><input className="admin-input" value={form.acompanhante ?? ""} onChange={(e) => setForm({ ...form, acompanhante: e.target.value })} /></AdminField>
          <AdminField label="Observações médicas / alergias"><textarea className="admin-input min-h-[60px]" value={form.observacoes_medicas ?? ""} onChange={(e) => setForm({ ...form, observacoes_medicas: e.target.value })} /></AdminField>
          <AdminField label="Restrições alimentares"><textarea className="admin-input min-h-[60px]" value={form.restricoes_alimentares ?? ""} onChange={(e) => setForm({ ...form, restricoes_alimentares: e.target.value })} /></AdminField>
          <AdminField label="Outras restrições / observações"><textarea className="admin-input min-h-[60px]" value={form.restricoes ?? ""} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} /></AdminField>
          <AdminField label="Status">
            <select className="admin-input" value={form.status ?? "pendente"} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pendente">Pendente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending || !form.nome}>Salvar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
