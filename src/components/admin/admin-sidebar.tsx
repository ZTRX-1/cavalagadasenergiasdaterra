import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
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
  UserCog,
  ShieldCheck,
  User as UserIcon,
  ChevronUp,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import { useCan, type AdminModule } from "@/hooks/use-permissions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavGroup = "operacao" | "avancado" | "configuracao";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  modulo: AdminModule;
  exact?: boolean;
  group: NavGroup;
};

const nav: NavItem[] = [
  // OPERAÇÃO — o que Aline e Lígia abrem todo dia
  { to: "/admin", label: "Central", icon: LayoutDashboard, modulo: "dashboard", exact: true, group: "operacao" },
  { to: "/admin/leads", label: "Central de Reservas", icon: Sparkles, modulo: "leads", group: "operacao" },
  { to: "/admin/expedicoes", label: "Expedições", icon: Compass, modulo: "expedicoes", group: "operacao" },
  { to: "/admin/participantes", label: "Participantes", icon: Users, modulo: "participantes", group: "operacao" },

  // AVANÇADO — relatórios, IA e operação técnica
  { to: "/admin/reservas", label: "Reservas (lista)", icon: BookOpen, modulo: "reservas", group: "avancado" },
  { to: "/admin/financeiro", label: "Financeiro", icon: Wallet, modulo: "financeiro", group: "avancado" },
  { to: "/admin/documentos", label: "Documentos", icon: FileText, modulo: "documentos", group: "avancado" },
  { to: "/admin/inbox", label: "Caixa de entrada", icon: MessageSquare, modulo: "leads", group: "avancado" },
  { to: "/admin/operacao", label: "Pendências", icon: ListChecks, modulo: "leads", group: "avancado" },
  { to: "/admin/midia", label: "Mídia", icon: ImageIcon, modulo: "midia", group: "avancado" },
  { to: "/admin/ia", label: "IA", icon: Bot, modulo: "ia", group: "avancado" },
  { to: "/admin/ia-kb", label: "IA · Conhecimento", icon: BookOpen, modulo: "ia", group: "avancado" },
  { to: "/admin/ia-auditoria", label: "IA · Auditoria", icon: ShieldCheck, modulo: "ia", group: "avancado" },
  { to: "/admin/automacoes", label: "Automações", icon: Workflow, modulo: "automacoes", group: "avancado" },
  { to: "/admin/integracoes", label: "Integrações", icon: Plug, modulo: "integracoes", group: "avancado" },
  { to: "/admin/historico", label: "Histórico", icon: History, modulo: "historico", group: "avancado" },

  // CONFIGURAÇÃO — quase nunca tocada
  { to: "/admin/equipe", label: "Equipe", icon: Users, modulo: "equipe", group: "configuracao" },
  { to: "/admin/usuarios", label: "Usuários", icon: UserCog, modulo: "usuarios", group: "configuracao" },
  { to: "/admin/cargos", label: "Cargos", icon: ShieldCheck, modulo: "cargos", group: "configuracao" },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, modulo: "configuracoes", group: "configuracao" },
];

function NavLinkItem({ item, onNavigate, active }: { item: NavItem; onNavigate?: () => void; active: boolean }) {
  const { canView, locked } = useCan(item.modulo);
  if (!canView) return null;
  const Icon = item.icon;

  return (
    <Link
      to={item.to as never}
      onClick={onNavigate}
      className="admin-nav-item"
      data-active={active}
      title={locked ? "Em desenvolvimento — próxima etapa" : undefined}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
      <span>{item.label}</span>
      {locked && (
        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.1em] text-amber-200 whitespace-nowrap min-w-[70px] justify-center">
          <Lock className="h-2 w-2 shrink-0" /> em breve
        </span>
      )}
    </Link>
  );
}

function NavGroupBlock({
  label,
  items,
  isActive,
  onNavigate,
  pathname,
  defaultOpen,
}: {
  label: string;
  items: NavItem[];
  isActive: (to: string, exact?: boolean) => boolean;
  onNavigate?: () => void;
  pathname: string;
  defaultOpen: boolean;
}) {
  const containsActive = items.some((i) => isActive(i.to, i.exact));
  const [open, setOpen] = useState<boolean>(defaultOpen || containsActive);
  useEffect(() => { if (containsActive) setOpen(true); }, [pathname, containsActive]);
  return (
    <div className="pt-3 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 pb-2 text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-cinza-2)] transition-colors"
      >
        <span>{label}</span>
        <ChevronUp className={`h-3 w-3 transition-transform ${open ? "" : "rotate-180"}`} strokeWidth={1.8} />
      </button>
      {open ? (
        <div className="space-y-0.5">
          {items.map((item) => (
            <NavLinkItem key={item.to} item={item} onNavigate={onNavigate} active={isActive(item.to, item.exact)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarContent({ user, onNavigate }: { user: { email?: string; nome?: string | null; avatar_url?: string | null } | null; onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };
  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
  const inicial = (user?.nome || user?.email || "?").trim().charAt(0).toUpperCase();

  const operacao = nav.filter((i) => i.group === "operacao");
  const avancado = nav.filter((i) => i.group === "avancado");
  const configuracao = nav.filter((i) => i.group === "configuracao");

  return (
    <>
      <div className="flex items-center gap-3 px-4 xs:px-6 py-4 xs:py-5 border-b border-[color:var(--admin-borda)]">
        <img
          src={logoCavalgadas}
          alt="Cavalgadas Energias da Terra"
          className="h-8 w-8 xs:h-10 xs:w-10 shrink-0 rounded-md object-cover ring-1 ring-[color:var(--admin-borda-strong)] shadow-[var(--admin-glow-dourado)]"
        />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-display text-[13px] xs:text-[15px] text-[color:var(--admin-cinza-1)] truncate">Cavalgadas</span>
          <span className="text-[8px] xs:text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] truncate">Energias da Terra</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5 custom-scrollbar">
        <NavGroupBlock label="Operação" items={operacao} isActive={isActive} onNavigate={onNavigate} pathname={pathname} defaultOpen />
        <NavGroupBlock label="Avançado" items={avancado} isActive={isActive} onNavigate={onNavigate} pathname={pathname} defaultOpen={false} />
        <NavGroupBlock label="Configuração" items={configuracao} isActive={isActive} onNavigate={onNavigate} pathname={pathname} defaultOpen={false} />
      </nav>
      <div className="border-t border-[color:var(--admin-borda)] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[color:var(--admin-petroleo-soft)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--admin-dourado)]/40"
              aria-label="Menu da conta"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--admin-petroleo)] text-sm font-medium text-[color:var(--admin-dourado-glow)] ring-1 ring-[color:var(--admin-borda-strong)]">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  inicial
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">{user?.nome || user?.email?.split("@")[0] || "Operador"}</div>
                <div className="truncate text-[11px] text-[color:var(--admin-cinza-3)]">{user?.email}</div>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-[color:var(--admin-cinza-3)]" strokeWidth={1.6} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-[230px] bg-[color:var(--admin-carvao-deep)] border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-1)]"
          >
            <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)] font-normal">
              Conta
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to="/admin/perfil" onClick={onNavigate} className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" /> Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[color:var(--admin-borda)]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-[color:var(--admin-cinza-1)] focus:bg-[color:var(--admin-petroleo)]/60"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function AdminSidebar({ user }: { user: { email?: string; nome?: string | null; avatar_url?: string | null } | null }) {
  return (
    <aside className="hidden lg:flex w-[252px] shrink-0 flex-col border-r border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/80 backdrop-blur-xl h-dvh sticky top-0">
      <SidebarContent user={user} />
    </aside>
  );
}

export function AdminSidebarDrawer({ user, open, onClose }: { user: { email?: string; nome?: string | null; avatar_url?: string | null } | null; open: boolean; onClose: () => void }) {
  return (
    <div className={cn("fixed inset-0 z-50 lg:hidden", !open && "pointer-events-none")}>
      <div className={cn("absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")} onClick={onClose} />
      <aside className={cn("absolute inset-y-0 left-0 flex w-[260px] xs:w-[280px] max-w-[85vw] flex-col border-r border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] shadow-2xl transition-transform duration-500 ease-out", open ? "translate-x-0" : "-translate-x-full")}>
        <button onClick={onClose} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo)]">
          <X className="h-4 w-4" />
        </button>
        <SidebarContent user={user} onNavigate={onClose} />
      </aside>
    </div>
  );
}
