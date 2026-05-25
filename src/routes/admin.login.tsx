import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Mail } from "lucide-react";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acesso interno — Cavalgadas Energias da Terra" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Credenciais inválidas." : err.message);
      setLoading(false);
      return;
    }
    if (!remember) {
      // session persists by default; if user opts out we sign out on browser close via storage clear
      try { sessionStorage.setItem("admin_session_only", "1"); } catch {}
    }
    navigate({ to: "/admin" });
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Informe seu e-mail para enviar o link de recuperação.");
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/login`,
    });
    if (err) setError(err.message);
    else setError("Enviamos um link de recuperação para seu e-mail.");
  };

  return (
    <div className="admin-surface relative min-h-screen overflow-hidden">
      {/* Background cinematográfico */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse at top, oklch(0.28 0.04 220 / 0.7), transparent 60%), radial-gradient(ellipse at bottom right, oklch(0.32 0.06 75 / 0.35), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="grid min-h-screen place-items-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="mb-10 flex flex-col items-center text-center">
            <img
              src={logoCavalgadas}
              alt="Cavalgadas Energias da Terra"
              className="h-16 w-16 rounded-xl object-cover ring-1 ring-[color:var(--admin-borda-strong)] shadow-[var(--admin-glow-dourado)]"
            />
            <h1 className="mt-5 font-display text-[28px] text-[color:var(--admin-cinza-1)]">
              Acesso ao painel
            </h1>
            <p className="mt-2 text-[13px] text-[color:var(--admin-cinza-3)]">
              Cavalgadas Energias da Terra — área restrita à equipe
            </p>
          </div>

          {/* Card */}
          <form
            onSubmit={handleSubmit}
            className="admin-glass rounded-2xl p-7 shadow-[0_40px_80px_-30px_oklch(0_0_0/0.6)] animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--admin-cinza-3)]" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-input pl-10"
                    placeholder="voce@cavalgadas.com.br"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--admin-cinza-3)]" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="admin-input pl-10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-[12px] text-[color:var(--admin-cinza-2)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[color:var(--admin-dourado)]"
                  />
                  Lembrar acesso
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[12px] text-[color:var(--admin-dourado-glow)] hover:underline underline-offset-4"
                >
                  Esqueci minha senha
                </button>
              </div>

              {error && (
                <div className="rounded-md border border-[oklch(0.55_0.18_25/0.5)] bg-[oklch(0.32_0.1_25/0.2)] px-3 py-2 text-[12px] text-[oklch(0.8_0.12_25)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="admin-btn-primary w-full mt-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-[11px] tracking-[0.16em] uppercase text-[color:var(--admin-cinza-3)]">
            Conexão segura · acesso registrado
          </p>
        </div>
      </div>
    </div>
  );
}
