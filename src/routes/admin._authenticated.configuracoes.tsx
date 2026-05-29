import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Building2, Users, Shield, UserPlus, KeyRound, Trash2, Power } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getConfiguracoes,
  saveConfiguracoes,
  listUsuariosInternos,
  criarUsuarioInterno,
  atualizarRoleUsuario,
  redefinirSenhaUsuario,
  alternarAtivoUsuario,
  excluirUsuarioInterno,
  CARGOS_EQUIPE,
  type AppRole,
  type UsuarioInternoRow,
} from "@/lib/admin/api";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import { AdminPageIntro } from "@/components/admin/admin-page-intro";
import { EmDesenvolvimentoBanner } from "@/components/admin/em-desenvolvimento-banner";
import { useCan } from "@/hooks/use-permissions";

export const Route = createFileRoute("/admin/_authenticated/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const qc = useQueryClient();
  const { data: config } = useQuery({ queryKey: ["admin", "configuracoes"], queryFn: getConfiguracoes });
  const { data: usuarios = [] } = useQuery({ queryKey: ["admin", "usuarios-internos"], queryFn: listUsuariosInternos });

  const [aba, setAba] = useState<"empresa" | "usuarios">("empresa");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Operação"
        title="Configurações"
        description="Dados da empresa, canais de comunicação, identidade visual e equipe interna."
      />

      <div className="mb-4 flex gap-2 border-b border-[color:var(--admin-borda)]">
        <button onClick={() => setAba("empresa")} className={tabClass(aba === "empresa")}>
          <Building2 className="h-4 w-4" /> Empresa
        </button>
        <button onClick={() => setAba("usuarios")} className={tabClass(aba === "usuarios")}>
          <Users className="h-4 w-4" /> Equipe interna
        </button>
      </div>

      {aba === "empresa" ? (
        <EmpresaForm config={config ?? null} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "configuracoes"] })} />
      ) : (
        <UsuariosPanel usuarios={usuarios} onChange={() => qc.invalidateQueries({ queryKey: ["admin", "usuarios-internos"] })} />
      )}
    </div>
  );
}

function tabClass(active: boolean) {
  return `flex items-center gap-2 px-4 py-2.5 text-[13px] transition border-b-2 ${
    active ? "border-[color:var(--admin-dourado)] text-[color:var(--admin-cinza-1)]" : "border-transparent text-[color:var(--admin-cinza-3)]"
  }`;
}

// ---------------- EMPRESA ----------------

function EmpresaForm({ config, onSaved }: { config: Awaited<ReturnType<typeof getConfiguracoes>>; onSaved: () => void }) {
  const [form, setForm] = useState({
    empresa_nome: "", empresa_cnpj: "", endereco: "", email: "",
    whatsapp: "", instagram: "", logo_url: "", cor_destaque: "", emails_str: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        empresa_nome: config.empresa_nome ?? "",
        empresa_cnpj: config.empresa_cnpj ?? "",
        endereco: config.endereco ?? "",
        email: config.email ?? "",
        whatsapp: config.whatsapp ?? "",
        instagram: config.instagram ?? "",
        logo_url: config.logo_url ?? "",
        cor_destaque: config.cor_destaque ?? "",
        emails_str: (config.emails_notificacao ?? []).join(", "),
      });
    }
  }, [config]);

  const saveMut = useMutation({
    mutationFn: () => saveConfiguracoes({
      empresa_nome: form.empresa_nome || null,
      empresa_cnpj: form.empresa_cnpj || null,
      endereco: form.endereco || null,
      email: form.email || null,
      whatsapp: form.whatsapp || null,
      instagram: form.instagram || null,
      logo_url: form.logo_url || null,
      cor_destaque: form.cor_destaque || null,
      emails_notificacao: form.emails_str.split(",").map((s) => s.trim()).filter(Boolean),
    }),
    onSuccess: () => { toast.success("Configurações salvas"); onSaved(); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="admin-card space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome da empresa"><input className="admin-input w-full" value={form.empresa_nome} onChange={(e) => setForm({ ...form, empresa_nome: e.target.value })} /></Field>
        <Field label="CNPJ"><input className="admin-input w-full" value={form.empresa_cnpj} onChange={(e) => setForm({ ...form, empresa_cnpj: e.target.value })} /></Field>
        <Field label="WhatsApp oficial"><input className="admin-input w-full" placeholder="+55 35 99999-0000" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
        <Field label="Instagram"><input className="admin-input w-full" placeholder="@cavalgadas" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} /></Field>
        <Field label="E-mail oficial"><input className="admin-input w-full" placeholder="contato@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Logo (URL)"><input className="admin-input w-full" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></Field>
        <Field label="Cor de destaque (hex)"><input className="admin-input w-full" placeholder="#C9A84C" value={form.cor_destaque} onChange={(e) => setForm({ ...form, cor_destaque: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <Field label="Endereço"><input className="admin-input w-full" placeholder="Rua, número, cidade — UF" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></Field>
        </div>
        <div className="md:col-span-2">
          <Field label="E-mails de notificação (separados por vírgula)"><input className="admin-input w-full" placeholder="operacao@empresa.com, financeiro@empresa.com" value={form.emails_str} onChange={(e) => setForm({ ...form, emails_str: e.target.value })} /></Field>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="admin-btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          <Save className="h-4 w-4" /> Salvar configurações
        </button>
      </div>
    </div>
  );
}

// ---------------- USUÁRIOS ----------------

function UsuariosPanel({ usuarios, onChange }: { usuarios: UsuarioInternoRow[]; onChange: () => void }) {
  const [novoOpen, setNovoOpen] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", password: "", cargo: CARGOS_EQUIPE[1] as string, role: "operador" as AppRole });
  const [senhaModal, setSenhaModal] = useState<{ user_id: string; nome: string | null } | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmDel, setConfirmDel] = useState<UsuarioInternoRow | null>(null);

  const criarMut = useMutation({
    mutationFn: () => criarUsuarioInterno(novo),
    onSuccess: () => {
      toast.success(`Usuário ${novo.email} criado`);
      setNovo({ nome: "", email: "", password: "", cargo: CARGOS_EQUIPE[1] as string, role: "operador" });
      setNovoOpen(false);
      onChange();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const roleMut = useMutation({
    mutationFn: ({ user_id, role, cargo }: { user_id: string; role: AppRole; cargo?: string | null }) =>
      atualizarRoleUsuario(user_id, role, cargo),
    onSuccess: () => { toast.success("Atualizado"); onChange(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const senhaMut = useMutation({
    mutationFn: ({ user_id, password }: { user_id: string; password: string }) =>
      redefinirSenhaUsuario(user_id, password),
    onSuccess: () => { toast.success("Senha redefinida"); setSenhaModal(null); setNovaSenha(""); },
    onError: (e) => toast.error((e as Error).message),
  });

  const ativoMut = useMutation({
    mutationFn: ({ user_id, ativo }: { user_id: string; ativo: boolean }) =>
      alternarAtivoUsuario(user_id, ativo),
    onSuccess: () => { toast.success("Status atualizado"); onChange(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const delMut = useMutation({
    mutationFn: (user_id: string) => excluirUsuarioInterno(user_id),
    onSuccess: () => { toast.success("Usuário excluído"); setConfirmDel(null); onChange(); },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <div className="admin-card flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-display text-[15px] text-[color:var(--admin-cinza-1)]">Equipe interna</h3>
          <p className="mt-1 text-[12px] text-[color:var(--admin-cinza-3)] max-w-xl leading-relaxed">
            O administrador cria diretamente cada usuário com e-mail e senha provisória. Não há envio de convite por e-mail. O usuário poderá editar seu próprio perfil após o primeiro login.
          </p>
        </div>
        <button className="admin-btn-primary shrink-0" onClick={() => setNovoOpen((v) => !v)}>
          <UserPlus className="h-4 w-4" /> {novoOpen ? "Cancelar" : "Novo usuário"}
        </button>
      </div>

      {novoOpen && (
        <div className="admin-card space-y-3">
          <h4 className="font-display text-[14px] text-[color:var(--admin-cinza-1)]">Cadastrar usuário interno</h4>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Nome completo"><input className="admin-input w-full" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} /></Field>
            <Field label="E-mail"><input type="email" className="admin-input w-full" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} /></Field>
            <Field label="Senha provisória (mín. 8 caracteres)"><input type="text" className="admin-input w-full font-mono" value={novo.password} onChange={(e) => setNovo({ ...novo, password: e.target.value })} /></Field>
            <Field label="Cargo na empresa">
              <select className="admin-input w-full" value={novo.cargo} onChange={(e) => setNovo({ ...novo, cargo: e.target.value })}>
                {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Papel no sistema">
              <select className="admin-input w-full" value={novo.role} onChange={(e) => setNovo({ ...novo, role: e.target.value as AppRole })}>
                <option value="operador">Operador (acesso operacional)</option>
                <option value="admin">Administrador (acesso total)</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <button className="admin-btn-ghost" onClick={() => setNovoOpen(false)}>Cancelar</button>
            <button
              className="admin-btn-primary"
              disabled={!novo.email || !novo.password || novo.password.length < 8 || criarMut.isPending}
              onClick={() => criarMut.mutate()}
            >
              <UserPlus className="h-4 w-4" /> Criar usuário
            </button>
          </div>
        </div>
      )}

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-left text-sm min-w-[760px]">
          <thead className="bg-[color:var(--admin-carvao-deep)]/60 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
            <tr>
              <th className="px-5 py-3.5 font-medium">Usuário</th>
              <th className="px-3 py-3.5 font-medium">Cargo</th>
              <th className="px-3 py-3.5 font-medium">Papel</th>
              <th className="px-3 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[color:var(--admin-cinza-3)]">Nenhum usuário interno cadastrado ainda.</td></tr>
            ) : usuarios.map((u) => (
              <tr key={u.user_id} className="border-t border-[color:var(--admin-borda)] hover:bg-[color:var(--admin-petroleo)]/20">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover ring-1 ring-[color:var(--admin-borda)]" />
                    ) : (
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-[12px] text-[color:var(--admin-dourado-glow)]">
                        {(u.nome ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-[color:var(--admin-cinza-1)]">{u.nome ?? "Sem nome"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <select
                    className="admin-input h-8 text-[12px]"
                    value={u.cargo ?? ""}
                    onChange={(e) => roleMut.mutate({ user_id: u.user_id, role: u.role ?? "operador", cargo: e.target.value || null })}
                  >
                    <option value="">—</option>
                    {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-3 py-4">
                  <select
                    className="admin-input h-8 text-[12px]"
                    value={u.role ?? "operador"}
                    onChange={(e) => roleMut.mutate({ user_id: u.user_id, role: e.target.value as AppRole })}
                  >
                    <option value="operador">Operador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </td>
                <td className="px-3 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ${u.ativo ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
                    <Shield className="h-3 w-3" /> {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button className="admin-btn-ghost px-2 py-1.5" title="Redefinir senha" onClick={() => setSenhaModal({ user_id: u.user_id, nome: u.nome })}>
                      <KeyRound className="h-3.5 w-3.5" />
                    </button>
                    <button className="admin-btn-ghost px-2 py-1.5" title={u.ativo ? "Desativar" : "Reativar"} onClick={() => ativoMut.mutate({ user_id: u.user_id, ativo: !u.ativo })}>
                      <Power className="h-3.5 w-3.5" />
                    </button>
                    <button className="admin-btn-ghost px-2 py-1.5 hover:!bg-rose-500/10 hover:!text-rose-300" title="Excluir" onClick={() => setConfirmDel(u)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {senhaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSenhaModal(null)}>
          <div className="admin-card w-full max-w-md space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-[15px]">Redefinir senha — {senhaModal.nome ?? "usuário"}</h3>
            <input type="text" className="admin-input w-full font-mono" placeholder="Nova senha (mín. 8 caracteres)" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="admin-btn-ghost" onClick={() => setSenhaModal(null)}>Cancelar</button>
              <button
                className="admin-btn-primary"
                disabled={novaSenha.length < 8 || senhaMut.isPending}
                onClick={() => senhaMut.mutate({ user_id: senhaModal.user_id, password: novaSenha })}
              >
                <KeyRound className="h-4 w-4" /> Redefinir
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        onOpenChange={(v) => !v && setConfirmDel(null)}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir "${confirmDel?.nome ?? confirmDel?.user_id ?? ""}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => { if (confirmDel) delMut.mutate(confirmDel.user_id); }}
      />
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
