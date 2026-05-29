import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Plus, Sparkles, Trash2, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminField } from "@/components/admin/admin-section";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";
import {
  listLeads,
  createLead,
  updateLead,
  deleteLead,
  LEAD_STATUS,
  type LeadRow,
  type LeadStatusId,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const qc = useQueryClient();
  const { data: leads = [], isLoading } = useQuery({ queryKey: ["admin", "leads"], queryFn: listLeads });
  const [novo, setNovo] = useState(false);
  const [del, setDel] = useState<LeadRow | null>(null);
  const [fOrigem, setFOrigem] = useState<string>("todas");
  const [fExpedicao, setFExpedicao] = useState<string>("todas");
  const [fBusca, setFBusca] = useState<string>("");
  const { canEdit } = useCan("leads");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "leads"] });

  const moveMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatusId }) => updateLead(id, { status }),
    onSuccess: () => { toast.success("Status atualizado"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => { toast.success("Excluído"); setDel(null); refresh(); },
  });

  // Listas únicas para os filtros
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
      if (q) {
        const hay = `${l.nome ?? ""} ${l.email ?? ""} ${l.telefone ?? ""} ${l.protocolo ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, fOrigem, fExpedicao, fBusca]);

  const filtrosAtivos = fOrigem !== "todas" || fExpedicao !== "todas" || fBusca.trim().length > 0;
  const limparFiltros = () => { setFOrigem("todas"); setFExpedicao("todas"); setFBusca(""); };

  const grouped: Record<LeadStatusId, LeadRow[]> = LEAD_STATUS.reduce((acc, s) => {
    acc[s.id] = leadsFiltrados.filter((l) => l.status === s.id);
    return acc;
  }, {} as Record<LeadStatusId, LeadRow[]>);

  return (
    <div>
      <AdminPageHeader
        eyebrow="CRM"
        title="Leads"
        description="Pipeline operacional dos contatos. Mude o status para acompanhar a jornada."
        actions={
          <button className="admin-btn-primary" onClick={() => setNovo(true)}>
            <Plus className="h-4 w-4" /> Novo lead
          </button>
        }
      />

      {!canEdit ? <EmDesenvolvimentoBanner /> : null}
      <AdminPageIntro>
        <strong className="text-[color:var(--admin-cinza-1)]">Pipeline comercial.</strong> Cada contato que chega por WhatsApp, Instagram, indicação ou cadastro manual aparece aqui. Use os filtros para focar em uma origem específica, em uma expedição, ou buscar por nome/protocolo. Mude o status arrastando o card pelos botões "→" pra acompanhar a jornada até o fechamento.
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
            <label className="block text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)] mb-1">Expedição de interesse</label>
            <select className="admin-input min-w-[200px]" value={fExpedicao} onChange={(e) => setFExpedicao(e.target.value)}>
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
      ) : (
        <div className="grid gap-3 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${LEAD_STATUS.length}, minmax(260px, 1fr))` }}>
          {LEAD_STATUS.map((s) => (
            <div key={s.id} className="admin-card flex min-h-[400px] flex-col p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.id} />
                </div>
                <span className="text-xs text-[color:var(--admin-cinza-3)]">{grouped[s.id].length}</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto">
                {grouped[s.id].map((l) => (
                  <Link
                    key={l.id}
                    to="/admin/leads/$id"
                    params={{ id: l.id }}
                    className="block rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/60 p-3 transition hover:border-[color:var(--admin-dourado)]/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-[color:var(--admin-cinza-1)] truncate">{l.nome}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); setDel(l); }}
                        className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {l.expedicao_interesse ? (
                      <p className="mt-1 text-xs text-[color:var(--admin-cinza-2)] truncate">{l.expedicao_interesse}</p>
                    ) : null}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[color:var(--admin-cinza-3)]">
                      <span>{l.protocolo ?? "—"}</span>
                      {l.valor_estimado ? <span>R$ {Number(l.valor_estimado).toLocaleString("pt-BR")}</span> : null}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {LEAD_STATUS.filter((x) => x.id !== l.status).slice(0, 3).map((x) => (
                        <button
                          key={x.id}
                          onClick={(e) => { e.preventDefault(); moveMut.mutate({ id: l.id, status: x.id }); }}
                          className="rounded-md border border-[color:var(--admin-borda)] px-1.5 py-0.5 text-[10px] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/50"
                        >
                          → {x.label}
                        </button>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
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
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="CPF"><input className="admin-input" value={form.cpf ?? ""} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></AdminField>
            <AdminField label="Data de nascimento"><input type="date" className="admin-input" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} /></AdminField>
            <AdminField label="Peso (kg)"><input type="number" step="0.1" className="admin-input" value={form.peso ?? ""} onChange={(e) => setForm({ ...form, peso: e.target.value ? Number(e.target.value) : null })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Cidade"><input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></AdminField>
            <AdminField label="Estado"><input className="admin-input" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Experiência equestre">
              <select className="admin-input" value={form.experiencia_equestre ?? ""} onChange={(e) => setForm({ ...form, experiencia_equestre: e.target.value || null })}>
                <option value="">Não informada</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </AdminField>
            <AdminField label="Origem do lead">
              <select className="admin-input" value={form.origem ?? "manual"} onChange={(e) => setForm({ ...form, origem: e.target.value })}>
                <option value="manual">Manual</option>
                <option value="site">Site</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
                <option value="indicacao">Indicação</option>
                <option value="evento">Evento</option>
                <option value="outro">Outro</option>
              </select>
            </AdminField>
          </div>
          <AdminField label="Expedição de interesse"><input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} /></AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Acompanhantes"><input type="number" className="admin-input" value={form.acompanhantes ?? 0} onChange={(e) => setForm({ ...form, acompanhantes: Number(e.target.value) })} /></AdminField>
            <AdminField label="Pessoas"><input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} /></AdminField>
            <AdminField label="Valor estimado"><input type="number" className="admin-input" value={form.valor_estimado ?? ""} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })} /></AdminField>
          </div>
          <AdminField label="Observações médicas / alergias"><textarea className="admin-input min-h-[60px]" value={form.observacoes_medicas ?? ""} onChange={(e) => setForm({ ...form, observacoes_medicas: e.target.value })} /></AdminField>
          <AdminField label="Restrições alimentares"><textarea className="admin-input min-h-[60px]" value={form.restricoes_alimentares ?? ""} onChange={(e) => setForm({ ...form, restricoes_alimentares: e.target.value })} /></AdminField>
          <AdminField label="Observações gerais"><textarea className="admin-input min-h-[60px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending || !form.nome}>Criar lead</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
