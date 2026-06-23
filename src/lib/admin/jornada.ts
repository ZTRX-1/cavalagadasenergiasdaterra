/**
 * Jornada operacional do CRM — Fase B.
 *
 * 6 estágios visuais lineares + 1 estágio paralelo (Reativação):
 *   Novo → Em Atendimento → Proposta Enviada → Reserva Confirmada → Expedição Realizada → Perdido
 *   (Reativação fica como coluna separada à direita)
 *
 * O banco aceita esses valores diretamente (constraint Fase A) e também
 * mantém aliases legados para leads antigos.
 */

import type { LeadEtapaId, LeadRow } from "@/lib/admin/api";

export type JornadaId =
  | "novo"
  | "em_atendimento"
  | "proposta_enviada"
  | "reserva_confirmada"
  | "expedicao_realizada"
  | "perdido"
  | "reativacao";

export interface JornadaEstagio {
  id: JornadaId;
  label: string;
  descricao: string;
  /** Valor gravado em leads.etapa_atendimento ao mover o card. */
  etapaPadrao: LeadEtapaId;
  /** Cor base para badges/colunas. */
  tone: "slate" | "sky" | "amber" | "emerald" | "violet" | "rose" | "indigo";
}

/** Colunas exibidas no Kanban principal (jornada linear). */
export const JORNADA_ESTAGIOS: readonly JornadaEstagio[] = [
  { id: "novo",                label: "Leads Novos",         descricao: "Acabaram de chegar",                 etapaPadrao: "novo" as LeadEtapaId,                  tone: "slate" },
  { id: "em_atendimento",      label: "Em Atendimento",      descricao: "Conversando com cliente",            etapaPadrao: "em_atendimento" as LeadEtapaId,        tone: "sky" },
  { id: "proposta_enviada",    label: "Propostas Enviadas",  descricao: "Aguardando retorno",                 etapaPadrao: "proposta_enviada" as LeadEtapaId,      tone: "amber" },
  { id: "reserva_confirmada",  label: "Reservas Confirmadas",descricao: "Vaga garantida",                     etapaPadrao: "reserva_confirmada" as LeadEtapaId,    tone: "emerald" },
  { id: "expedicao_realizada", label: "Expedições Realizadas",descricao: "Pós-venda em andamento",            etapaPadrao: "expedicao_realizada" as LeadEtapaId,   tone: "violet" },
  { id: "perdido",             label: "Perdidos",            descricao: "Sem continuidade",                   etapaPadrao: "perdido" as LeadEtapaId,               tone: "rose" },
] as const;

/** Estágio paralelo, exibido separadamente. */
export const JORNADA_REATIVACAO: JornadaEstagio = {
  id: "reativacao",
  label: "Reativação",
  descricao: "Clientes a recontatar",
  etapaPadrao: "reativacao" as LeadEtapaId,
  tone: "indigo",
};

/** Mapeia qualquer etapa_atendimento (novo ou legado) para um estágio visual. */
export function jornadaFromLead(lead: Pick<LeadRow, "status" | "etapa_atendimento">): JornadaId {
  const etapa = String(lead.etapa_atendimento ?? "novo");
  switch (etapa) {
    case "novo":
    case "triagem_ia":
      return "novo";
    case "em_atendimento":
    case "qualificado":
      return "em_atendimento";
    case "proposta_enviada":
      return "proposta_enviada";
    case "reserva_confirmada":
    case "reserva_pendente":
    case "participante_confirmado":
    case "convertido":
      return "reserva_confirmada";
    case "expedicao_realizada":
    case "concluido":
      return "expedicao_realizada";
    case "perdido":
      return lead.status === "abandonado" ? "perdido" : "perdido";
    case "reativacao":
      return "reativacao";
    default:
      return lead.status === "abandonado" ? "perdido" : "novo";
  }
}

export function jornadaEstagio(id: JornadaId): JornadaEstagio {
  if (id === "reativacao") return JORNADA_REATIVACAO;
  return JORNADA_ESTAGIOS.find((e) => e.id === id) ?? JORNADA_ESTAGIOS[0];
}

/* ------------------------------------------------------------------ */
/* Próxima Ação — bloco no topo da ficha                              */
/* ------------------------------------------------------------------ */

export type ProximaAcaoTone = "info" | "warn" | "ok" | "danger" | "muted";

export interface ProximaAcao {
  titulo: string;
  detalhe?: string;
  tone: ProximaAcaoTone;
}

export interface ProximaAcaoContexto {
  temReserva?: boolean;
  saldoRestante?: number | null;
  algumPagamento?: boolean;
  docsPendentes?: number | null;
  fichasIncompletas?: number | null;
  proximaAcaoManual?: string | null;
}

export function calcularProximaAcao(
  lead: Pick<LeadRow, "status" | "etapa_atendimento">,
  ctx: ProximaAcaoContexto = {},
): ProximaAcao {
  const jornada = jornadaFromLead(lead);

  if (jornada === "perdido")
    return { titulo: "Sem ação — cliente perdido", tone: "muted" };
  if (jornada === "expedicao_realizada")
    return { titulo: "Pós-venda concluído", detalhe: "Nada pendente nesta ficha.", tone: "ok" };
  if (jornada === "reativacao")
    return { titulo: "Reativar contato", detalhe: "Cliente sem interação há tempos — vale uma mensagem.", tone: "info" };

  const manual = ctx.proximaAcaoManual?.trim();
  if (manual) return { titulo: manual, tone: "info" };

  if (jornada === "novo")
    return { titulo: "Responder primeiro contato", detalhe: "Abrir conversa e entender a expedição de interesse.", tone: "warn" };
  if (jornada === "em_atendimento")
    return { titulo: "Qualificar e enviar proposta", detalhe: "Confirmar data, número de pessoas e enviar a proposta.", tone: "info" };
  if (jornada === "proposta_enviada")
    return { titulo: "Acompanhar retorno", detalhe: "Cliente recebeu a proposta — ligar para confirmar.", tone: "warn" };
  if (jornada === "reserva_confirmada") {
    if ((ctx.saldoRestante ?? 0) > 0) return { titulo: "Acompanhar pagamento", tone: "warn" };
    if ((ctx.fichasIncompletas ?? 0) > 0)
      return { titulo: "Completar fichas de participantes", detalhe: `${ctx.fichasIncompletas} ficha(s) pendente(s).`, tone: "warn" };
    if ((ctx.docsPendentes ?? 0) > 0)
      return { titulo: "Solicitar documentos", detalhe: `${ctx.docsPendentes} documento(s) pendente(s).`, tone: "warn" };
    return { titulo: "Sem pendências", detalhe: "Reserva confirmada e pronta para embarque.", tone: "ok" };
  }
  return { titulo: "Sem pendências", tone: "muted" };
}

export const PROXIMA_ACAO_TONE_CLASS: Record<ProximaAcaoTone, string> = {
  info:   "border-sky-400/30 bg-sky-400/10 text-sky-100",
  warn:   "border-amber-400/30 bg-amber-400/10 text-amber-100",
  ok:     "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  danger: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  muted:  "border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/30 text-[color:var(--admin-cinza-2)]",
};

export const JORNADA_TONE_CLASS: Record<JornadaEstagio["tone"], string> = {
  slate:   "border-slate-400/30 bg-slate-400/10 text-slate-100",
  sky:     "border-sky-400/30 bg-sky-400/10 text-sky-100",
  amber:   "border-amber-400/30 bg-amber-400/10 text-amber-100",
  emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  violet:  "border-violet-400/30 bg-violet-400/10 text-violet-100",
  rose:    "border-rose-400/30 bg-rose-400/10 text-rose-100",
  indigo:  "border-indigo-400/30 bg-indigo-400/10 text-indigo-100",
};
