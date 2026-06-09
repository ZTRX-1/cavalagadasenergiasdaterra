import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Sparkles, Wallet, FileText, Settings, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/admin/admin-confirm";
import {
  listarNotificacoes,
  marcarComoLida,
  marcarTodasComoLidas,
  excluirNotificacoes,
  type NotificacaoCategoria,
  type NotificacaoItem,
} from "@/lib/admin/notificacoes-api";

const CATEGORIAS: { id: NotificacaoCategoria | "todas"; label: string; icon: typeof Bell }[] = [
  { id: "todas", label: "Todas", icon: Bell },
  { id: "comercial", label: "Comercial", icon: Sparkles },
  { id: "financeiro", label: "Financeiro", icon: Wallet },
  { id: "operacional", label: "Operacional", icon: FileText },
  { id: "sistema", label: "Sistema", icon: Settings },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationsCenter() {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tab, setTab] = useState<NotificacaoCategoria | "todas">("todas");
  const qc = useQueryClient();

  const { data: allItems = [] } = useQuery({
    queryKey: ["admin", "notificacoes"],
    queryFn: () => listarNotificacoes(50),
    refetchInterval: open ? 15000 : 60000,
  });

  // Somente mostrar notificações se for o usuário principal vexocompany@gmail.com
  // Em um sistema real, isso seria feito no backend via RLS ou filtros.
  const { data: user } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: async () => (await import("@/lib/admin/api")).getMe(),
  });

  const isMainUser = user?.email === "vexocompany@gmail.com";
  const items = isMainUser ? allItems : [];

  const naoLidas = items.filter((i) => !i.lida);
  const filtrados = useMemo(
    () => (tab === "todas" ? items : items.filter((i) => i.categoria === tab)),
    [items, tab],
  );

  const mLer = useMutation({
    mutationFn: marcarComoLida,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "notificacoes"] }),
  });
  const mTudo = useMutation({
    mutationFn: () => marcarTodasComoLidas(naoLidas.map((n) => n.id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "notificacoes"] }),
  });
  const mLimpar = useMutation({
    mutationFn: () => excluirNotificacoes(items.map((n) => n.id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "notificacoes"] });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Notificações${naoLidas.length ? ` (${naoLidas.length} não lidas)` : ""}`}
          className="relative grid h-9 w-9 place-items-center rounded-lg border border-[color:var(--admin-borda)] text-[color:var(--admin-cinza-2)] hover:bg-[color:var(--admin-petroleo-soft)]/40 hover:text-[color:var(--admin-cinza-1)] transition-colors"
        >
          <Bell className="h-4 w-4" strokeWidth={1.6} />
          {naoLidas.length > 0 ? (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[color:var(--admin-dourado)] px-1 text-[9px] font-semibold text-[color:var(--admin-carvao-deep)]">
              {naoLidas.length > 9 ? "9+" : naoLidas.length}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-1rem))] p-0 border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)] text-[color:var(--admin-cinza-1)]"
      >
        <div className="flex flex-col gap-2 px-4 py-3 border-b border-[color:var(--admin-borda)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-display text-[15px] leading-tight">Central de Notificações</div>
              <div className="text-[11px] text-[color:var(--admin-cinza-3)]">
                {naoLidas.length === 0 ? "Você está em dia" : `${naoLidas.length} não lida${naoLidas.length > 1 ? "s" : ""}`}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={naoLidas.length === 0 || mTudo.isPending}
                onClick={() => mTudo.mutate()}
                className="h-7 px-2 text-[10px] uppercase tracking-wider text-[color:var(--admin-cinza-2)] hover:text-[color:var(--admin-cinza-1)]"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" /> Marcar lidas
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={items.length === 0 || mLimpar.isPending}
                onClick={() => setShowConfirm(true)}
                className="h-7 px-2 text-[10px] uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar tudo
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 rounded-none bg-transparent border-b border-[color:var(--admin-borda)] p-0 h-auto">
            {CATEGORIAS.map((c) => (
              <TabsTrigger
                key={c.id}
                value={c.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[color:var(--admin-dourado)] data-[state=active]:bg-transparent data-[state=active]:text-[color:var(--admin-cinza-1)] text-[10px] uppercase tracking-[0.14em] text-[color:var(--admin-cinza-3)] py-2 px-1"
              >
                <c.icon className="h-3.5 w-3.5" />
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="m-0">
            <ScrollArea className="h-[360px]">
              {filtrados.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-[color:var(--admin-cinza-3)]">
                  Sem notificações nesta categoria.
                </div>
              ) : (
                <ul className="divide-y divide-[color:var(--admin-borda)]">
                  {filtrados.map((n) => (
                    <NotifRow key={n.id} item={n} onMark={() => mLer.mutate(n.id)} />
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        <ConfirmDialog
          open={showConfirm}
          onOpenChange={setShowConfirm}
          title="Limpar notificações"
          description="Deseja realmente excluir todas as notificações definitivamente?"
          onConfirm={() => {
            mLimpar.mutate(undefined, {
              onSuccess: () => {
                setShowConfirm(false);
                setOpen(false);
              }
            });
          }}
          destructive
        />
      </PopoverContent>
    </Popover>
  );
}

function NotifRow({ item, onMark }: { item: NotificacaoItem; onMark: () => void }) {
  return (
    <li
      className={cn(
        "px-4 py-3 cursor-pointer transition-colors hover:bg-[color:var(--admin-petroleo-soft)]/30",
        !item.lida && "bg-[color:var(--admin-petroleo-soft)]/20",
      )}
      onClick={() => !item.lida && onMark()}
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            item.lida ? "bg-[color:var(--admin-cinza-3)]/40" : "bg-[color:var(--admin-dourado)]",
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-medium text-[color:var(--admin-cinza-1)]">{item.titulo}</span>
            <span className="text-[10px] text-[color:var(--admin-cinza-3)] shrink-0">{timeAgo(item.created_at)}</span>
          </div>
          <div className="truncate text-[11px] text-[color:var(--admin-cinza-3)] mt-0.5">{item.descricao}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]/70">
            {item.categoria}
          </div>
        </div>
      </div>
    </li>
  );
}
