import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminField } from "@/components/admin/admin-section";
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

  const grouped: Record<LeadStatusId, LeadRow[]> = LEAD_STATUS.reduce((acc, s) => {
    acc[s.id] = leads.filter((l) => l.status === s.id);
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

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : leads.length === 0 ? (
        <AdminEmpty
          icon={Sparkles}
          titulo="Sem leads ainda"
          descricao="Os leads recebidos pelos formulários e pré-reservas aparecerão aqui automaticamente."
          acao={<button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Adicionar manualmente</button>}
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
      <DialogContent className="border border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)] text-[color:var(--admin-cinza-1)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Novo lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <AdminField label="Nome"><input className="admin-input" value={form.nome ?? ""} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></AdminField>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="E-mail"><input className="admin-input" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></AdminField>
            <AdminField label="Telefone"><input className="admin-input" value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></AdminField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AdminField label="Cidade"><input className="admin-input" value={form.cidade ?? ""} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></AdminField>
            <AdminField label="Estado"><input className="admin-input" value={form.estado ?? ""} onChange={(e) => setForm({ ...form, estado: e.target.value })} /></AdminField>
          </div>
          <AdminField label="Expedição de interesse"><input className="admin-input" value={form.expedicao_interesse ?? ""} onChange={(e) => setForm({ ...form, expedicao_interesse: e.target.value })} /></AdminField>
          <div className="grid grid-cols-3 gap-3">
            <AdminField label="Acompanhantes"><input type="number" className="admin-input" value={form.acompanhantes ?? 0} onChange={(e) => setForm({ ...form, acompanhantes: Number(e.target.value) })} /></AdminField>
            <AdminField label="Pessoas"><input type="number" className="admin-input" value={form.quantidade_pessoas ?? 1} onChange={(e) => setForm({ ...form, quantidade_pessoas: Number(e.target.value) })} /></AdminField>
            <AdminField label="Valor estimado"><input type="number" className="admin-input" value={form.valor_estimado ?? ""} onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : null })} /></AdminField>
          </div>
          <AdminField label="Observações"><textarea className="admin-input min-h-[80px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          <div className="flex justify-end gap-2 pt-2">
            <button className="admin-btn-ghost" onClick={() => onOpenChange(false)}>Cancelar</button>
            <button className="admin-btn-primary" onClick={() => mut.mutate()} disabled={mut.isPending || !form.nome}>Criar</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
