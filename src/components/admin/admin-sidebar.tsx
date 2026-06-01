import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Users,
  Wallet,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  X,
  Bot,
  Workflow,
  History,
  Plug,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import { useCan, type AdminModule } from "@/hooks/use-permissions";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  modulo: AdminModule;
  exact?: boolean;
  group: "operacao" | "governanca";
};

const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, modulo: "dashboard", exact: true, group: "operacao" },
  { to: "/admin/expedicoes", label: "Expedições", icon: Compass, modulo: "expedicoes", group: "operacao" },
  { to: "/admin/leads", label: "Leads", icon: Sparkles, modulo: "leads", group: "operacao" },
  { to: "/admin/reservas", label: "Reservas", icon: BookOpen, modulo: "reservas", group: "operacao" },
  { to: "/admin/participantes", label: "Participantes", icon: Users, modulo: "participantes", group: "operacao" },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet, modulo: "financeiro", group: "operacao" },
  { to: "/admin/midia", label: "Mídia", icon: ImageIcon, modulo: "midia", group: "operacao" },
  { to: "/admin/documentos", label: "Documentos", icon: FileText, modulo: "documentos", group: "operacao" },
  { to: "/admin/ia", label: "IA", icon: Bot, modulo: "ia", group: "governanca" },
  { to: "/admin/automacoes", label: "Automações", icon: Workflow, modulo: "automacoes", group: "governanca" },
  { to: "/admin/historico", label: "Histórico", icon: History, modulo: "historico", group: "governanca" },
  { to: "/admin/integracoes", label: "Integrações", icon: Plug, modulo: "integracoes", group: "governanca" },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, modulo: "configuracoes", group: "governanca" },
];

function NavLinkItem({ item, onNavigate, active }: { item: NavItem; onNavigate?: () => void; active: boolean }) {
  const { canView, locked } = useCan(item.modulo);
  if (!canView) return null;
  const Icon = item.icon;

  if (locked) {
    return (
      <div
        className="admin-nav-item cursor-not-allowed opacity-60"
        title="Em desenvolvimento — acesso bloqueado para seu papel"
        aria-disabled="true"
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        <span>{item.label}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.18em] text-amber-200">
          <Lock className="h-2.5 w-2.5" /> dev
        </span>
      </div>
    );
  }

  return (
    <Link
      to={item.to as never}
      onClick={onNavigate}
      className="admin-nav-item"
      data-active={active}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarContent({ user, onNavigate }: { user: { email?: string; nome?: string | null } | null; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const inicial = (user?.nome || user?.email || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[color:var(--admin-borda)]">
        <img
          src={logoCavalgadas}
          alt="Cavalgadas Energias da Terra"
          className="h-10 w-10 shrink-0 rounded-md object-cover ring-1 ring-[color:var(--admin-borda-strong)] shadow-[var(--admin-glow-dourado)]"
        />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-display text-[15px] text-[color:var(--admin-cinza-1)] truncate">Cavalgadas</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] truncate">Energias da Terra</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Operação</div>
        {nav.filter((i) => i.group === "operacao").map((item) => (
          <NavLinkItem key={item.to} item={item} onNavigate={onNavigate} active={isActive(item.to, item.exact)} />
        ))}
        <div className="px-3 pt-4 pb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Governança</div>
        {nav.filter((i) => i.group === "governanca").map((item) => (
          <NavLinkItem key={item.to} item={item} onNavigate={onNavigate} active={isActive(item.to, item.exact)} />
        ))}
      </nav>
      <div className="border-t border-[color:var(--admin-borda)] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[color:var(--admin-petroleo-soft)]/40 transition-colors">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--admin-petroleo)] text-sm font-medium text-[color:var(--admin-dourado-glow)] ring-1 ring-[color:var(--admin-borda-strong)]">{inicial}</div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">{user?.nome || user?.email?.split("@")[0] || "Operador"}</div>
            <div className="truncate text-[11px] text-[color:var(--admin-cinza-3)]">{user?.email}</div>
          </div>
          <button onClick={handleLogout} title="Sair" className="grid h-8 w-8 place-items-center rounded-md text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-carvao-deep)] hover:text-[color:var(--admin-dourado)] transition-colors">
            <LogOut className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </>
  );
}

export function AdminSidebar({ user }: { user: { email?: string; nome?: string | null } | null }) {
  return (
    <aside className="hidden md:flex w-[252px] shrink-0 flex-col border-r border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/80 backdrop-blur-xl">
      <SidebarContent user={user} />
    </aside>
  );
}

export function AdminSidebarDrawer({ user, open, onClose }: { user: { email?: string; nome?: string | null } | null; open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] shadow-2xl animate-in slide-in-from-left">
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo)]">
          <X className="h-4 w-4" />
        </button>
        <SidebarContent user={user} onNavigate={onClose} />
      </aside>
    </div>
  );
}
