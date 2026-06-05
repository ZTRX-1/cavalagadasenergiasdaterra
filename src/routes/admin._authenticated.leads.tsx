import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Sparkles, Trash2, Filter, X, LayoutGrid, List, Star, Flame, ArrowRight } from "lucide-react";
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
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  LEAD_ETAPAS,
  type LeadRow,
  type LeadEtapaId,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["admin", "leads"], queryFn: listLeads });
  const [novo, setNovo] = useState(false);
  const [del, setDel] = useState<LeadRow | null>(null);
  const [converter, setConverter] = useState<LeadRow | null>(null);
  const [view, setView] = useState<"kanban" | "lista">("kanban");
  const [fOrigem, setFOrigem] = useState<string>("todas");
  const [fExpedicao, setFExpedicao] = useState<string>("todas");
  const [fBusca, setFBusca] = useState<string>("");
  const [fNivel, setFNivel] = useState<string>("todos");
  const { canEdit } = useCan("leads");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "leads"] });

  const moveMut = useMutation({
    mutationFn: ({ id, etapa }: { id: string; etapa: LeadEtapaId }) =>
      updateLead(id, { etapa_atendimento: etapa, status: etapa }),
    onSuccess: () => { toast.success("Etapa atualizada"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => { toast.success("Excluído"); setDel(null); refresh(); },
  });

  const origensDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.origem && set.add(l.origem));
    return Array.from(set);
  }, [leads]);
  const expedicoesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.expedicao_interesse && set.add(l.expedicao_interesse));
    return Array.from(set);
  }, [leads]);

  const leadsFiltrados = useMemo(() => {
    const q = fBusca.trim().toLowerCase();
    return leads.filter((l) => {
      if (fOrigem !== "todas" && l.origem !== fOrigem) return false;
      if (fExpedicao !== "todas" && l.expedicao_interesse !== fExpedicao) return false;
      if (fNivel !== "todos" && String(l.nivel_interesse ?? 3) !== fNivel) return false;
      if (q) {
        const hay = `${l.nome ?? ""} ${l.email ?? ""} ${l.telefone ?? ""} ${l.protocolo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, fOrigem, fExpedicao, fBusca, fNivel]);

  const filtrosAtivos = fOrigem !== "todas" || fExpedicao !== "todas" || fNivel !== "todos" || fBusca.trim().length > 0;
  const limparFiltros = () => { setFOrigem("todas"); setFExpedicao("todas"); setFNivel("todos"); setFBusca(""); };


  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Leads"
        description="Cada pessoa que entra em contato vira um lead aqui. Acompanhe pelo Kanban e mova entre as etapas do atendimento."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-0.5">
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "kanban" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("kanban")}
              ><LayoutGrid className="h-3.5 w-3.5" /> Kanban</button>
              <button
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs ${view === "lista" ? "bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-cinza-3)]"}`}
                onClick={() => setView("lista")}
              ><List className="h-3.5 w-3.5" /> Lista</button>
            </div>
            <button className="admin-btn-primary" onClick={() => setNovo(true)}>
              <Plus className="h-4 w-4" /> Novo lead
            </button>
          </div>
        }
      />

      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Etapas do Atendimento.</strong> Acompanhe cada contato desde a chegada até virar reserva paga. As cores indicam o <strong>Nível de Interesse</strong> (de 1 a 5) e o <strong>Lead Score</strong> classifica automaticamente quem está mais perto de fechar.
      </AdminPageIntro>

      {/* Filtros */}
      <div className="admin-card mb-4 p-4">
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
            <label className="block text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)] mb-1">Origem</label>
            <select className="admin-input" value={fOrigem} onChange={(e) => setFOrigem(e.target.value)}>
              <option value="todas">Todas</option>
              {origensDisponiveis.map((o) => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
              ))}
            </select>
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
          <div>
            <label className="block text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)] mb-1">Nível de Interesse</label>
            <select className="admin-input" value={fNivel} onChange={(e) => setFNivel(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="5">⭐⭐⭐⭐⭐ Altíssimo</option>
              <option value="4">⭐⭐⭐⭐ Alto</option>
              <option value="3">⭐⭐⭐ Médio</option>
              <option value="2">⭐⭐ Baixo</option>
              <option value="1">⭐ Muito baixo</option>
            </select>
          </div>
          {filtrosAtivos ? (
            <button className="admin-btn-ghost px-3 py-2 text-[12px]" onClick={limparFiltros}>
              <X className="h-3.5 w-3.5" /> Limpar
            </button>
          ) : null}
        </div>
        {filtrosAtivos ? (
          <p className="mt-3 text-[11px] text-[color:var(--admin-cinza-3)]">
            Mostrando <strong className="text-[color:var(--admin-cinza-1)]">{leadsFiltrados.length}</strong> de {leads.length} leads
          </p>
        ) : null}
      </div>

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : leads.length === 0 ? (
        <AdminEmpty
          icon={Sparkles}
          titulo="Sem leads ainda"
          descricao="Os leads recebidos pelos formulários e pré-reservas aparecerão aqui automaticamente."
          acao={<button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Adicionar manualmente</button>}
        />
      ) : leadsFiltrados.length === 0 ? (
        <AdminEmpty
          icon={Filter}
          titulo="Nenhum lead corresponde aos filtros"
          descricao="Ajuste os filtros acima ou limpe para ver todos os leads novamente."
          acao={<button className="admin-btn-ghost" onClick={limparFiltros}><X className="h-4 w-4" /> Limpar filtros</button>}
        />
      ) : view === "kanban" ? (
        <LeadsKanban
          leads={leadsFiltrados}
          onMove={(id, etapa) => moveMut.mutate({ id, etapa })}
          onDelete={(l) => setDel(l)}
          onConverter={(l) => setConverter(l)}
        />
      ) : (
        <LeadsLista leads={leadsFiltrados} onDelete={(l) => setDel(l)} onConverter={(l) => setConverter(l)} />
      )}

      <NovoLeadDialog open={novo} onOpenChange={setNovo} onCreated={refresh} />

      {converter ? (
        <ConverterLeadModal
          open={!!converter}
          onOpenChange={(v) => !v && setConverter(null)}
          lead={converter}
          onConverted={refresh}
        />
      ) : null}

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

function LeadKanbanCard({ lead, onDelete, onMove, onConverter }: { lead: LeadRow; onDelete: () => void; onMove: (etapa: LeadEtapaId) => void; onConverter: () => void }) {
  const nivel = lead.nivel_interesse ?? 3;
  const score = lead.lead_score ?? 0;
  const proximaEtapa = useMemo(() => {
    const idx = LEAD_ETAPAS.findIndex((e) => e.id === lead.etapa_atendimento);
    return LEAD_ETAPAS[idx + 1];
  }, [lead.etapa_atendimento]);
  const ehProntoReserva = lead.etapa_atendimento === "pronto_reserva";
  return (
    <Link
      to="/admin/leads/$id"
      params={{ id: lead.id }}
      className="block rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-3 transition hover:border-[color:var(--admin-dourado)]/40"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-[color:var(--admin-cinza-1)] truncate">{lead.nome}</span>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {lead.expedicao_interesse ? (
        <p className="mt-1 text-xs text-[color:var(--admin-cinza-2)] truncate">{lead.expedicao_interesse}</p>
      ) : null}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3 w-3 ${i < nivel ? "fill-[color:var(--admin-dourado)] text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-borda)]"}`} strokeWidth={1.5} />
          ))}
        </div>
        {score > 0 ? (
          <div className="flex items-center gap-1 text-[10px] text-amber-300/90">
            <Flame className="h-3 w-3" strokeWidth={2} /> {score}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--admin-cinza-3)]">
        <span>{lead.protocolo ?? "—"}</span>
        {lead.valor_estimado ? <span>R$ {Number(lead.valor_estimado).toLocaleString("pt-BR")}</span> : null}
      </div>
      {lead.proxima_acao ? (
        <p className="mt-2 rounded border border-amber-400/20 bg-amber-400/5 px-2 py-1 text-[11px] text-amber-200/90 truncate">
          → {lead.proxima_acao}
        </p>
      ) : null}
      {ehProntoReserva ? (
        <button
          onClick={(e) => { e.preventDefault(); onConverter(); }}
          className="mt-2 w-full rounded-md border border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 px-2 py-1.5 text-[11px] text-[color:var(--admin-dourado)] hover:bg-[color:var(--admin-dourado)]/15 flex items-center justify-center gap-1"
        >
          <ArrowRight className="h-3 w-3" /> Converter em reserva
        </button>
      ) : proximaEtapa ? (
        <button
          onClick={(e) => { e.preventDefault(); onMove(proximaEtapa.id); }}
          className="mt-2 w-full rounded-md border border-[color:var(--admin-borda)] px-2 py-1 text-[11px] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/50"
        >
          Avançar → {proximaEtapa.label}
        </button>
      ) : null}
    </Link>
  );
}

function LeadsLista({ leads, onDelete, onConverter }: { leads: LeadRow[]; onDelete: (l: LeadRow) => void; onConverter: (l: LeadRow) => void }) {
  return (
    <div className="admin-card admin-table-wrap p-0">
      <table className="w-full text-sm min-w-[820px]">
        <thead className="border-b border-[color:var(--admin-borda)] text-left text-[11px] uppercase tracking-[0.16em] text-[color:var(--admin-cinza-3)]">
          <tr>
            <th className="px-4 py-3">Lead</th>
            <th className="px-4 py-3">Etapa</th>
            <th className="px-4 py-3">Nível</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Expedição</th>
            <th className="px-4 py-3">Próxima ação</th>
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
              <td className="px-4 py-3"><StatusBadge status={l.etapa_atendimento ?? "novo"} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < (l.nivel_interesse ?? 3) ? "fill-[color:var(--admin-dourado)] text-[color:var(--admin-dourado)]" : "text-[color:var(--admin-borda)]"}`} strokeWidth={1.5} />
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-xs">{l.lead_score ?? 0}</td>
              <td className="px-4 py-3 text-xs text-[color:var(--admin-cinza-2)]">{l.expedicao_interesse ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-amber-200/80">{l.proxima_acao ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                  {l.etapa_atendimento === "pronto_reserva" ? (
                    <button
                      onClick={() => onConverter(l)}
                      className="text-[11px] text-[color:var(--admin-dourado)] hover:underline inline-flex items-center gap-1"
                    >
                      <ArrowRight className="h-3 w-3" /> Converter
                    </button>
                  ) : null}
                  <button onClick={() => onDelete(l)} className="text-[color:var(--admin-cinza-3)] hover:text-rose-300">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
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
          <DialogTitle className="font-display text-2xl">Novo lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <AdminField label="Nome completo"><input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="E-mail"><input className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AdminField>
            <AdminField label="Telefone"><input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Cidade"><input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></AdminField>
            <AdminField label="Estado"><input className="admin-input" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Canal de entrada (de onde veio)">
              <select className="admin-input" value={form.canal_entrada ?? ""} onChange={(e) => setForm({ ...form, canal_entrada: e.target.value || null })}>
                <option value="">Não informado</option>
                <option value="site">Site</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="indicacao">Indicação</option>
                <option value="outro">Outro</option>
              </select>
            </AdminField>
            <AdminField label="Canal de atendimento (por onde fala)">
              <select className="admin-input" value={form.canal_atendimento ?? ""} onChange={(e) => setForm({ ...form, canal_atendimento: e.target.value || null })}>
                <option value="">Não informado</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telefone">Telefone</option>
                <option value="email">E-mail</option>
                <option value="presencial">Presencial</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Expedição de interesse"><input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} /></AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Pessoas"><input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} /></AdminField>
            <AdminField label="Valor estimado (R$)"><input type="number" className="admin-input" value={form.valor_estimado ?? ""} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })} /></AdminField>
            <AdminField label="Nível de Interesse">
              <select className="admin-input" value={form.nivel_interesse ?? 3} onChange={(e) => setForm({ ...form, nivel_interesse: Number(e.target.value) })}>
                <option value={5}>⭐⭐⭐⭐⭐</option>
                <option value={4}>⭐⭐⭐⭐</option>
                <option value={3}>⭐⭐⭐</option>
                <option value={2}>⭐⭐</option>
                <option value={1}>⭐</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Observações da equipe"><textarea className="admin-input min-h-[60px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending || !form.nome}>Criar lead</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
