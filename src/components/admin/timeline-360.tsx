import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  MessageSquare, Bot, ArrowLeftRight, Wallet, ClipboardList, HandIcon, BookOpen,
} from "lucide-react";

export type TimelineEvent = {
  tipo: string | null;
  evento_id: string | null;
  lead_id: string | null;
  reserva_id: string | null;
  ocorrido_em: string | null;
  canal: string | null;
  autor: string | null;
  direcao: string | null;
  titulo: string | null;
  detalhe: string | null;
  metadata: Record<string, unknown> | null;
};

async function fetchTimeline(opts: { leadId?: string; reservaId?: string }) {
  let q = supabase
    .from("vw_timeline_cliente")
    .select("*")
    .order("ocorrido_em", { ascending: false })
    .limit(500);
  if (opts.leadId) q = q.eq("lead_id", opts.leadId);
  if (opts.reservaId) q = q.eq("reserva_id", opts.reservaId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as TimelineEvent[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mensagem: MessageSquare,
  ia_interacao: Bot,
  lead_evento: ArrowLeftRight,
  reserva_evento: BookOpen,
  pagamento: Wallet,
  tarefa: ClipboardList,
  handoff: HandIcon,
};

const LABELS: Record<string, string> = {
  mensagem: "Mensagem",
  ia_interacao: "IA",
  lead_evento: "Lead",
  reserva_evento: "Reserva",
  pagamento: "Pagamento",
  tarefa: "Tarefa",
  handoff: "Handoff",
};

export function Timeline360({ leadId, reservaId }: { leadId?: string; reservaId?: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["timeline-360", leadId ?? null, reservaId ?? null],
    queryFn: () => fetchTimeline({ leadId, reservaId }),
    enabled: !!(leadId || reservaId),
  });

  if (isLoading) return <p className="text-sm text-[color:var(--admin-cinza-3)]">Carregando linha do tempo…</p>;
  if (data.length === 0) return <p className="text-sm text-[color:var(--admin-cinza-3)]">Nenhum evento ainda.</p>;

  return (
    <ol className="space-y-3">
      {data.map((e) => {
        const Icon = ICONS[e.tipo ?? ""] ?? MessageSquare;
        return (
          <li key={`${e.tipo}-${e.evento_id}`} className="flex gap-3 rounded-lg border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)]/30 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color:var(--admin-dourado)]/10 text-[color:var(--admin-dourado)]">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-[color:var(--admin-cinza-3)]">
                <span className="text-[color:var(--admin-dourado)]">{LABELS[e.tipo ?? ""] ?? e.tipo}</span>
                {e.canal && <span>· {e.canal}</span>}
                {e.autor && <span>· {e.autor}</span>}
                {e.direcao && <span>· {e.direcao}</span>}
                <span className="ml-auto normal-case tracking-normal">
                  {e.ocorrido_em ? new Date(e.ocorrido_em).toLocaleString("pt-BR") : ""}
                </span>
              </div>
              <div className="mt-1 text-sm text-[color:var(--admin-cinza-1)] whitespace-pre-wrap break-words">
                {e.titulo || "—"}
              </div>
              {e.detalhe && (
                <div className="mt-1 text-xs text-[color:var(--admin-cinza-3)] whitespace-pre-wrap">{e.detalhe}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
