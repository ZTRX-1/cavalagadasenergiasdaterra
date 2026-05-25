import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSection, AdminField } from "@/components/admin/admin-section";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { getLead, updateLead, listLeadAtividades, addLeadActivity, LEAD_STATUS, type LeadRow, type LeadStatusId } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/leads/$id")({
  component: LeadEdit,
});

function LeadEdit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: lead } = useQuery({ queryKey: ["admin", "lead", id], queryFn: () => getLead(id) });
  const { data: atividades = [] } = useQuery({ queryKey: ["admin", "lead-ativ", id], queryFn: () => listLeadAtividades(id) });
  const [form, setForm] = useState<Partial<LeadRow> | null>(null);
  const [nota, setNota] = useState("");
  useEffect(() => { if (lead) setForm(lead); }, [lead]);

  const saveMut = useMutation({
    mutationFn: (patch: Partial<LeadRow>) => updateLead(id, patch),
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["admin"] }); },
  });

  if (!form) return <div className="admin-card h-40 animate-pulse" />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow={form.protocolo ?? "lead"}
        title={form.nome ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <button className="admin-btn-ghost" onClick={() => nav({ to: "/admin/leads" })}><ArrowLeft className="h-4 w-4" /> Voltar</button>
            <button className="admin-btn-primary" onClick={() => saveMut.mutate(form)}><Save className="h-4 w-4" /> Salvar</button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdminSection titulo="Dados do lead">
            <AdminField label="Status">
              <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatusId })}>
                {LEAD_STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </AdminField>
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
            <AdminField label="Observações"><textarea className="admin-input min-h-[100px]" value={form.observacoes ?? ""} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></AdminField>
          </AdminSection>
        </div>

        <div className="space-y-6">
          <AdminSection titulo="Adicionar nota">
            <textarea className="admin-input min-h-[80px]" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Registrar contato, observação, próxima ação..." />
            <button
              className="admin-btn-primary w-full"
              disabled={!nota.trim()}
              onClick={async () => {
                await addLeadActivity(id, "observacao", nota.trim());
                setNota("");
                qc.invalidateQueries({ queryKey: ["admin", "lead-ativ", id] });
                toast.success("Nota adicionada");
              }}
            >
              <Send className="h-4 w-4" /> Registrar
            </button>
          </AdminSection>

          <AdminSection titulo="Timeline">
            <ol className="space-y-3">
              {atividades.map((a) => (
                <li key={a.id} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[color:var(--admin-dourado)]" />
                  <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{new Date(a.created_at).toLocaleString("pt-BR")}</div>
                  <div className="mt-0.5 text-sm text-[color:var(--admin-cinza-1)]">{a.descricao}</div>
                  <div className="text-[11px] text-[color:var(--admin-cinza-3)]"><StatusBadge status={a.tipo} /></div>
                </li>
              ))}
              {atividades.length === 0 ? <p className="text-sm text-[color:var(--admin-cinza-3)]">Sem atividades ainda.</p> : null}
            </ol>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
