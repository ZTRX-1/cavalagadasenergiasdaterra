import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wallet, Users, FileText, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getReservaDetalhada,
  listPagamentosByReserva,
  listReservaDocumentos,
} from "@/lib/admin/financeiro-api";

function fmtBRL(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  reservaId: string;
}

/**
 * Bloco unificado da Reserva exibido dentro da ficha do cliente.
 * Mostra financeiro, participantes, documentos e atalhos para resolver
 * tudo sem sair da ficha.
 */
export function ReservaResumoCard({ reservaId }: Props) {
  const reservaQ = useQuery({
    queryKey: ["admin", "reserva", reservaId],
    queryFn: () => getReservaDetalhada(reservaId),
  });
  const pagamentosQ = useQuery({
    queryKey: ["admin", "reserva", reservaId, "pagamentos"],
    queryFn: () => listPagamentosByReserva(reservaId),
  });
  const docsQ = useQuery({
    queryKey: ["admin", "reserva", reservaId, "documentos"],
    queryFn: () => listReservaDocumentos(reservaId),
  });
  const participantesQ = useQuery({
    queryKey: ["admin", "reserva", reservaId, "participantes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("participantes")
        .select("id, nome, status, cpf_recebido, ficha_medica_enviada, documentacao_aprovada")
        .eq("reserva_id", reservaId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const reserva = reservaQ.data;
  if (!reserva) {
    return <div className="admin-card h-32 animate-pulse" />;
  }

  const pagamentos = pagamentosQ.data ?? [];
  const docs = docsQ.data ?? [];
  const participantes = participantesQ.data ?? [];

  const proximoPag = pagamentos
    .filter((p) => p.status === "previsto" && p.data_prevista)
    .sort((a, b) => (a.data_prevista ?? "").localeCompare(b.data_prevista ?? ""))[0];

  const fichasIncompletas = participantes.filter(
    (p: any) => !p.cpf_recebido || !p.ficha_medica_enviada,
  ).length;
  const docsPendentes = docs.filter((d) => d.status !== "assinado" && d.status !== "aprovado").length;

  return (
    <section className="admin-card overflow-hidden border-[color:var(--admin-borda-strong)]/60">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--admin-borda)] bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent px-5 py-3">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">Reserva vinculada</div>
            <div className="font-display text-base text-[color:var(--admin-cinza-1)]">
              {reserva.protocolo}
              <span className="ml-2 text-xs font-normal text-[color:var(--admin-cinza-2)]">
                · {reserva.expedicao_nome} · {reserva.data_label}
              </span>
            </div>
          </div>
        </div>
        <Link
          to="/admin/reservas/$id"
          params={{ id: reservaId }}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--admin-dourado)]/40 bg-[color:var(--admin-dourado)]/10 px-3 py-1.5 text-xs text-[color:var(--admin-dourado)] hover:bg-[color:var(--admin-dourado)]/20"
        >
          Abrir ficha completa <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid gap-px bg-[color:var(--admin-borda)] sm:grid-cols-3">
        {/* PAGAMENTO */}
        <div className="bg-[color:var(--admin-carvao-deep)]/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
            <Wallet className="h-3 w-3" /> Pagamento
          </div>
          <div className="space-y-1 text-sm">
            <Linha label="Total" value={fmtBRL(reserva.valor_total)} />
            <Linha label="Recebido" value={fmtBRL(reserva.valor_pago)} tone="ok" />
            <Linha label="Saldo" value={fmtBRL(reserva.saldo_restante)} tone={reserva.saldo_restante && reserva.saldo_restante > 0 ? "warn" : "muted"} />
            {proximoPag?.data_prevista ? (
              <div className="flex items-center gap-1 pt-1 text-[10px] text-amber-200">
                <Calendar className="h-3 w-3" /> Próximo: {new Date(proximoPag.data_prevista).toLocaleDateString("pt-BR")}
              </div>
            ) : null}
          </div>
          <Link
            to="/admin/reservas/$id"
            params={{ id: reservaId }}
            hash="pagamentos"
            className="block pt-1 text-[11px] text-[color:var(--admin-dourado)] hover:underline"
          >
            Registrar pagamento →
          </Link>
        </div>

        {/* PARTICIPANTES */}
        <div className="bg-[color:var(--admin-carvao-deep)]/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
            <Users className="h-3 w-3" /> Participantes
          </div>
          <div className="space-y-1 text-sm">
            <Linha label="No grupo" value={String(participantes.length)} />
            <Linha label="Ficha completa" value={String(participantes.length - fichasIncompletas)} tone="ok" />
            {fichasIncompletas > 0 ? (
              <Linha label="Pendentes" value={String(fichasIncompletas)} tone="warn" />
            ) : null}
          </div>
          <Link
            to="/admin/reservas/$id"
            params={{ id: reservaId }}
            hash="participantes"
            className="block pt-1 text-[11px] text-[color:var(--admin-dourado)] hover:underline"
          >
            Completar fichas →
          </Link>
        </div>

        {/* DOCUMENTOS */}
        <div className="bg-[color:var(--admin-carvao-deep)]/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
            <FileText className="h-3 w-3" /> Documentos
          </div>
          <div className="space-y-1 text-sm">
            <Linha
              label="Contrato"
              value={reserva.contrato_assinado ? "Assinado" : reserva.contrato_enviado ? "Enviado" : "Não enviado"}
              tone={reserva.contrato_assinado ? "ok" : reserva.contrato_enviado ? "warn" : "muted"}
            />
            <Linha label="Anexos" value={String(docs.length)} />
            {docsPendentes > 0 ? (
              <Linha label="Pendentes" value={String(docsPendentes)} tone="warn" />
            ) : null}
          </div>
          <Link
            to="/admin/reservas/$id"
            params={{ id: reservaId }}
            hash="documentos"
            className="block pt-1 text-[11px] text-[color:var(--admin-dourado)] hover:underline"
          >
            Gerenciar documentos →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Linha({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "muted" }) {
  const cls =
    tone === "ok" ? "text-emerald-300"
    : tone === "warn" ? "text-amber-300"
    : tone === "muted" ? "text-[color:var(--admin-cinza-3)]"
    : "text-[color:var(--admin-cinza-1)]";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-[color:var(--admin-cinza-3)]">{label}</span>
      <span className={`font-mono text-xs ${cls}`}>{value}</span>
    </div>
  );
}
