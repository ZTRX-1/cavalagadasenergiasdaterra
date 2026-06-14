import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar, AdminSidebarDrawer } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { RestrictedAccess } from "@/components/admin/restricted-access";
import { useCan, type AdminModule } from "@/hooks/use-permissions";

export const Route = createFileRoute("/admin/_authenticated")({
  head: () => ({
    meta: [
      { title: "Painel interno — Cavalgadas Energias da Terra" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href } as never,
      });
    }
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const internalRoles = new Set([
      "admin","operador","financeiro","midia","operacional",
      "atendimento","superadmin","ceo","socia","desenvolvedor","ceo_preview",
    ]);
    const hasInternal = (roles ?? []).some((r) => internalRoles.has(r.role as string));
    if (!hasInternal) {
      await supabase.auth.signOut();
      throw redirect({
        to: "/admin/login",
        search: { redirect: location.href } as never,
      });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const [user, setUser] = useState<{ email?: string; nome?: string | null; avatar_url?: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let activityTimeout: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      if (activityTimeout) clearTimeout(activityTimeout);
      activityTimeout = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = "/admin/login?reason=timeout";
      }, 15 * 60 * 1000); // 15 minutos
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach(e => window.addEventListener(e, resetTimeout));
    resetTimeout();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted || !data.user) return;
      
      const userAgent = navigator.userAgent;
      const now = new Date().toISOString();
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, avatar_url, security_history, cargo")
        .eq("user_id", data.user.id)
        .maybeSingle();

      // Forçar cargo de Developer para o Master User se necessário
      if (data.user.id === "20b7839f-b3c3-494c-90df-515ba0a0de4f" && profile?.cargo !== "Developer") {
         await supabase.from("profiles").update({ cargo: "Developer" }).eq("user_id", data.user.id);
      }

      const newHistory = [
        { date: now, ua: userAgent },
        ...(Array.isArray(profile?.security_history) ? profile.security_history : [])
      ].slice(0, 10);

      await supabase
        .from("profiles")
        .update({ 
          ultimo_login: now,
          security_history: newHistory as any
        })
        .eq("user_id", data.user.id);

      if (mounted) setUser({ 
        email: data.user.email, 
        nome: profile?.nome ?? null, 
        avatar_url: profile?.avatar_url ?? null 
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/admin/login";
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      if (activityTimeout) clearTimeout(activityTimeout);
      events.forEach(e => window.removeEventListener(e, resetTimeout));
    };
  }, []);

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentModule = useMemo<AdminModule | null>(() => {
    const map: Array<{ prefix: string; modulo: AdminModule; exact?: boolean }> = [
      { prefix: "/admin", modulo: "dashboard", exact: true },
      { prefix: "/admin/expedicoes", modulo: "expedicoes" },
      { prefix: "/admin/leads", modulo: "leads" },
      { prefix: "/admin/inbox", modulo: "leads" },
      { prefix: "/admin/reservas", modulo: "reservas" },
      { prefix: "/admin/participantes", modulo: "participantes" },
      { prefix: "/admin/financeiro", modulo: "financeiro" },
      { prefix: "/admin/midia", modulo: "midia" },
      { prefix: "/admin/documentos", modulo: "documentos" },
      { prefix: "/admin/ia-kb", modulo: "ia" },
      { prefix: "/admin/ia", modulo: "ia" },
      { prefix: "/admin/automacoes", modulo: "automacoes" },
      { prefix: "/admin/integracoes", modulo: "integracoes" },
      { prefix: "/admin/usuarios", modulo: "usuarios" },
      { prefix: "/admin/cargos", modulo: "cargos" },
      { prefix: "/admin/configuracoes", modulo: "configuracoes" },
      { prefix: "/admin/historico", modulo: "historico" },
      { prefix: "/admin/equipe", modulo: "equipe" },
    ];
    const match = map.find((m) =>
      m.exact ? pathname === m.prefix : pathname === m.prefix || pathname.startsWith(`${m.prefix}/`),
    );
    return match?.modulo ?? null;
  }, [pathname]);

  const { locked, role } = useCan((currentModule ?? "dashboard") as AdminModule);
  const showRestricted = !!currentModule && locked;
  const isCeo = role === "ceo";

  return (
    <div className="admin-surface flex h-dvh w-full overflow-hidden">
      <AdminSidebar user={user} />
      <AdminSidebarDrawer user={user} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 h-full">
        <AdminTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 lg:px-10 md:py-8 custom-scrollbar">
          <div className="mx-auto w-full max-w-[1400px] min-w-0 relative">
            {showRestricted ? (
              <div className="relative">
                {isCeo && (
                  <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden opacity-30 blur-md grayscale">
                    <Outlet />
                  </div>
                )}
                <div className={isCeo ? "relative z-10" : ""}>
                  <RestrictedAccess modulo={currentModule!} />
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
