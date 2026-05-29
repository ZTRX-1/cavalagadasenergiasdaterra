import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { getExpedicaoImage } from "@/lib/expedicao-images";

export const Route = createFileRoute("/admin/_authenticated/expedicoes/")({
  component: ExpedicoesPage,
});

const STATUS_FILTROS: { id: ExpedicaoRow["status"] | "todos"; label: string }[] = [
  { id: "todos", label: "Todas" },
  { id: "publicado", label: "Publicadas" },
  { id: "rascunho", label: "Rascunho" },
  { id: "pausado", label: "Pausadas" },
  { id: "arquivado", label: "Arquivadas" },
];

function ExpedicoesPage() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: list = [], isLoading } = useQuery({ queryKey: ["admin", "expedicoes"], queryFn: listExpedicoes });
  const [confirmDel, setConfirmDel] = useState<ExpedicaoRow | null>(null);
  const [filtro, setFiltro] = useState<ExpedicaoRow["status"] | "todos">("todos");
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaForm, setNovaForm] = useState({ nome: "", marca: "cavalgadas", pais: "brasil" });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "expedicoes"] });

  const novaMut = useMutation({
    mutationFn: () =>
      createExpedicao({
        nome: novaForm.nome.trim() || "Nova expedição",
        marca: novaForm.marca,
        pais: novaForm.pais,
        status: "rascunho",
      }),
    onSuccess: (row) => {
      qc.setQueryData(["admin", "expedicao", row.id], row);
      setNovaOpen(false);
      setNovaForm({ nome: "", marca: "cavalgadas", pais: "brasil" });
      nav({ to: "/admin/expedicoes/$id", params: { id: row.id } });
      qc.invalidateQueries({ queryKey: ["admin", "expedicoes"] });
      toast.success("Expedição criada — configure os dados");
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

  const contadores = {
    todos: list.length,
    publicado: list.filter((e) => e.status === "publicado").length,
    rascunho: list.filter((e) => e.status === "rascunho").length,
    pausado: list.filter((e) => e.status === "pausado").length,
    arquivado: list.filter((e) => e.status === "arquivado").length,
  };

  const listaFiltrada = filtro === "todos" ? list : list.filter((e) => e.status === filtro);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Expedições"
        description="Gerencie todas as expedições, mídia, datas e publicação no site."
        actions={
          <button className="admin-btn-primary" onClick={() => setNovaOpen(true)}>
            <Plus className="h-4 w-4" /> Nova expedição
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTROS.map((f) => {
          const count = contadores[f.id as keyof typeof contadores];
          const active = filtro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] transition ${
                active
                  ? "bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao-deep)]"
                  : "border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:border-[color:var(--admin-dourado)]/40"
              }`}
            >
              <span>{f.label}</span>
              <span className={`tabular-nums text-[11px] ${active ? "" : "text-[color:var(--admin-cinza-3)]"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="admin-card h-40 animate-pulse" />
      ) : listaFiltrada.length === 0 ? (
        <AdminEmpty
          icon={Compass}
          titulo={filtro === "todos" ? "Nenhuma expedição ainda" : "Nenhuma expedição neste status"}
          descricao="Crie sua primeira expedição para começar a publicar no site."
          acao={
            <button className="admin-btn-primary" onClick={() => setNovaOpen(true)}>
              <Plus className="h-4 w-4" /> Criar agora
            </button>
          }
        />
      ) : (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-left text-sm min-w-[680px]">
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
              {listaFiltrada.map((e) => (
                <tr key={e.id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const capa = (e as ExpedicaoRow & { _capa?: string | null })._capa || getExpedicaoImage(e.slug);
                        return (
                          <img
                            src={capa}
                            alt=""
                            className="h-11 w-16 rounded-md object-cover ring-1 ring-[color:var(--admin-borda)]"
                          />
                        );
                      })()}
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

      {/* Modal nova expedição */}
      {novaOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setNovaOpen(false)}>
          <div className="admin-card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Nova expedição</div>
              <h3 className="mt-1 font-display text-lg text-[color:var(--admin-cinza-1)]">Comece pelo essencial</h3>
              <p className="mt-1 text-xs text-[color:var(--admin-cinza-3)]">Depois você completa fotos, roteiro, datas e preço.</p>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">Nome</span>
                <input className="admin-input" autoFocus value={novaForm.nome} onChange={(e) => setNovaForm({ ...novaForm, nome: e.target.value })} placeholder="Ex: Serra do Cipó" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">Marca</span>
                  <select className="admin-input" value={novaForm.marca} onChange={(e) => setNovaForm({ ...novaForm, marca: e.target.value })}>
                    <option value="cavalgadas">Cavalgadas</option>
                    <option value="canastra-a-cavalo">Canastra a Cavalo</option>
                    <option value="elas-na-sela">Elas na Sela</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">País</span>
                  <input className="admin-input" value={novaForm.pais} onChange={(e) => setNovaForm({ ...novaForm, pais: e.target.value })} placeholder="brasil" />
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button className="admin-btn-ghost" onClick={() => setNovaOpen(false)}>Cancelar</button>
              <button className="admin-btn-primary" onClick={() => novaMut.mutate()} disabled={novaMut.isPending || !novaForm.nome.trim()}>
                <Plus className="h-4 w-4" /> Criar e abrir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
