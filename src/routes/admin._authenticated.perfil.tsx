import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Upload, Shield, KeyRound, Clock, CalendarDays, Eye, EyeOff } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getMeuPerfil, atualizarMeuPerfil, uploadAvatar, alterarMinhaSenha, CARGOS_EQUIPE } from "@/lib/admin/api";

export const Route = createFileRoute("/admin/_authenticated/perfil")({
  component: PerfilPage,
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
}

function formatDay(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("pt-BR", { dateStyle: "medium" });
  } catch {
    return value;
  }
}

function PerfilPage() {
  const qc = useQueryClient();
  const { data: perfil } = useQuery({ queryKey: ["admin", "meu-perfil"], queryFn: getMeuPerfil });
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", bio: "", telefone: "", avatar_url: "" });
  const [pwd, setPwd] = useState({ nova: "", confirma: "" });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (perfil) setForm({
      nome: perfil.nome ?? "",
      cargo: perfil.cargo ?? "",
      bio: perfil.bio ?? "",
      telefone: perfil.telefone ?? "",
      avatar_url: perfil.avatar_url ?? "",
    });
  }, [perfil]);

  const saveMut = useMutation({
    mutationFn: () => atualizarMeuPerfil({
      nome: form.nome || null,
      cargo: form.cargo || null,
      bio: form.bio || null,
      telefone: form.telefone || null,
      avatar_url: form.avatar_url || null,
    }),
    onSuccess: () => { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const pwdMut = useMutation({
    mutationFn: () => alterarMinhaSenha(pwd.nova),
    onSuccess: () => { toast.success("Senha alterada com sucesso"); setPwd({ nova: "", confirma: "" }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const onPickFile = async (file: File) => {
    try {
      const url = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.success("Foto enviada — clique em Salvar para confirmar");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleChangePassword = () => {
    if (pwd.nova.length < 8) { toast.error("A nova senha deve ter pelo menos 8 caracteres."); return; }
    if (pwd.nova !== pwd.confirma) { toast.error("As senhas não conferem."); return; }
    pwdMut.mutate();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader eyebrow="Conta" title="Meu perfil" description="Suas informações pessoais, cargo e segurança da conta." />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div className="admin-card text-center space-y-3">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="" className="mx-auto h-32 w-32 rounded-full object-cover ring-2 ring-[color:var(--admin-dourado)]/40" />
            ) : (
              <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-3xl text-[color:var(--admin-dourado-glow)]">
                {(form.nome || perfil?.email || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
            <button className="admin-btn-ghost mx-auto" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Trocar foto
            </button>
            <p className="text-[11px] text-[color:var(--admin-cinza-3)]">JPG, PNG ou WebP · máx. 2 MB</p>
            {perfil?.role && (
              <div className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--admin-petroleo)] px-2 py-1 text-[11px] text-[color:var(--admin-dourado-glow)]">
                <Shield className="h-3 w-3" /> {perfil.role}
              </div>
            )}
          </div>

          <div className="admin-card space-y-3">
            <h3 className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">Atividade da conta</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 h-3.5 w-3.5 text-[color:var(--admin-dourado-glow)]" />
                <div>
                  <div className="text-[color:var(--admin-cinza-3)]">Cargo</div>
                  <div className="text-[color:var(--admin-cinza-1)]">{perfil?.cargo_nome ?? perfil?.cargo ?? "—"}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 text-[color:var(--admin-dourado-glow)]" />
                <div>
                  <div className="text-[color:var(--admin-cinza-3)]">Data de entrada</div>
                  <div className="text-[color:var(--admin-cinza-1)]">{formatDay(perfil?.data_entrada ?? null)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 text-[color:var(--admin-dourado-glow)]" />
                <div>
                  <div className="text-[color:var(--admin-cinza-3)]">Último acesso</div>
                  <div className="text-[color:var(--admin-cinza-1)]">{formatDate(perfil?.ultimo_login ?? null)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="admin-card space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nome completo"><input className="admin-input w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></Field>
              <Field label="E-mail (somente leitura)"><input disabled className="admin-input w-full opacity-60" value={perfil?.email ?? ""} /></Field>
              <Field label="Cargo (rótulo livre)">
                <select className="admin-input w-full" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })}>
                  <option value="">—</option>
                  {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Telefone"><input className="admin-input w-full" placeholder="+55 35 99999-0000" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></Field>
              <div className="md:col-span-2">
                <Field label="Biografia curta"><textarea className="admin-input w-full min-h-[120px]" placeholder="Conte um pouco sobre você, sua função e experiência." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="admin-btn-primary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
                <Save className="h-4 w-4" /> Salvar perfil
              </button>
            </div>
          </div>

          <div className="admin-card space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[color:var(--admin-dourado-glow)]" />
              <h3 className="text-sm font-medium text-[color:var(--admin-cinza-1)]">Alterar senha</h3>
            </div>
            <p className="text-xs text-[color:var(--admin-cinza-3)]">
              Use uma senha forte com pelo menos 8 caracteres. Após alterar, sua sessão atual permanece ativa.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nova senha">
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    className="admin-input w-full pr-10"
                    autoComplete="new-password"
                    value={pwd.nova}
                    onChange={(e) => setPwd({ ...pwd, nova: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-1)]"
                    aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmar nova senha">
                <input
                  type={showPwd ? "text" : "password"}
                  className="admin-input w-full"
                  autoComplete="new-password"
                  value={pwd.confirma}
                  onChange={(e) => setPwd({ ...pwd, confirma: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                className="admin-btn-primary"
                onClick={handleChangePassword}
                disabled={pwdMut.isPending || !pwd.nova || !pwd.confirma}
              >
                <KeyRound className="h-4 w-4" /> Atualizar senha
              </button>
            </div>
          </div>
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
