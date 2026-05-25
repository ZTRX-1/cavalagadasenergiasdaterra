import { useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/expedicoes": "Expedições",
  "/admin/leads": "Leads",
  "/admin/participantes": "Participantes",
  "/admin/financeiro": "Financeiro",
  "/admin/midia": "Mídia",
  "/admin/documentos": "Documentos",
  "/admin/configuracoes": "Configurações",
};

export function AdminTopbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] || "Painel";
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-4 border-b border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/70 px-6 backdrop-blur-xl">
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--admin-cinza-3)]">
          {today}
        </span>
        <h1 className="font-display text-[18px] text-[color:var(--admin-cinza-1)]">{title}</h1>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--admin-cinza-3)]" />
          <input
            type="search"
            placeholder="Buscar reservas, leads, expedições…"
            className="admin-input h-9 w-[320px] pl-9 text-[13px]"
          />
        </div>
        <button
          title="Notificações"
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo-soft)]/40 hover:text-[color:var(--admin-cinza-1)] transition-colors"
        >
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[color:var(--admin-dourado)] shadow-[var(--admin-glow-dourado)]" />
        </button>
      </div>
    </header>
  );
}
