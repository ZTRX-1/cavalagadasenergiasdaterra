import { cn } from "@/lib/utils";

const TOKENS: Record<string, { bg: string; fg: string; ring: string; label?: string }> = {
  // expedições
  rascunho: { bg: "bg-slate-500/15", fg: "text-slate-300", ring: "ring-slate-500/30", label: "Rascunho" },
  publicado: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Publicado" },
  pausado: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Pausado" },
  arquivado: { bg: "bg-zinc-700/30", fg: "text-zinc-400", ring: "ring-zinc-600/40", label: "Arquivado" },
  // leads
  novo: { bg: "bg-sky-500/15", fg: "text-sky-300", ring: "ring-sky-500/30", label: "Novo" },
  contato_realizado: { bg: "bg-indigo-500/15", fg: "text-indigo-300", ring: "ring-indigo-500/30", label: "Contato" },
  negociacao: { bg: "bg-violet-500/15", fg: "text-violet-300", ring: "ring-violet-500/30", label: "Negociação" },
  pagamento_pendente: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Pgto pendente" },
  confirmado: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Confirmado" },
  cancelado: { bg: "bg-rose-500/15", fg: "text-rose-300", ring: "ring-rose-500/30", label: "Cancelado" },
  pos_venda: { bg: "bg-teal-500/15", fg: "text-teal-300", ring: "ring-teal-500/30", label: "Pós-venda" },
  // pagamentos
  pendente: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Pendente" },
  parcial: { bg: "bg-blue-500/15", fg: "text-blue-300", ring: "ring-blue-500/30", label: "Parcial" },
  // datas
  disponivel: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Disponível" },
  esgotada: { bg: "bg-rose-500/15", fg: "text-rose-300", ring: "ring-rose-500/30", label: "Esgotada" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const t =
    TOKENS[status] ??
    { bg: "bg-zinc-500/15", fg: "text-zinc-300", ring: "ring-zinc-500/30", label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
        t.bg,
        t.fg,
        t.ring,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {t.label ?? status}
    </span>
  );
}
