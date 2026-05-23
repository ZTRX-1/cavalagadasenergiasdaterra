export const WHATSAPP_NUMBER = "5511941626907";

export interface ReservaWhatsappPayload {
  nomeResponsavel: string;
  expedicaoNome: string;
  dataLabel: string;
  quantidadeParticipantes: number;
  protocolo: string;
}

export function buildReservaWhatsappUrl(p: ReservaWhatsappPayload): string {
  const msg = `Olá, meu nome é ${p.nomeResponsavel}. Acabei de realizar uma pré-reserva no site da Cavalgadas Energias da Terra.

Expedição: ${p.expedicaoNome}
Data: ${p.dataLabel}
Participantes: ${p.quantidadeParticipantes}
Protocolo: ${p.protocolo}

Gostaria de prosseguir com a confirmação da reserva.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export function buildContactWhatsappUrl(extra?: string): string {
  const base = "Olá! Gostaria de mais informações sobre as expedições da Cavalgadas Energias da Terra.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(extra ? `${base}\n\n${extra}` : base)}`;
}
