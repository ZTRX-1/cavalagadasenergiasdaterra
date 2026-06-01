import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Plus, Copy, Power, Lock, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { useCan } from "@/hooks/use-permissions";
import {
  listCargos,
  listCargoPermissoes,
  createCargo,
  updateCargo,
  deleteCargo,
  duplicateCargo,
  setPermissao,
  setPermissoesEmLote,
  MODULOS_PERMISSAO,
  ACOES_PERMISSAO,
  type CargoRow,
  type CargoPermissaoRow,
  type AcaoPermissao,
} from "@/lib/admin/cargos-api";

export const Route = createFileRoute("/admin/_authenticated/cargos")({
  component: CargosPage,
});

function CargosPage() {
  const { canEdit } = useCan("cargos");
  const qc = useQueryClient();
  const { data: cargos = [] } = useQuery({ queryKey: ["admin", "cargos"], queryFn: listCargos });
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<CargoRow | null>(null);

  useEffect(() => {
    if (!selecionado && cargos.length > 0) setSelecionado(cargos[0].id);
  }, [cargos, selecionado]);

  const cargoAtual = cargos.find((c) => c.id === selecionado) ?? null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Governança"
        title="Cargos & permissões"
        description="Defina cargos e configure granularmente o que cada um pode visualizar, criar, editar e excluir."
        actions={
          canEdit ? (
            <button className="admin-btn-primary" onClick={() => setNovoOpen(true)}>
              <Plus className="h-4 w-4" /> Novo cargo
            </button>
          ) : null
        }
      />

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de cargos */}
        <div className="admin-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--admin-borda)] text-[11px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
            Cargos ({cargos.length})
          </div>
          <ul className="divide-y divide-[color:var(--admin-borda)]/60">
            {cargos.map((c) => (
              <li key={c.id}>
                <button
                  className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 ${
                    selecionado === c.id
                      ? "bg-[color:var(--admin-petroleo-soft)]/40"
                      : "hover:bg-[color:var(--admin-petroleo-soft)]/20"
                  } ${!c.ativo ? "opacity-50" : ""}`}
                  onClick={() => setSelecionado(c.id)}
                >
                  <span
                    className="grid h-9 w-9 place-items-center rounded-md text-[color:var(--admin-carvao-deep)]"
                    style={{ backgroundColor: c.cor ?? "var(--admin-dourado)" }}
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--admin-cinza-1)]">
                      {c.nome}
                      {c.protegido && (
                        <Lock className="h-3 w-3 text-amber-300" />
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--admin-cinza-3)] truncate">{c.descricao ?? "—"}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Painel direito */}
        {cargoAtual ? (
          <CargoEditor
            cargo={cargoAtual}
            canEdit={canEdit && !cargoAtual.protegido}
            onChangedMeta={() => qc.invalidateQueries({ queryKey: ["admin", "cargos"] })}
            onDuplicar={async () => {
              try {
                const novo = await duplicateCargo(cargoAtual);
                toast.success("Cargo duplicado");
                qc.invalidateQueries({ queryKey: ["admin", "cargos"] });
                setSelecionado(novo.id);
              } catch (e) {
                toast.error((e as Error).message);
              }
            }}
            onExcluir={() => setExcluirAlvo(cargoAtual)}
          />
        ) : (
          <div className="admin-card grid place-items-center text-sm text-[color:var(--admin-cinza-3)]">
            Selecione um cargo
          </div>
        )}
      </div>

      {novoOpen && (
        <NovoCargoDialog
          onClose={() => setNovoOpen(false)}
          onCreated={(c) => {
            qc.invalidateQueries({ queryKey: ["admin", "cargos"] });
            setSelecionado(c.id);
            setNovoOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!excluirAlvo}
        onOpenChange={(v) => !v && setExcluirAlvo(null)}
        title="Excluir cargo?"
        description={`O cargo "${excluirAlvo?.nome}" e todas as suas permissões serão removidos.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={async () => {
          if (!excluirAlvo) return;
          try {
            await deleteCargo(excluirAlvo.id);
            toast.success("Cargo excluído");
            qc.invalidateQueries({ queryKey: ["admin", "cargos"] });
            setExcluirAlvo(null);
            setSelecionado(null);
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}

function CargoEditor({
  cargo,
  canEdit,
  onChangedMeta,
  onDuplicar,
  onExcluir,
}: {
  cargo: CargoRow;
  canEdit: boolean;
  onChangedMeta: () => void;
  onDuplicar: () => void;
  onExcluir: () => void;
}) {
  const qc = useQueryClient();
  const { data: perms = [] } = useQuery({
    queryKey: ["admin", "cargo-permissoes", cargo.id],
    queryFn: () => listCargoPermissoes(cargo.id),
  });

  const permMap = useMemo(() => {
    const m = new Map<string, CargoPermissaoRow>();
    for (const p of perms) m.set(`${p.modulo}:${p.acao}`, p);
    return m;
  }, [perms]);

  const togglePerm = async (modulo: string, acao: AcaoPermissao, value: boolean) => {
    try {
      await setPermissao(cargo.id, modulo, acao, value);
      qc.invalidateQueries({ queryKey: ["admin", "cargo-permissoes", cargo.id] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleLinha = async (modulo: string, value: boolean) => {
    try {
      await setPermissoesEmLote(cargo.id, modulo, value);
      qc.invalidateQueries({ queryKey: ["admin", "cargo-permissoes", cargo.id] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleAtivo = async () => {
    try {
      await updateCargo(cargo.id, { ativo: !cargo.ativo });
      toast.success(cargo.ativo ? "Cargo desativado" : "Cargo reativado");
      onChangedMeta();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho do cargo */}
      <div className="admin-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl">{cargo.nome}</h3>
              {cargo.protegido && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-amber-200">
                  <Lock className="h-2.5 w-2.5" /> protegido
                </span>
              )}
              {!cargo.ativo && (
                <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rose-200">
                  inativo
                </span>
              )}
            </div>
            <p className="text-sm text-[color:var(--admin-cinza-2)]">{cargo.descricao ?? "Sem descrição"}</p>
            <p className="text-[11px] text-[color:var(--admin-cinza-3)]">chave: <code>{cargo.chave}</code></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="admin-btn-ghost" onClick={onDuplicar}>
              <Copy className="h-3.5 w-3.5" /> Duplicar
            </button>
            {!cargo.protegido && (
              <>
                <button className="admin-btn-ghost" onClick={toggleAtivo} disabled={!canEdit}>
                  <Power className="h-3.5 w-3.5" /> {cargo.ativo ? "Desativar" : "Reativar"}
                </button>
                <button className="admin-btn-ghost text-rose-300" onClick={onExcluir} disabled={!canEdit}>
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Matriz de permissões */}
      <div className="admin-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--admin-borda)] flex items-center justify-between">
          <div>
            <h4 className="font-medium text-[color:var(--admin-cinza-1)]">Permissões</h4>
            <p className="text-[11px] text-[color:var(--admin-cinza-3)]">
              Marque as ações permitidas em cada módulo.
            </p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--admin-borda)] text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
                <th className="py-3 pl-4 text-left">Módulo</th>
                {ACOES_PERMISSAO.map((a) => (
                  <th key={a} className="py-3 px-3 text-center">{a}</th>
                ))}
                <th className="py-3 pr-4 text-right">Todas</th>
              </tr>
            </thead>
            <tbody>
              {MODULOS_PERMISSAO.map((m) => {
                const all = ACOES_PERMISSAO.every((a) => permMap.get(`${m.chave}:${a}`)?.permitido);
                return (
                  <tr key={m.chave} className="border-b border-[color:var(--admin-borda)]/40">
                    <td className="py-2 pl-4 font-medium text-[color:var(--admin-cinza-1)]">{m.nome}</td>
                    {ACOES_PERMISSAO.map((a) => {
                      const checked = permMap.get(`${m.chave}:${a}`)?.permitido ?? false;
                      return (
                        <td key={a} className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canEdit}
                            onChange={(e) => togglePerm(m.chave, a, e.target.checked)}
                            className="h-4 w-4 cursor-pointer accent-[color:var(--admin-dourado)]"
                          />
                        </td>
                      );
                    })}
                    <td className="py-2 pr-4 text-right">
                      <button
                        className="text-[11px] text-[color:var(--admin-dourado-glow)] hover:underline disabled:opacity-40"
                        disabled={!canEdit}
                        onClick={() => toggleLinha(m.chave, !all)}
                      >
                        {all ? "Limpar" : "Marcar todas"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NovoCargoDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (c: CargoRow) => void }) {
  const [nome, setNome] = useState("");
  const [chave, setChave] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#f0c674");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome");
      return;
    }
    setBusy(true);
    try {
      const slug = (chave || nome).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const c = await createCargo({ chave: slug, nome, descricao: descricao || null, cor });
      toast.success("Cargo criado");
      onCreated(c);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="admin-card w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">Novo cargo</h3>
        <div className="grid gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Nome</span>
            <input className="admin-input w-full mt-1.5" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Chave (opcional)</span>
            <input className="admin-input w-full mt-1.5" placeholder="derivado do nome" value={chave} onChange={(e) => setChave(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Descrição</span>
            <textarea className="admin-input w-full mt-1.5 min-h-[80px]" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Cor</span>
            <input type="color" className="mt-1.5 h-10 w-20 rounded-md border border-[color:var(--admin-borda)] bg-transparent" value={cor} onChange={(e) => setCor(e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" onClick={submit} disabled={busy}>Criar cargo</button>
        </div>
      </div>
    </div>
  );
}
