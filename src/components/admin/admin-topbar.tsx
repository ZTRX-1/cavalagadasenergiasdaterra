import { useRouterState } from "@tanstack/react-router";
import { Search, Menu } from "lucide-react";
import { NotificationsCenter } from "@/components/admin/notifications-center";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/expedicoes": "Expedições",
  "/admin/leads": "Leads",
  "/admin/reservas": "Reservas",
  "/admin/participantes": "Participantes",
  "/admin/financeiro": "Financeiro",
  "/admin/midia": "Mídia",
  "/admin/documentos": "Documentos",
  "/admin/inbox": "Caixa de entrada",
  "/admin/ia": "Configurações da IA",
  "/admin/ia-kb": "Base de Conhecimento",
  "/admin/automacoes": "Central de Automações",
  "/admin/historico": "Histórico Global",
  "/admin/integracoes": "Integrações",
  "/admin/usuarios": "Usuários",
  "/admin/cargos": "Cargos",
  "/admin/perfil": "Meu Perfil",
  "/admin/configuracoes": "Configurações",
};

export function AdminTopbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] || "Painel";
  const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <header className="sticky top-0 z-30 flex h-[50px] sm:h-[60px] items-center gap-3 border-b border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/70 px-3 sm:px-4 md:px-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Abrir menu"
        className="lg:hidden grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-lg border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo-soft)]/40"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="hidden sm:block text-[10px] uppercase tracking-[0.24em] text-[color:var(--admin-cinza-3)] truncate">{today}</span>
        <h1 className="font-display text-[14px] sm:text-[16px] md:text-[18px] text-[color:var(--admin-cinza-1)] truncate">{title}</h1>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <div className="relative hidden lg:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--admin-cinza-3)]" />
          <input
            type="search"
            placeholder="Buscar reservas, leads, expedições…"
            className="admin-input admin-search-input h-9 w-[280px] xl:w-[320px] text-[13px] placeholder:text-[12px]"
          />
        </div>
        <NotificationsCenter />
      </div>
    </header>
  );
}

