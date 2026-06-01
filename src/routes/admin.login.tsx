import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import loginHero from "@/assets/login-hero.jpg";

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
    try {
      const { registrarUltimoLogin } = await import("@/lib/admin/cargos-api");
      await registrarUltimoLogin();
    } catch {
      /* silencioso */
    }
    if (!remember) {
      try {
        sessionStorage.setItem("admin_session_only", "1");
      } catch {
        /* silencioso */
      }
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
    <div className="admin-surface flex min-h-[100dvh] w-full flex-col lg:flex-row overflow-hidden">
      {/* ===================== Painel institucional (esquerda / topo) ===================== */}
      <aside
        className="relative flex h-[36vh] min-h-[260px] w-full items-end overflow-hidden border-b border-[color:var(--admin-borda)] lg:h-auto lg:min-h-screen lg:w-1/2 lg:items-center lg:justify-center lg:border-b-0 lg:border-r"
        aria-label="Apresentação da plataforma"
      >
        {/* Foto editorial */}
        <img
          src={loginHero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        {/* Overlays — escurece na base e funde com o lado direito (desktop) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--admin-carvao)] via-[color:var(--admin-carvao)]/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[color:var(--admin-carvao)]/35 lg:to-[color:var(--admin-carvao)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_transparent_55%,_color-mix(in_oklab,var(--admin-carvao)_75%,transparent)_100%)]" />

        {/* Conteúdo institucional */}
        <div className="relative z-10 mx-auto w-full max-w-[520px] px-6 pb-7 pt-10 text-center lg:px-12 lg:py-16 lg:text-left">
          <div className="mb-6 inline-flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-[color:var(--admin-dourado)] opacity-80" />
            <span className="text-[10px] uppercase tracking-[0.34em] text-[color:var(--admin-dourado-glow)]">

              Cavalgadas Energias da Terra
            </span>
          </div>

          <h1 className="font-display text-[40px] leading-[1.02] text-[color:var(--admin-cinza-1)] lg:text-[58px] xl:text-[64px]">
            <em className="italic text-[color:var(--admin-dourado-glow)]">Energias</em> da Terra
          </h1>

          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[color:var(--admin-cinza-2)] lg:text-[15px] mx-auto lg:mx-0">
            Painel operacional das expedições — onde a equipe orquestra reservas,
            participantes, contratos e a logística por trás de cada cavalgada.
          </p>

          {/* Pilares — escondidos no mobile para não competir com o form */}
          <ul className="mt-10 hidden space-y-3 lg:block">
            {[
              { n: "01", t: "Expedições selecionadas", d: "Curadoria fina, do Pampa ao Cerrado." },
              { n: "02", t: "Operação consolidada", d: "Reservas, pagamentos e participantes em um só lugar." },
              { n: "03", t: "Painel da equipe", d: "Acesso restrito, segregado por cargo e responsabilidade." },
            ].map((p) => (
              <li
                key={p.n}
                className="flex items-start gap-4 rounded-md border-l border-[color:var(--admin-borda-strong)] bg-[color:var(--admin-carvao)]/55 px-4 py-3 backdrop-blur-sm"
              >
                <span className="font-display text-[18px] text-[color:var(--admin-dourado-glow)]">{p.n}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium uppercase tracking-[0.16em] text-[color:var(--admin-cinza-1)]">
                    {p.t}
                  </div>
                  <div className="mt-1 text-[12.5px] text-[color:var(--admin-cinza-2)]">{p.d}</div>
                </div>
              </li>
            ))}
          </ul>

        </div>
      </aside>

      {/* ===================== Painel de autenticação (direita / base) ===================== */}
      <section className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-16 lg:py-12">
        {/* Textura pontilhada muito sutil */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative w-full max-w-[420px]">
          {/* Logo (somente no card direito; o lado esquerdo carrega a marca tipográfica) */}
          <div className="mb-8 flex items-center gap-3">
            <img
              src={logoCavalgadas}
              alt="Cavalgadas Energias da Terra"
              className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-[color:var(--admin-borda-strong)] shadow-[var(--admin-glow-dourado)]"
            />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--admin-cinza-3)]">
                Painel interno
              </div>
              <div className="truncate font-display text-[17px] text-[color:var(--admin-cinza-1)]">
                Cavalgadas
              </div>
            </div>
          </div>

          <header className="mb-8">
            <h2 className="font-display text-[30px] leading-tight text-[color:var(--admin-cinza-1)] sm:text-[34px]">
              Acesso ao painel
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[color:var(--admin-cinza-3)]">
              Bem-vindo de volta. Insira suas credenciais para gerenciar as experiências da operação.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--admin-dourado-glow)]"
              >
                E-mail corporativo
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="admin-input py-4 text-[14px] tracking-wide"
                placeholder="voce@cavalgadas.com.br"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <label
                  htmlFor="login-password"
                  className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--admin-dourado-glow)]"
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)] transition-colors hover:text-[color:var(--admin-dourado-glow)]"
                >
                  Esqueci
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-input py-4 text-[14px] tracking-wider"
                placeholder="••••••••"
              />
            </div>

            <label className="flex cursor-pointer select-none items-center gap-3 pt-1">
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-[color:var(--admin-borda-strong)] bg-transparent transition-colors checked:border-[color:var(--admin-dourado)] checked:bg-[color:var(--admin-dourado)]"
                />
                <svg
                  className="pointer-events-none absolute left-0.5 top-1/2 hidden h-3 w-3 -translate-y-1/2 text-[color:var(--admin-carvao-deep)] peer-checked:block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={4}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-[12.5px] text-[color:var(--admin-cinza-2)]">
                Manter conectado nesta sessão
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-[oklch(0.55_0.18_25/0.45)] bg-[oklch(0.32_0.1_25/0.18)] px-3.5 py-2.5 text-[12.5px] text-[oklch(0.82_0.12_25)]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="admin-btn-primary group relative w-full overflow-hidden py-4 text-[13px] tracking-[0.04em]"
            >
              <span className="relative z-10 inline-flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? "Entrando…" : "Entrar no sistema"}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0"
              />
            </button>
          </form>

          <footer className="mt-10 border-t border-[color:var(--admin-borda)] pt-5">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[9.5px] uppercase tracking-[0.26em] text-[color:var(--admin-cinza-3)]">
              <span>Criptografia 256-bit</span>
              <span className="hidden opacity-30 sm:inline">·</span>
              <span>Acesso monitorado</span>
              <span className="hidden opacity-30 sm:inline">·</span>
              <span>Suporte interno</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
