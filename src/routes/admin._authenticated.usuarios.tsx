import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, Power, KeyRound, Shield, Search, Mail } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import {
  listUsuariosInternos,
  criarUsuarioInterno,
  atualizarRoleUsuario,
  redefinirSenhaUsuario,
  alternarAtivoUsuario,
  ROLE_LABELS,
  CARGOS_EQUIPE,
  type AppRole,
  type UsuarioInternoRow,
} from "@/lib/admin/api";
import { listCargos, type CargoRow } from "@/lib/admin/cargos-api";
import { useCan } from "@/hooks/use-permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/_authenticated/usuarios")({
  component: UsuariosPage,
});

const ROLES_ATRIBUIVEIS: AppRole[] = ["admin", "ceo", "ceo_preview", "socia", "operador"];

function UsuariosPage() {
  const { canEdit } = useCan("usuarios");
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [editAlvo, setEditAlvo] = useState<UsuarioInternoRow | null>(null);
  const [resetAlvo, setResetAlvo] = useState<UsuarioInternoRow | null>(null);
  const [toggleAlvo, setToggleAlvo] = useState<UsuarioInternoRow | null>(null);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["admin", "usuarios"],
    queryFn: listUsuariosInternos,
  });
  const { data: cargos = [] } = useQuery({
    queryKey: ["admin", "cargos"],
    queryFn: listCargos,
  });

  // Tempo de último login (lido em paralelo do profiles)
  const { data: ultimos = {} } = useQuery({
    queryKey: ["admin", "ultimos-login"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, ultimo_login");
      const m: Record<string, string | null> = {};
      for (const p of data ?? []) m[p.user_id] = (p as { ultimo_login?: string | null }).ultimo_login ?? null;
      return m;
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) => alternarAtivoUsuario(id, ativo),
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
      setToggleAlvo(null);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const filtrados = usuarios.filter((u) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      (u.nome ?? "").toLowerCase().includes(q) ||
      (u.cargo ?? "").toLowerCase().includes(q) ||
      (u.role ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Equipe"
        title="Usuários"
        description="Gestão da equipe interna — quem acessa o painel, com qual cargo e nível de permissão."
        actions={
          canEdit ? (
            <button className="admin-btn-primary" onClick={() => setNovoOpen(true)}>
              <UserPlus className="h-4 w-4" /> Novo usuário
            </button>
          ) : null
        }
      />

      <div className="admin-card">
        <div className="flex items-center gap-3 border-b border-[color:var(--admin-borda)] pb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[color:var(--admin-cinza-3)]" />
            <input
              className="admin-input w-full pl-9"
              placeholder="Buscar por nome, cargo ou papel..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <span className="text-xs text-[color:var(--admin-cinza-3)]">
            {filtrados.length} usuário{filtrados.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-[color:var(--admin-cinza-3)]">Carregando...</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--admin-borda)] text-left text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
                  <th className="py-3 pl-2">Usuário</th>
                  <th className="py-3">Cargo</th>
                  <th className="py-3">Papel</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Último acesso</th>
                  <th className="py-3 pr-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.user_id} className="border-b border-[color:var(--admin-borda)]/60 hover:bg-[color:var(--admin-petroleo-soft)]/30">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-sm text-[color:var(--admin-dourado-glow)]">
                            {(u.nome ?? "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[color:var(--admin-cinza-1)]">{u.nome ?? "(sem nome)"}</div>
                          <div className="text-xs text-[color:var(--admin-cinza-3)]">{u.user_id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[color:var(--admin-cinza-2)]">{u.cargo ?? "—"}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--admin-petroleo)] px-2 py-1 text-[11px] text-[color:var(--admin-dourado-glow)]">
                        <Shield className="h-3 w-3" /> {u.role ? ROLE_LABELS[u.role] : "—"}
                      </span>
                    </td>
                    <td className="py-3">
                      {u.ativo ? (
                        <span className="text-xs text-emerald-300">Ativo</span>
                      ) : (
                        <span className="text-xs text-rose-300">Inativo</span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-[color:var(--admin-cinza-3)]">
                      {ultimos[u.user_id] ? new Date(ultimos[u.user_id]!).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="py-3 pr-2">
                      <div className="flex justify-end gap-1.5">
                        {canEdit && (
                          <>
                            <button className="admin-btn-ghost" onClick={() => setEditAlvo(u)} title="Editar papel/cargo">
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                            <button className="admin-btn-ghost" onClick={() => setResetAlvo(u)} title="Redefinir senha">
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            <button
                              className="admin-btn-ghost"
                              onClick={() => setToggleAlvo(u)}
                              title={u.ativo ? "Desativar" : "Ativar"}
                            >
                              <Power className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-[color:var(--admin-cinza-3)]">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {novoOpen && (
        <NovoUsuarioDialog
          cargos={cargos}
          onClose={() => setNovoOpen(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
            setNovoOpen(false);
          }}
        />
      )}

      {editAlvo && (
        <EditarPapelDialog
          alvo={editAlvo}
          cargos={cargos}
          onClose={() => setEditAlvo(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin", "usuarios"] });
            setEditAlvo(null);
          }}
        />
      )}

      {resetAlvo && (
        <ResetSenhaDialog
          alvo={resetAlvo}
          onClose={() => setResetAlvo(null)}
          onSaved={() => setResetAlvo(null)}
        />
      )}

      <ConfirmDialog
        open={!!toggleAlvo}
        onOpenChange={(v) => !v && setToggleAlvo(null)}
        title={toggleAlvo?.ativo ? "Desativar usuário?" : "Reativar usuário?"}
        description={
          toggleAlvo?.ativo
            ? `${toggleAlvo?.nome ?? toggleAlvo?.user_id} perderá acesso ao painel.`
            : `${toggleAlvo?.nome ?? toggleAlvo?.user_id} terá o acesso liberado novamente.`
        }
        confirmLabel={toggleAlvo?.ativo ? "Desativar" : "Reativar"}
        destructive={toggleAlvo?.ativo}
        onConfirm={() => { if (toggleAlvo) toggleMut.mutate({ id: toggleAlvo.user_id, ativo: !toggleAlvo.ativo }); }}
      />
    </div>
  );
}

function NovoUsuarioDialog({
  cargos,
  onClose,
  onCreated,
}: {
  cargos: CargoRow[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [cargo, setCargo] = useState<string>("");
  const [role, setRole] = useState<AppRole>("operador");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 8 || !nome.trim()) {
      toast.error("Preencha nome, e-mail e senha (mín. 8 caracteres)");
      return;
    }
    setBusy(true);
    try {
      await criarUsuarioInterno({ email: email.trim(), password, nome, cargo: cargo || null, role });
      toast.success("Usuário criado");
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="admin-card w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">Novo usuário</h3>
        <div className="grid gap-3">
          <Field label="Nome"><input className="admin-input w-full" value={nome} onChange={(e) => setNome(e.target.value)} /></Field>
          <Field label="E-mail"><input className="admin-input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Senha inicial (mín. 8)"><input className="admin-input w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Field label="Cargo">
            <select className="admin-input w-full" value={cargo} onChange={(e) => setCargo(e.target.value)}>
              <option value="">—</option>
              {cargos.filter((c) => c.ativo).map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
              {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Papel (RBAC)">
            <select className="admin-input w-full" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
              {ROLES_ATRIBUIVEIS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" onClick={submit} disabled={busy}>
            <Mail className="h-4 w-4" /> Criar usuário
          </button>
        </div>
      </div>
    </div>
  );
}

function EditarPapelDialog({
  alvo,
  cargos,
  onClose,
  onSaved,
}: {
  alvo: UsuarioInternoRow;
  cargos: CargoRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [role, setRole] = useState<AppRole>(alvo.role ?? "operador");
  const [cargo, setCargo] = useState<string>(alvo.cargo ?? "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await atualizarRoleUsuario(alvo.user_id, role, cargo || null);
      toast.success("Papel atualizado");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="admin-card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">Editar {alvo.nome ?? "usuário"}</h3>
        <Field label="Cargo">
          <select className="admin-input w-full" value={cargo} onChange={(e) => setCargo(e.target.value)}>
            <option value="">—</option>
            {cargos.filter((c) => c.ativo).map((c) => (
              <option key={c.id} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </Field>
        <Field label="Papel (RBAC)">
          <select className="admin-input w-full" value={role} onChange={(e) => setRole(e.target.value as AppRole)}>
            {ROLES_ATRIBUIVEIS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" onClick={submit} disabled={busy}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

function ResetSenhaDialog({
  alvo,
  onClose,
  onSaved,
}: {
  alvo: UsuarioInternoRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      toast.error("Senha mínima de 8 caracteres");
      return;
    }
    setBusy(true);
    try {
      await redefinirSenhaUsuario(alvo.user_id, password);
      toast.success("Senha redefinida");
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="admin-card w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl">Redefinir senha</h3>
        <p className="text-sm text-[color:var(--admin-cinza-2)]">
          Definir nova senha para <strong>{alvo.nome ?? alvo.user_id}</strong>.
        </p>
        <Field label="Nova senha"><input className="admin-input w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button className="admin-btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="admin-btn-primary" onClick={submit} disabled={busy}>Redefinir</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
