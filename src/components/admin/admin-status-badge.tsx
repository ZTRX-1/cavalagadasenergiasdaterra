import { cn } from "@/lib/utils";

const TOKENS: Record<string, { bg: string; fg: string; ring: string; label?: string }> = {
  // expedições
  rascunho: { bg: "bg-slate-500/15", fg: "text-slate-300", ring: "ring-slate-500/30", label: "Rascunho" },
  publicado: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Publicado" },
  pausado: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Pausado" },
  arquivado: { bg: "bg-zinc-700/30", fg: "text-zinc-400", ring: "ring-zinc-600/40", label: "Arquivado" },
  // leads — etapas do atendimento (modelo simplificado: 6 etapas)
  novo: { bg: "bg-sky-500/15", fg: "text-sky-300", ring: "ring-sky-500/30", label: "Novo" },
  em_atendimento: { bg: "bg-indigo-500/15", fg: "text-indigo-300", ring: "ring-indigo-500/30", label: "Atendimento" },
  qualificado: { bg: "bg-violet-500/15", fg: "text-violet-300", ring: "ring-violet-500/30", label: "Qualificado" },
  pronto_reserva: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Pronto pra Reserva" },
  convertido: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Convertido" },
  perdido: { bg: "bg-rose-500/15", fg: "text-rose-300", ring: "ring-rose-500/30", label: "Perdido" },
  // legados (mantidos pra compat de eventos antigos no histórico)
  interessado: { bg: "bg-fuchsia-500/15", fg: "text-fuchsia-300", ring: "ring-fuchsia-500/30", label: "Interessado" },
  encaminhado_financeiro: { bg: "bg-orange-500/15", fg: "text-orange-300", ring: "ring-orange-500/30", label: "No Financeiro" },
  pago: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Pago" },
  // legados
  confirmado: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Confirmado" },
  cancelado: { bg: "bg-rose-500/15", fg: "text-rose-300", ring: "ring-rose-500/30", label: "Cancelado" },
  // conversa
  observacao_interna: { bg: "bg-slate-500/15", fg: "text-slate-300", ring: "ring-slate-500/30", label: "Observação" },
  mensagem_humana: { bg: "bg-sky-500/15", fg: "text-sky-300", ring: "ring-sky-500/30", label: "Mensagem" },
  mensagem_ia: { bg: "bg-violet-500/15", fg: "text-violet-300", ring: "ring-violet-500/30", label: "IA" },
  ligacao: { bg: "bg-indigo-500/15", fg: "text-indigo-300", ring: "ring-indigo-500/30", label: "Ligação" },
  email: { bg: "bg-cyan-500/15", fg: "text-cyan-300", ring: "ring-cyan-500/30", label: "E-mail" },
  contrato: { bg: "bg-amber-500/15", fg: "text-amber-300", ring: "ring-amber-500/30", label: "Contrato" },
  pagamento: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Pagamento" },
  alteracao_status: { bg: "bg-zinc-500/15", fg: "text-zinc-300", ring: "ring-zinc-500/30", label: "Status" },
  sistema: { bg: "bg-zinc-700/30", fg: "text-zinc-400", ring: "ring-zinc-600/40", label: "Sistema" },
  lead_criado: { bg: "bg-sky-500/15", fg: "text-sky-300", ring: "ring-sky-500/30", label: "Novo Lead" },
  alteracao_temperatura: { bg: "bg-orange-500/15", fg: "text-orange-300", ring: "ring-orange-500/30", label: "Temperatura" },
  transferido_humano: { bg: "bg-emerald-500/15", fg: "text-emerald-300", ring: "ring-emerald-500/30", label: "Transf. Humano" },
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
