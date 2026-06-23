import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Sparkles, Trash2, Filter, X, LayoutGrid, List, UserX } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminField } from "@/components/admin/admin-section";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { ConverterLeadModal } from "@/components/admin/converter-lead-modal";
import { LeadsKanban } from "@/components/admin/leads-kanban";
import { useCan } from "@/hooks/use-permissions";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  LEAD_ETAPAS,
  type LeadRow,
  type LeadEtapaId,
} from "@/lib/admin/api";
import {
  JORNADA_ESTAGIOS,
  JORNADA_REATIVACAO,
  JORNADA_TONE_CLASS,
  jornadaFromLead,
} from "@/lib/admin/jornada";

export const Route = createFileRoute("/admin/_authenticated/leads/")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["admin", "leads"], queryFn: listLeads });
  const [novo, setNovo] = useState(false);
  const [del, setDel] = useState<LeadRow | null>(null);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [tab, setTab] = useState<string>("ativos");
  const [fExpedicao, setFExpedicao] = useState<string>("todas");
  const [fBusca, setFBusca] = useState<string>("");
  const { canEdit } = useCan("leads");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "leads"] });

  const moveMut = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: LeadEtapaId }) =>
      updateLead(id, { etapa_atendimento: etapa }),
    onSuccess: () => { toast.success("Etapa atualizada"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  function handleMoveLead(id: string, etapa: LeadEtapaId) {
    moveMut.mutate({ id, etapa });
  }

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => { toast.success("Excluído"); setDel(null); refresh(); },
  });

  const expedicoesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.expedicao_interesse && set.add(l.expedicao_interesse));
    return Array.from(set);
  }, [leads]);

  const leadsFiltrados = useMemo(() => {
    const q = fBusca.trim().toLowerCase();
    return leads.filter((l) => {
      if (tab === "ativos" && l.status === "abandonado") return false;
      if (tab === "abandonados" && l.status !== "abandonado") return false;
      if (fExpedicao !== "todas" && l.expedicao_interesse !== fExpedicao) return false;
      if (q) {
        const hay = `${l.nome ?? ""} ${l.email ?? ""} ${l.telefone ?? ""} ${l.protocolo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, fExpedicao, fBusca, tab]);

  const countAtivos = useMemo(() => leads.filter(l => l.status !== "abandonado").length, [leads]);
  const countAbandonados = useMemo(() => leads.filter(l => l.status === "abandonado").length, [leads]);

  // Contagens por estágio para o dashboard
  const counts = useMemo(() => {
    const ativosLeads = leads.filter(l => l.status !== "abandonado");
    const map = new Map<string, number>();
    for (const l of ativosLeads) {
      const j = jornadaFromLead(l);
      map.set(j, (map.get(j) ?? 0) + 1);
    }
    return map;
  }, [leads]);

  const filtrosAtivos = fExpedicao !== "todas" || fBusca.trim().length > 0;
  const limparFiltros = () => { setFExpedicao("todas"); setFBusca(""); };

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Central de Reservas"
        description="Visão única da operação. Cada cliente caminha pela jornada — do primeiro contato à expedição realizada."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-0.5">
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "kanban" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("kanban")}
              ><LayoutGrid className="h-3.5 w-3.5" /> Jornada</button>
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "lista" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("lista")}
              ><List className="h-3.5 w-3.5" /> Lista</button>
            </div>
            <button className="admin-btn-primary" onClick={() => setNovo(true)}>
              <Plus className="h-4 w-4" /> Novo contato
            </button>
          </div>
        }
      />

      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        Acompanhe quantos clientes estão em cada estágio. Clique em qualquer card para abrir a ficha — todas as informações estão organizadas em abas.
      </AdminPageIntro>

      {/* Dashboard de contagens por estágio */}
      <div className="mb-6 grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-7">
        {JORNADA_ESTAGIOS.map((s) => (
          <div
            key={s.id}
            className={`rounded-xl border p-3 ${JORNADA_TONE_CLASS[s.tone]} bg-opacity-30`}
          >
            <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">{s.label}</div>
            <div className="mt-1 font-display text-2xl">{counts.get(s.id) ?? 0}</div>
          </div>
        ))}
        <div className={`rounded-xl border p-3 ${JORNADA_TONE_CLASS[JORNADA_REATIVACAO.tone]} bg-opacity-30`}>
          <div className="text-[10px] uppercase tracking-[0.18em] opacity-80">{JORNADA_REATIVACAO.label}</div>
          <div className="mt-1 font-display text-2xl">{counts.get("reativacao") ?? 0}</div>
        </div>
      </div>

      <Tabs defaultValue="ativos" className="mb-4" value={tab} onValueChange={setTab}>
        <TabsList className="bg-[color:var(--admin-carvao-deep)] border border-[color:var(--admin-borda)] p-1">
          <TabsTrigger value="ativos" className="data-[state=active]:bg-[color:var(--admin-dourado)] data-[state=active]:text-[color:var(--admin-carvao-deep)] text-xs font-medium px-4 py-2">
            Ativos ({countAtivos})
          </TabsTrigger>
          <TabsTrigger value="abandonados" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs font-medium px-4 py-2">
            Abandonados ({countAbandonados})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtros operacionais (sem temperatura/score) */}
      <div className="admin-card mb-4 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-[200px] items-center gap-2">
            <Filter className="h-4 w-4 text-[color:var(--admin-cinza-3)]" strokeWidth={1.8} />
            <input
              className="admin-input flex-1"
              placeholder="Buscar por nome, e-mail, telefone ou protocolo…"
              value={fBusca}
              onChange={(e) => setFBusca(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)] mb-1">Expedição</label>
            <select className="admin-input min-w-[180px]" value={fExpedicao} onChange={(e) => setFExpedicao(e.target.value)}>
              <option value="todas">Todas</option>
              {expedicoesDisponiveis.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          {filtrosAtivos ? (
            <button className="admin-btn-ghost px-3 py-2 text-[12px]" onClick={limparFiltros}>
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : leads.length === 0 ? (
        <AdminEmpty
          icon={tab === "abandonados" ? UserX : Sparkles}
          titulo={tab === "abandonados" ? "Nenhum lead abandonado" : "Sem leads ainda"}
          descricao={tab === "abandonados" ? "Leads capturados durante o início do preenchimento aparecerão aqui." : "Os leads recebidos pelos formulários e pré-reservas aparecerão aqui automaticamente."}
          acao={tab === "ativos" ? <button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Adicionar manualmente</button> : null}
        />
      ) : leadsFiltrados.length === 0 ? (
        <AdminEmpty
          icon={Filter}
          titulo="Nenhum lead corresponde aos filtros"
          descricao="Ajuste os filtros acima ou limpe para ver todos os leads novamente."
          acao={<button className="admin-btn-ghost" onClick={limparFiltros}><X className="h-4 w-4" /> Limpar filtros</button>}
        />
      ) : view === "kanban" && tab === "ativos" ? (
        <LeadsKanban
          leads={leadsFiltrados}
          onMove={handleMoveLead}
          onDelete={(l) => setDel(l)}
        />
      ) : (
        <LeadsLista leads={leadsFiltrados} onDelete={(l) => setDel(l)} />
      )}

      <NovoLeadDialog open={novo} onOpenChange={setNovo} onCreated={refresh} />

      <ConfirmDialog
        open={!!del}
        onOpenChange={(v) => !v && setDel(null)}
        title="Excluir lead"
        description={`Remover ${del?.nome ?? ""} e seu histórico.`}
        destructive
        onConfirm={() => { if (del) delMut.mutate(del.id); }}
      />
    </div>
  );
}

function LeadsLista({ leads, onDelete }: { leads: LeadRow[]; onDelete: (l: LeadRow) => void }) {
  return (
    <div className="admin-card admin-table-wrap p-0">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="border-b border-[color:var(--admin-borda)] text-left text-[11px] uppercase tracking-[0.16em] text-[color:var(--admin-cinza-3)]">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Etapa</th>
            <th className="px-4 py-3">Expedição</th>
            <th className="px-4 py-3">Data</th>
            <th className="px-4 py-3">Pessoas</th>
            <th className="px-4 py-3 text-right"></th>
          </tr>
        </thead>
        <tbody className="text-[color:var(--admin-cinza-1)]">
          {leads.map((l) => (
            <tr key={l.id} className="border-b border-[color:var(--admin-borda)]/50 hover:bg-[color:var(--admin-carvao-deep)]/30">
              <td className="px-4 py-3">
                <Link to="/admin/leads/$id" params={{ id: l.id }} className="font-medium hover:text-[color:var(--admin-dourado)]">{l.nome}</Link>
                <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{l.protocolo ?? "—"}</div>
              </td>
              <td className="px-4 py-3"><StatusBadge status={l.status === 'abandonado' ? 'abandonado' : (l.etapa_atendimento ?? "novo")} /></td>
              <td className="px-4 py-3 text-xs text-[color:var(--admin-cinza-2)]">{l.expedicao_interesse ?? "—"}</td>
              <td className="px-4 py-3 text-xs">{l.data_interesse ? new Date(l.data_interesse).toLocaleDateString("pt-BR") : "—"}</td>
              <td className="px-4 py-3 text-xs">{l.quantidade_pessoas ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onDelete(l)} className="text-[color:var(--admin-cinza-3)] hover:text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NovoLeadDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [form, setForm] = useState<Partial<LeadRow>>({});
  const mut = useMutation({
    mutationFn: () => createLead(form),
    onSuccess: () => { toast.success("Lead criado"); onCreated(); onOpenChange(false); setForm({}); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <AdminField label="Nome completo"><input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="E-mail"><input className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AdminField>
            <AdminField label="Telefone / WhatsApp"><input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></AdminField>
          </div>
          <AdminField label="Expedição de interesse"><input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Pessoas"><input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} /></AdminField>
            <AdminField label="Etapa inicial">
              <select className="admin-input" value={form.etapa_atendimento ?? "novo"} onChange={(e) => setForm({ ...form, etapa_atendimento: e.target.value as LeadEtapaId })}>
                {LEAD_ETAPAS.slice(0, 7).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </AdminField>
          </div>
          <AdminField label="Observações"><textarea className="admin-input min-h-[60px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending || !form.nome}>Criar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
