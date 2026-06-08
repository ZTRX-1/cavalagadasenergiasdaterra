import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Save, Upload, Shield, KeyRound, Clock, CalendarDays, Eye, EyeOff, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getMeuPerfil, atualizarMeuPerfil, uploadAvatar, CARGOS_EQUIPE } from "@/lib/admin/api";

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
  const { data: perfil, isLoading } = useQuery({ queryKey: ["admin", "meu-perfil"], queryFn: getMeuPerfil });
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ nome: "", cargo: "", bio: "", telefone: "", avatar_url: "", banner_url: "" });
  const [pwd, setPwd] = useState({ nova: "", confirma: "" });
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (perfil) {
      setForm({
        nome: perfil.nome ?? "",
        cargo: perfil.cargo ?? "",
        bio: perfil.bio ?? "",
        telefone: perfil.telefone ?? "",
        avatar_url: perfil.avatar_url ?? "",
        banner_url: perfil.banner_url ?? "",
      });
    }
  }, [perfil]);

  const saveMut = useMutation({
    mutationFn: () => atualizarMeuPerfil({
      nome: form.nome || null,
      cargo: form.cargo || null,
      bio: form.bio || null,
      telefone: form.telefone || null,
      avatar_url: form.avatar_url || null,
      banner_url: form.banner_url || null,
    }),
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Removed pwdMut as password resets now happen via email verification
  const pwdMut = { isPending: false }; 

  const onPickFile = async (file: File) => {
    try {
      const url = await uploadAvatar(file);
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.info("Foto processada. Salve o perfil para confirmar.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onPickBanner = async (file: File) => {
    try {
      const url = await uploadAvatar(file); // Reusing uploadAvatar as it handles standard storage uploads
      setForm((f) => ({ ...f, banner_url: url }));
      toast.info("Capa processada. Salve o perfil para confirmar.");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleChangePassword = async () => {
    if (pwd.nova.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (pwd.nova !== pwd.confirma) {
      toast.error("As senhas não conferem.");
      return;
    }

    // New verification logic: Send recovery email for password reset
    const { error } = await supabase.auth.resetPasswordForEmail(perfil?.email ?? "", {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });

    if (error) {
      toast.error("Erro ao enviar e-mail de verificação: " + error.message);
    } else {
      toast.success("E-mail de verificação enviado! Confira sua caixa de entrada.");
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4 pt-10">
    <div className="h-20 w-1/3 rounded-lg bg-[color:var(--admin-petroleo)]" />
    <div className="h-64 rounded-xl bg-[color:var(--admin-petroleo)]" />
  </div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      <AdminPageHeader 
        eyebrow="Configurações" 
        title="Meu perfil" 
        description="Gerencie suas informações pessoais, cargo e preferências de segurança." 
      />

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        {/* Lado Esquerdo: Avatar e Atividade */}
        <div className="space-y-6">
          <div className="admin-card overflow-hidden !p-0 shadow-lg ring-1 ring-[color:var(--admin-borda)]">
            <div className="group relative h-32 bg-gradient-to-r from-[color:var(--admin-petroleo)] to-[color:var(--admin-carvao-deep)] overflow-hidden">
              {form.banner_url && (
                <img src={form.banner_url} alt="" className="h-full w-full object-cover opacity-60 transition-transform group-hover:scale-105" />
              )}
              <button 
                onClick={() => bannerRef.current?.click()}
                className="absolute inset-0 z-10 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md border border-white/20">
                  <Upload className="h-3 w-3" /> Alterar Capa
                </div>
              </button>
              <input 
                ref={bannerRef} 
                type="file" 
                accept="image/jpeg,image/png,image/webp" 
                className="hidden" 
                onChange={(e) => e.target.files?.[0] && onPickBanner(e.target.files[0])} 
              />
            </div>
            <div className="relative -mt-16 px-6 pb-6 text-center">
              <div className="relative mx-auto inline-block">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[color:var(--admin-carvao)] bg-[color:var(--admin-petroleo)] shadow-xl ring-1 ring-[color:var(--admin-borda)]">
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-4xl font-semibold text-[color:var(--admin-dourado-glow)]">
                      {(form.nome || perfil?.email || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao-deep)] shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Trocar foto"
                >
                  <Upload className="h-4 w-4" />
                </button>
                <input 
                  ref={fileRef} 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} 
                />
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-[color:var(--admin-cinza-1)] truncate">{form.nome || "Usuário"}</h3>
                <p className="text-xs text-[color:var(--admin-cinza-3)] truncate">{perfil?.email}</p>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {perfil?.role && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo)] px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-[color:var(--admin-dourado-glow)]">
                    <Shield className="h-3 w-3" /> {perfil.role}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-card space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">Estatísticas de Acesso</h4>
            <div className="space-y-4">
              <StatItem 
                icon={Shield} 
                label="Cargo Definido" 
                value={perfil?.cargo_nome ?? perfil?.cargo ?? "Não definido"} 
              />
              <StatItem 
                icon={CalendarDays} 
                label="Membro desde" 
                value={formatDay(perfil?.data_entrada ?? null)} 
              />
              <StatItem 
                icon={Clock} 
                label="Último login" 
                value={formatDate(perfil?.ultimo_login ?? null)} 
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário e Senha */}
        <div className="space-y-6">
          <div className="admin-card space-y-6">
            <div className="flex items-center gap-3 border-b border-[color:var(--admin-borda)] pb-4">
              <UserIcon className="h-5 w-5 text-[color:var(--admin-dourado)]" />
              <h3 className="font-display text-xl text-[color:var(--admin-cinza-1)]">Dados Pessoais</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Nome completo">
                <input 
                  className="admin-input" 
                  value={form.nome} 
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                />
              </Field>
              <Field label="E-mail principal (identificador)">
                <input 
                  disabled 
                  className="admin-input opacity-50 cursor-not-allowed" 
                  value={perfil?.email ?? ""} 
                />
              </Field>
              <Field label="Função Operacional">
                <select 
                  className="admin-input" 
                  value={form.cargo} 
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                >
                  <option value="">Selecione uma função...</option>
                  {CARGOS_EQUIPE.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Telefone de Contato">
                <input 
                  className="admin-input" 
                  placeholder="+55 (00) 00000-0000" 
                  value={form.telefone} 
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })} 
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Biografia / Resumo Profissional">
                  <textarea 
                    className="admin-input min-h-[140px] resize-none py-3" 
                    placeholder="Conte um pouco sobre sua trajetória na Cavalgadas..." 
                    value={form.bio} 
                    onChange={(e) => setForm({ ...form, bio: e.target.value })} 
                  />
                </Field>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                className="admin-btn-primary px-8" 
                onClick={() => saveMut.mutate()} 
                disabled={saveMut.isPending}
              >
                <Save className="h-4 w-4" /> 
                {saveMut.isPending ? "Salvando..." : "Atualizar Perfil"}
              </button>
            </div>
          </div>

          <div className="admin-card space-y-6 border-t-2 border-t-[color:var(--admin-dourado)]/20">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-[color:var(--admin-dourado)]" />
              <h3 className="font-display text-xl text-[color:var(--admin-cinza-1)]">Segurança e Senha</h3>
            </div>
            
            <div className="rounded-xl bg-amber-500/5 p-4 ring-1 ring-amber-500/20">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 shrink-0 text-amber-500/80" />
                <p className="text-xs leading-relaxed text-amber-200/70">
                  Para sua segurança, as alterações de senha exigem verificação por e-mail. 
                  Você não poderá reutilizar suas últimas 5 senhas.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Nova senha">
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    className="admin-input pr-12"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={pwd.nova}
                    onChange={(e) => setPwd({ ...pwd, nova: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--admin-cinza-3)] transition-colors hover:text-[color:var(--admin-dourado-glow)]"
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirmar nova senha">
                <input
                  type={showPwd ? "text" : "password"}
                  className="admin-input"
                  autoComplete="new-password"
                  placeholder="Repita a senha"
                  value={pwd.confirma}
                  onChange={(e) => setPwd({ ...pwd, confirma: e.target.value })}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <button
                className="admin-btn-ghost border-[color:var(--admin-borda-strong)] bg-transparent px-8 hover:bg-[color:var(--admin-petroleo)]"
                onClick={handleChangePassword}
                disabled={pwdMut.isPending || !pwd.nova || !pwd.confirma}
              >
                <KeyRound className="h-4 w-4" />
                {pwdMut.isPending ? "Alterando..." : "Redefinir Senha"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-[color:var(--admin-petroleo)]/50 ring-1 ring-[color:var(--admin-borda)]">
        <Icon className="h-4 w-4 text-[color:var(--admin-dourado-glow)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-3)]">{label}</div>
        <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
        {label}
      </label>
      {children}
    </div>
  );
}

