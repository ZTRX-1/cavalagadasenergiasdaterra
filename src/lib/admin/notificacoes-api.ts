import { supabase } from "@/integrations/supabase/client";

export type NotificacaoCategoria = "comercial" | "financeiro" | "operacional" | "sistema";

export interface NotificacaoItem {
  id: string;
  evento: string;
  entidade: string;
  entidade_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  categoria: NotificacaoCategoria;
  titulo: string;
  descricao: string;
  lida: boolean;
}

const CATEGORIAS: Record<string, { cat: NotificacaoCategoria; titulo: string }> = {
  lead_criado: { cat: "comercial", titulo: "Lead recebido" },
  lead_qualificado: { cat: "comercial", titulo: "Lead qualificado" },
  lead_pronto_reserva: { cat: "comercial", titulo: "Lead pronto para reserva" },
  lead_pago: { cat: "comercial", titulo: "Lead pago" },
  pagamento_recebido: { cat: "financeiro", titulo: "Pagamento recebido" },
  pagamento_confirmado: { cat: "financeiro", titulo: "Pagamento confirmado" },
  parcela_vencendo: { cat: "financeiro", titulo: "Parcela vencendo" },
  parcela_atrasada: { cat: "financeiro", titulo: "Parcela atrasada" },
  reserva_criada: { cat: "financeiro", titulo: "Reserva criada" },
  reserva_confirmada: { cat: "financeiro", titulo: "Reserva confirmada" },
  contrato_enviado: { cat: "operacional", titulo: "Contrato enviado" },
  contrato_assinado: { cat: "operacional", titulo: "Contrato assinado" },
  documento_enviado: { cat: "operacional", titulo: "Documento enviado" },
  documento_recebido: { cat: "operacional", titulo: "Documento recebido" },
  documento_aprovado: { cat: "operacional", titulo: "Documento aprovado" },
  participante_confirmado: { cat: "operacional", titulo: "Participante confirmado" },
  usuario_criado: { cat: "sistema", titulo: "Usuário criado" },
  cargo_alterado: { cat: "sistema", titulo: "Cargo alterado" },
  integracao_conectada: { cat: "sistema", titulo: "Integração conectada" },
};

function descreverPayload(evento: string, payload: Record<string, unknown>): string {
  const p = payload || {};
  if (evento.startsWith("lead_")) return (p.nome as string) || (p.protocolo as string) || "Novo evento de lead";
  if (evento.startsWith("pagamento_") || evento.startsWith("parcela_")) {
    const valor = p.valor != null ? `R$ ${Number(p.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";
    return [p.tipo, valor].filter(Boolean).join(" • ") || "Movimentação financeira";
  }
  if (evento.startsWith("reserva_") || evento.startsWith("contrato_"))
    return (p.protocolo as string) || (p.expedicao_nome as string) || "Atualização de reserva";
  if (evento.startsWith("documento_"))
    return (p.titulo as string) || (p.categoria as string) || "Documento atualizado";
  return "—";
}

export async function listarNotificacoes(limit = 50): Promise<NotificacaoItem[]> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return [];

  const { data: eventos, error } = await supabase
    .from("webhooks_eventos")
    .select("id, evento, entidade, entidade_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !eventos) return [];

  const { data: lidas } = await supabase
    .from("notificacoes_lidas")
    .select("webhook_evento_id, excluida")
    .eq("user_id", userId);
    
  const lidasSet = new Set((lidas ?? []).filter(x => !x.excluida).map((x) => x.webhook_evento_id));
  const excluidasSet = new Set((lidas ?? []).filter(x => x.excluida).map((x) => x.webhook_evento_id));

  return eventos
    .filter(e => !excluidasSet.has(e.id)) // Filtra notificações que foram "limpas" pelo usuário
    .map((e) => {
      const meta = CATEGORIAS[e.evento] ?? { cat: "sistema" as NotificacaoCategoria, titulo: e.evento };
      const payload = (e.payload as Record<string, unknown>) ?? {};
      return {
        id: e.id,
        evento: e.evento,
        entidade: e.entidade,
        entidade_id: e.entidade_id,
        payload,
        created_at: e.created_at,
        categoria: meta.cat,
        titulo: meta.titulo,
        descricao: descreverPayload(e.evento, payload),
        lida: lidasSet.has(e.id),
      };
    });
}

export async function marcarComoLida(eventoId: string): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return;
  await supabase.from("notificacoes_lidas").upsert(
    { user_id: userId, webhook_evento_id: eventoId },
    { onConflict: "user_id,webhook_evento_id" },
  );
}

export async function marcarTodasComoLidas(ids: string[]): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId || ids.length === 0) return;
  const rows = ids.map((id) => ({ user_id: userId, webhook_evento_id: id }));
  await supabase.from("notificacoes_lidas").upsert(rows, { onConflict: "user_id,webhook_evento_id" });
}

export async function excluirNotificacoes(ids: string[]): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId || ids.length === 0) return;

  const rows = ids.map((id) => ({ 
    user_id: userId, 
    webhook_evento_id: id,
    lida_em: new Date().toISOString(),
    excluida: true 
  }));
  
  await supabase.from("notificacoes_lidas").upsert(rows, { onConflict: "user_id,webhook_evento_id" });
}
