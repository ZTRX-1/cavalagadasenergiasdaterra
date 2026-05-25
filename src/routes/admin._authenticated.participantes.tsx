import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Users, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/admin/_authenticated/participantes")({
  component: ParticipantesPage,
});

function calcIdade(nasc: string | null): string {
  if (!nasc) return "—";
  const d = new Date(nasc);
  const diff = Date.now() - d.getTime();
  const age = new Date(diff).getUTCFullYear() - 1970;
  return `${age} anos`;
}

function ParticipantesPage() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["admin", "participantes"], queryFn: listParticipantes });
  const { data: expedicoes = [] } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const [novo, setNovo] = useState(false);
  const [edit, setEdit] = useState<ParticipanteRow | null>(null);
  const [del, setDel] = useState<ParticipanteRow | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "participantes"] });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteParticipante(id),
    onSuccess: () => { toast.success("Removido"); refresh(); setDel(null); },
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Participantes"
        description="Ficha completa de cavaleiros e amazonas, vinculados às expedições."
        actions={<button className="admin-btn-primary" onClick={() => setNovo(true)}><Plus className="h-4 w-4" /> Novo participante</button>}
      />

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : list.length === 0 ? (
        <AdminEmpty icon={Users} titulo="Nenhum participante cadastrado" descricao="Cadastre cavaleiros para vincular a reservas e expedições." />
      ) : (
        <div className="admin-card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Nome</th>
                <th className="px-3 py-3.5 font-medium">Idade</th>
                <th className="px-3 py-3.5 font-medium">Experiência</th>
                <th className="px-3 py-3.5 font-medium">Expedição</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const exp = expedicoes.find((e) => e.id === p.expedicao_id);
                return (
                  <tr key={p.id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                    <td className="px-5 py-4">
                      <button className="font-medium text-[color:var(--admin-cinza-1)] hover:text-[color:var(--admin-dourado)]" onClick={() => setEdit(p)}>{p.nome}</button>
                      <div className="text-[11px] text-[color:var(--admin-cinza-3)]">{p.documento ?? "—"}</div>
                    </td>
                    <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{calcIdade(p.data_nascimento)}</td>
                    <td className="px-3 py-4 text-[color:var(--admin-cinza-2)] capitalize">{p.experiencia_equestre ?? "—"}</td>
                    <td className="px-3 py-4 text-[color:var(--admin-cinza-2)] truncate max-w-[200px]">{exp?.nome ?? "—"}</td>
                    <td className="px-3 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => setDel(p)} className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ParticipanteDialog
        open={novo}
        onOpenChange={setNovo}
        expedicoes={expedicoes}
        onSaved={refresh}
      />
      {edit ? (
        <ParticipanteDialog
          open={!!edit}
          onOpenChange={(v) => !v && setEdit(null)}
          expedicoes={expedicoes}
          initial={edit}
          onSaved={refresh}
        />
      ) : null}

      <ConfirmDialog open={!!del} onOpenChange={(v) => !v && setDel(null)} title="Remover participante" destructive onConfirm={() => { if (del) delMut.mutate(del.id); }} />
    </div>
  );
}

function ParticipanteDialog({
  open, onOpenChange, expedicoes, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expedicoes: { id: string; nome: string }[];
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
          <AdminField label="Grupo / reserva (opcional)" hint="UUID da reserva quando o participante faz parte de um grupo">
            <input className="admin-input font-mono text-xs" value={form.reserva_id ?? ""} onChange={(e) => setForm({ ...form, reserva_id: e.target.value || null })} placeholder="Ex.: id da reserva 'Empresa Josefina'" />
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
