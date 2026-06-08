import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar, AdminSidebarDrawer } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

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
  const [user, setUser] = useState<{ email?: string; nome?: string | null } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted || !data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (mounted) setUser({ email: data.user.email, nome: profile?.nome ?? null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) window.location.href = "/admin/login";
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="admin-surface flex min-h-screen w-full overflow-x-hidden">
      <AdminSidebar user={user} />
      <AdminSidebarDrawer user={user} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminTopbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 md:px-8 lg:px-10 md:py-8">
          <div className="mx-auto w-full max-w-[1400px] min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
