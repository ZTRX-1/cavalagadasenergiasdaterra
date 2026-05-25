import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Users,
  Wallet,
  Image as ImageIcon,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/expedicoes", label: "Expedições", icon: Compass },
  { to: "/admin/leads", label: "Leads", icon: Sparkles },
  { to: "/admin/participantes", label: "Participantes", icon: Users },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/admin/midia", label: "Mídia", icon: ImageIcon },
  { to: "/admin/documentos", label: "Documentos", icon: FileText },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminSidebar({ user }: { user: { email?: string; nome?: string | null } | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  const inicial = (user?.nome || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex w-[252px] shrink-0 flex-col border-r border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[color:var(--admin-borda)]">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-gradient-to-br from-[color:var(--admin-dourado)] to-[color:var(--admin-dourado-glow)] text-[color:var(--admin-carvao-deep)] font-display text-lg font-semibold shadow-[var(--admin-glow-dourado)]">
          C
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[15px] text-[color:var(--admin-cinza-1)]">Cavalgadas</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Painel interno</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
          Operação
        </div>
        {nav.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            className="admin-nav-item"
            data-active={isActive(to, exact)}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-[color:var(--admin-borda)] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[color:var(--admin-petroleo-soft)]/40 transition-colors">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-sm font-medium text-[color:var(--admin-dourado-glow)] ring-1 ring-[color:var(--admin-borda-strong)]">
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">
              {user?.nome || user?.email?.split("@")[0] || "Operador"}
            </div>
            <div className="truncate text-[11px] text-[color:var(--admin-cinza-3)]">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="grid h-8 w-8 place-items-center rounded-md text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-carvao-deep)] hover:text-[color:var(--admin-dourado)] transition-colors"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </aside>
  );
}
