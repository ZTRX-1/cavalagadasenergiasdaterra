import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Compass, Plus, Pencil, Copy, Trash2, Archive, PlayCircle, PauseCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminEmpty } from "@/components/admin/admin-empty";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import {
  listExpedicoes,
  createExpedicao,
  duplicateExpedicao,
  deleteExpedicao,
  updateExpedicao,
  type ExpedicaoRow,
} from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/expedicoes")({
  component: ExpedicoesPage,
});

function ExpedicoesPage() {
  const qc = useQueryClient();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const [confirmDel, setConfirmDel] = useState<ExpedicaoRow | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "expedicoes"] });

  const novaMut = useMutation({
    mutationFn: () => createExpedicao({ nome: "Nova expedição", status: "rascunho" }),
    onSuccess: (row) => {
      toast.success("Expedição criada");
      refresh();
      window.location.href = `/admin/expedicoes/${row.id}`;
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const dupMut = useMutation({
    mutationFn: (id: string) => duplicateExpedicao(id),
    onSuccess: () => { toast.success("Duplicada"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteExpedicao(id),
    onSuccess: () => { toast.success("Excluída"); refresh(); setConfirmDel(null); },
    onError: (e) => toast.error((e as Error).message),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExpedicaoRow["status"] }) =>
      updateExpedicao(id, { status }),
    onSuccess: () => { toast.success("Status atualizado"); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Expedições"
        description="Gerencie todas as expedições, mídia, datas e publicação no site."
        actions={
          <button className="admin-btn-primary" onClick={() => novaMut.mutate()} disabled={novaMut.isPending}>
            <Plus className="h-4 w-4" /> Nova expedição
          </button>
        }
      />

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : list.length === 0 ? (
        <AdminEmpty
          icon={Compass}
          titulo="Nenhuma expedição ainda"
          descricao="Crie sua primeira expedição para começar a publicar no site."
          acao={
            <button className="admin-btn-primary" onClick={() => novaMut.mutate()}>
              <Plus className="h-4 w-4" /> Criar agora
            </button>
          }
        />
      ) : (
        <div className="admin-card overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
              <tr>
                <th className="px-5 py-3.5 font-medium">Expedição</th>
                <th className="px-3 py-3.5 font-medium">Marca</th>
                <th className="px-3 py-3.5 font-medium">Status</th>
                <th className="px-3 py-3.5 font-medium">Valor</th>
                <th className="px-5 py-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {e.capa_url || e.imagem_url ? (
                        <img src={e.capa_url ?? e.imagem_url ?? ""} alt="" className="h-11 w-16 rounded-md object-cover ring-1 ring-[color:var(--admin-borda)]" />
                      ) : (
                        <div className="h-11 w-16 rounded-md bg-[color:var(--admin-petroleo)]" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-[color:var(--admin-cinza-1)] truncate">{e.nome}</div>
                        <div className="text-[11px] text-[color:var(--admin-cinza-3)] truncate">{e.regiao ?? e.cidade ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)] capitalize">{e.marca?.replace(/-/g, " ")}</td>
                  <td className="px-3 py-4"><StatusBadge status={e.status} /></td>
                  <td className="px-3 py-4 text-[color:var(--admin-cinza-2)]">{e.moeda} {Number(e.preco).toLocaleString("pt-BR")}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link to="/admin/expedicoes/$id" params={{ id: e.id }} className="admin-btn-ghost px-2 py-1.5" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      {e.status === "publicado" ? (
                        <button className="admin-btn-ghost px-2 py-1.5" title="Pausar" onClick={() => statusMut.mutate({ id: e.id, status: "pausado" })}>
                          <PauseCircle className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button className="admin-btn-ghost px-2 py-1.5" title="Publicar" onClick={() => statusMut.mutate({ id: e.id, status: "publicado" })}>
                          <PlayCircle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button className="admin-btn-ghost px-2 py-1.5" title="Arquivar" onClick={() => statusMut.mutate({ id: e.id, status: "arquivado" })}>
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button className="admin-btn-ghost px-2 py-1.5" title="Duplicar" onClick={() => dupMut.mutate(e.id)}>
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10 hover:!text-rose-300" title="Excluir" onClick={() => setConfirmDel(e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir expedição"
        description={`Esta ação não pode ser desfeita. "${confirmDel?.nome ?? ""}" será removida permanentemente.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => { if (confirmDel) delMut.mutate(confirmDel.id); }}
      />
    </div>
  );
}
