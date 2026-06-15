/**
 * Jornada visual simplificada da operação.
 *
 * Mantém a complexidade técnica (LEAD_ETAPAS, status, etapa_operacional)
 * no banco, mas expõe para a operadora apenas 6 estágios claros:
 *
 *   Novo → Atendimento → Reserva → Confirmado → Concluído → Perdido
 *
 * Essa camada é apenas de leitura no frontend; não escreve no banco
 * nenhuma coluna nova. Quando um movimento de coluna é necessário,
 * mapeamos a jornada de volta para um etapa_atendimento canônico.
 */

import type { LeadEtapaId, LeadRow } from "@/lib/admin/api";

export type JornadaId =
  | "novo"
  | "atendimento"
  | "reserva"
  | "confirmado"
  | "concluido"
  | "perdido";

export interface JornadaEstagio {
  id: JornadaId;
  label: string;
  descricao: string;
  /** Etapa técnica padrão ao mover um card para esta coluna. */
  etapaPadrao: LeadEtapaId;
  /** Cor base para badges/colunas (tailwind tokens). */
  tone: "slate" | "sky" | "amber" | "emerald" | "violet" | "rose";
}

export const JORNADA_ESTAGIOS: readonly JornadaEstagio[] = [
  { id: "novo",        label: "Novo",         descricao: "Acabou de chegar",                etapaPadrao: "novo",                    tone: "slate" },
  { id: "atendimento", label: "Atendimento",  descricao: "Conversando e qualificando",      etapaPadrao: "qualificado",             tone: "sky" },
  { id: "reserva",     label: "Reserva",      descricao: "Proposta ou pré-reserva aberta",  etapaPadrao: "reserva_pendente",        tone: "amber" },
  { id: "confirmado",  label: "Confirmado",   descricao: "Reserva paga e participante OK",  etapaPadrao: "convertido",              tone: "emerald" },
  { id: "concluido",   label: "Concluído",    descricao: "Expedição realizada",             etapaPadrao: "concluido",               tone: "violet" },
  { id: "perdido",     label: "Perdido",      descricao: "Sem continuidade",                etapaPadrao: "perdido",                 tone: "rose" },
] as const;

/** Mapeia status/etapa técnica do banco para um estágio visual. */
export function jornadaFromLead(lead: Pick<LeadRow, "status" | "etapa_atendimento">): JornadaId {
  if (lead.status === "abandonado") return "perdido";
  const etapa = (lead.etapa_atendimento ?? "novo") as LeadEtapaId;
  switch (etapa) {
    case "novo":
    case "triagem_ia":
      return "novo";
    case "qualificado":
      return "atendimento";
    case "proposta_enviada":
    case "reserva_pendente":
      return "reserva";
    case "participante_confirmado":
    case "convertido":
      return "confirmado";
    case "concluido":
      return "concluido";
    case "perdido":
      return "perdido";
    default:
      return "novo";
  }
}

export function jornadaEstagio(id: JornadaId): JornadaEstagio {
  return JORNADA_ESTAGIOS.find((e) => e.id === id) ?? JORNADA_ESTAGIOS[0];
}

/* ------------------------------------------------------------------ */
/* Próxima Ação — bloco obrigatório no topo de cada ficha             */
/* ------------------------------------------------------------------ */

export type ProximaAcaoTone = "info" | "warn" | "ok" | "danger" | "muted";

export interface ProximaAcao {
  titulo: string;
  detalhe?: string;
  tone: ProximaAcaoTone;
}

export interface ProximaAcaoContexto {
  /** Tem reserva vinculada? */
  temReserva?: boolean;
  /** Saldo financeiro restante (R$). */
  saldoRestante?: number | null;
  /** Já recebeu algum pagamento? */
  algumPagamento?: boolean;
  /** Tem documentos pendentes? */
  docsPendentes?: number | null;
  /** Quantidade de participantes com ficha incompleta. */
  fichasIncompletas?: number | null;
  /** Próxima ação manual escrita pela operadora (lead.proxima_acao). */
  proximaAcaoManual?: string | null;
}

/**
 * Calcula a próxima ação operacional. A regra é simples:
 * priorizamos o que está bloqueando o avanço da jornada.
 */
export function calcularProximaAcao(
  lead: Pick<LeadRow, "status" | "etapa_atendimento">,
  ctx: ProximaAcaoContexto = {},
): ProximaAcao {
  const jornada = jornadaFromLead(lead);

  if (jornada === "perdido") {
    return { titulo: "Sem ação — lead perdido", tone: "muted" };
  }
  if (jornada === "concluido") {
    return { titulo: "Pós-venda concluído", detalhe: "Nada pendente nesta ficha.", tone: "ok" };
  }

  // Operadora escreveu manualmente uma próxima ação? Respeitar.
  const manual = ctx.proximaAcaoManual?.trim();
  if (manual) {
    return { titulo: manual, tone: "info" };
  }

  if (jornada === "novo") {
    return { titulo: "Responder primeiro contato", detalhe: "Abrir conversa e entender a expedição de interesse.", tone: "warn" };
  }

  if (jornada === "atendimento") {
    return { titulo: "Qualificar e enviar proposta", detalhe: "Confirmar data, número de pessoas e enviar a proposta.", tone: "info" };
  }

  if (jornada === "reserva") {
    if (!ctx.temReserva) {
      return { titulo: "Abrir pré-reserva", detalhe: "Converter o lead em reserva para travar a vaga.", tone: "warn" };
    }
    if ((ctx.saldoRestante ?? 0) > 0 && !ctx.algumPagamento) {
      return { titulo: "Aguardar pagamento do sinal", detalhe: "Confirmar quando o cliente enviar o comprovante.", tone: "warn" };
    }
    if ((ctx.saldoRestante ?? 0) > 0) {
      return { titulo: "Acompanhar pagamento do saldo", detalhe: "Saldo ainda em aberto.", tone: "warn" };
    }
    return { titulo: "Confirmar vaga", detalhe: "Pagamento OK — mover para Confirmado.", tone: "ok" };
  }

  if (jornada === "confirmado") {
    if ((ctx.saldoRestante ?? 0) > 0) {
      return { titulo: "Aguardar pagamento do saldo", tone: "warn" };
    }
    if ((ctx.fichasIncompletas ?? 0) > 0) {
      return { titulo: "Completar ficha de participante", detalhe: `${ctx.fichasIncompletas} ficha(s) ainda incompleta(s).`, tone: "warn" };
    }
    if ((ctx.docsPendentes ?? 0) > 0) {
      return { titulo: "Solicitar documentos", detalhe: `${ctx.docsPendentes} documento(s) pendente(s).`, tone: "warn" };
    }
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
};
