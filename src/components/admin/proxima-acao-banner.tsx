import { AlertTriangle, CheckCircle2, Clock, Info, MinusCircle } from "lucide-react";
import {
  PROXIMA_ACAO_TONE_CLASS,
  JORNADA_TONE_CLASS,
  calcularProximaAcao,
  jornadaEstagio,
  jornadaFromLead,
  type ProximaAcao,
  type ProximaAcaoContexto,
} from "@/lib/admin/jornada";
import type { LeadRow } from "@/lib/admin/api";

const ICONS = {
  info: Info,
  warn: AlertTriangle,
  ok: CheckCircle2,
  danger: AlertTriangle,
  muted: MinusCircle,
} as const;

interface Props {
  lead: Pick<LeadRow, "status" | "etapa_atendimento" | "proxima_acao">;
  contexto?: Omit<ProximaAcaoContexto, "proximaAcaoManual">;
  /** Sobrescreve o cálculo automático. */
  override?: ProximaAcao;
}

/**
 * Bloco obrigatório no topo de toda ficha operacional.
 * Em ≤5 segundos a operadora entende o próximo passo.
 */
export function ProximaAcaoBanner({ lead, contexto, override }: Props) {
  const acao =
    override ??
    calcularProximaAcao(lead, {
      ...contexto,
      proximaAcaoManual: lead.proxima_acao ?? null,
    });
  const Icon = ICONS[acao.tone] ?? Clock;
  const jornada = jornadaEstagio(jornadaFromLead(lead));

  return (
    <section
      className={`rounded-2xl border px-5 py-4 backdrop-blur-sm ${PROXIMA_ACAO_TONE_CLASS[acao.tone]}`}
      aria-label="Próxima ação"
    >
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/20 ring-1 ring-white/10">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] opacity-75">
            <span>Próxima ação</span>
            <span aria-hidden>·</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] tracking-[0.18em] ${JORNADA_TONE_CLASS[jornada.tone]}`}
            >
              {jornada.label}
            </span>
          </div>
          <h2 className="font-display text-lg leading-tight text-[color:var(--admin-cinza-1)]">
            {acao.titulo}
          </h2>
          {acao.detalhe ? (
            <p className="text-xs text-[color:var(--admin-cinza-2)]">{acao.detalhe}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
