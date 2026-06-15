import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getReservaDetalhada,
  listPagamentosByReserva,
  listReservaDocumentos,
  createReservaDocumento,
  deleteReservaDocumento,
  updateReservaCampo,
  deleteReserva,
  buildReservaTimeline,
  calcularSituacaoReserva,
  STATUS_FINANCEIRO,
  STATUS_OPERACIONAL,
  TIPOS_DOCUMENTO_RESERVA,
  type TimelineItem,
} from "@/lib/admin/financeiro-api";
import { ReservaPagamentos } from "@/components/admin/reserva-pagamentos";
import { ReservaParticipantes } from "@/components/admin/reserva-participantes";
import { Visao360 } from "@/components/admin/visao-360";
import { StatusBadge } from "@/components/admin/admin-status-badge";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  FileText,
  Wallet,
  Users,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ProximaAcaoBanner } from "@/components/admin/proxima-acao-banner";


export const Route = createFileRoute("/admin/_authenticated/reservas/$id")({
  component: ReservaDetalhePage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-rose-300">Erro ao carregar reserva: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">Reserva não encontrada.</div>,
});

const TONE_CLASSES: Record<string, string> = {
  ok: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  warn: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  danger: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  info: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
};

function fmtBRL(v: number | null | undefined) {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(s: string | null | undefined) {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return s;
  }
}

function ReservaDetalhePage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const router = useRouter();

  const reservaQ = useQuery({
    queryKey: ["admin", "reserva", id],
    queryFn: () => getReservaDetalhada(id),
  });
  const reserva = reservaQ.data;

  const pagamentosQ = useQuery({
    queryKey: ["admin", "reserva", id, "pagamentos"],
    queryFn: () => listPagamentosByReserva(id),
  });
  const docsQ = useQuery({
    queryKey: ["admin", "reserva", id, "docs"],
    queryFn: () => listReservaDocumentos(id),
  });
  const timelineQ = useQuery({
    queryKey: ["admin", "reserva", id, "timeline", reserva?.lead_id ?? null],
    queryFn: () =>
      buildReservaTimeline({ reservaId: id, leadId: reserva?.lead_id ?? null }),
    enabled: !!reserva,
  });

  const updateMut = useMutation({
    mutationFn: (patch: Parameters<typeof updateReservaCampo>[1]) =>
      updateReservaCampo(id, patch),
    onSuccess: () => {
      toast.success("Atualizado.");
      qc.invalidateQueries({ queryKey: ["admin", "reserva", id] });
      router.invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteReserva(id),
    onSuccess: () => {
      toast.success("Reserva excluída.");
      router.navigate({ to: "/admin/reservas" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (reservaQ.isLoading) return <div className="p-6">Carregando…</div>;
  if (!reserva)
    return (
      <div className="p-6">
        <Link to="/admin/reservas" className="text-[color:var(--admin-dourado)]">
          ← Voltar
        </Link>
        <p className="mt-4">Reserva não encontrada.</p>
      </div>
    );

  const sit = calcularSituacaoReserva(reserva);
  const proximoPag = (pagamentosQ.data ?? [])
    .filter((p) => p.status === "previsto" && p.data_prevista)
    .sort((a, b) => (a.data_prevista! < b.data_prevista! ? -1 : 1))[0];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link
            to="/admin/reservas"
            className="inline-flex items-center gap-1 text-xs text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado)]"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar para reservas
          </Link>
          <h1 className="font-display text-2xl text-[color:var(--admin-cinza-1)]">
            Reserva {reserva.protocolo}
          </h1>
          <p className="text-sm text-[color:var(--admin-cinza-3)]">
            {reserva.expedicao_nome} · {reserva.data_label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SituacaoVisual tone={sit.tone} label={sit.label} />
          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja excluir esta reserva? Esta ação não pode ser desfeita e removerá todos os participantes e pagamentos vinculados.")) {
                deleteMut.mutate();
              }
            }}
            disabled={deleteMut.isPending}
            className="admin-btn-ghost hover:!bg-rose-500/10 hover:!text-rose-300 gap-2 h-10 px-4"
          >
            <Trash2 className="h-4 w-4" />
            Excluir Reserva
          </button>
        </div>
      </div>

      <ProximaAcaoBanner
        lead={{
          status: "convertido",
          etapa_atendimento:
            reserva.status_operacional === "expedicao_concluida" ? "concluido"
              : reserva.status_operacional === "participante_confirmado" ? "participante_confirmado"
              : reserva.status_operacional === "reserva_confirmada" ? "convertido"
              : "reserva_pendente",
          proxima_acao: null,
        } as any}
        contexto={{
          temReserva: true,
          saldoRestante: reserva.saldo_restante,
          algumPagamento: (pagamentosQ.data?.length ?? 0) > 0,
        }}
      />

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Resumo financeiro */}
        <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5 space-y-3">
          <header className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
            <Wallet className="h-3.5 w-3.5" /> Resumo financeiro
          </header>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Valor total" value={fmtBRL(reserva.valor_total)} />
            <Stat label="Recebido" value={fmtBRL(reserva.valor_pago)} tone="ok" />
            <Stat label="Saldo pendente" value={fmtBRL(reserva.saldo_restante)} tone="warn" />
            <Stat label="Pagamentos" value={String(pagamentosQ.data?.length ?? 0)} />
            <Stat
              label="Próximo vencimento"
              value={proximoPag?.data_prevista ? fmtDate(proximoPag.data_prevista) : "—"}
            />
            <Stat
              label="Status financeiro"
              value={
                STATUS_FINANCEIRO.find((s) => s.id === reserva.status_financeiro)?.label ??
                reserva.status_financeiro
              }
            />
          </div>
        </section>

        {/* Resumo operacional */}
        <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5 space-y-3">
          <header className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
            <Calendar className="h-3.5 w-3.5" /> Resumo operacional
          </header>
          <div className="space-y-2 text-sm">
            <InfoRow icon={Calendar} label="Data" value={reserva.data_label} />
            <InfoRow icon={Users} label="Participantes" value={String(reserva.quantidade_participantes)} />
            <InfoRow icon={Mail} label="E-mail" value={reserva.cliente_email ?? "—"} />
            <InfoRow icon={Phone} label="Telefone" value={reserva.cliente_telefone ?? "—"} />
            <div className="pt-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
                Motivação da viagem
              </label>
              <textarea
                defaultValue={(reserva as any).motivacao_viagem ?? ""}
                onBlur={(e) => {
                  if (e.target.value !== ((reserva as any).motivacao_viagem ?? "")) {
                    updateMut.mutate({ motivacao_viagem: e.target.value } as any);
                  }
                }}
                rows={2}
                className="mt-1 w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
                placeholder="O que espera viver nessa experiência..."
              />
            </div>
            <div className="pt-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
                Status operacional
              </label>
              <select
                value={reserva.status_operacional}
                onChange={(e) => updateMut.mutate({ status_operacional: e.target.value })}
                className="mt-1 w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
              >
                {STATUS_OPERACIONAL.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Contrato e observações */}
        <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5 space-y-3">
          <header className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
            <FileText className="h-3.5 w-3.5" /> Contrato
          </header>
          <ToggleRow
            label="Contrato enviado"
            checked={reserva.contrato_enviado}
            at={reserva.contrato_enviado_em}
            onChange={(v) => updateMut.mutate({ contrato_enviado: v })}
          />
          <ToggleRow
            label="Contrato assinado"
            checked={reserva.contrato_assinado}
            at={reserva.contrato_assinado_em}
            onChange={(v) => updateMut.mutate({ contrato_assinado: v })}
          />
          <div className="pt-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
              Informações importantes
            </label>
            <textarea
              defaultValue={(reserva as any).observacoes_importantes ?? ""}
              onBlur={(e) => {
                if (e.target.value !== ((reserva as any).observacoes_importantes ?? "")) {
                  updateMut.mutate({ observacoes_importantes: e.target.value } as any);
                }
              }}
              rows={2}
              className="mt-1 w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
              placeholder="Alergias, restrições, limitações..."
            />
          </div>
          <div className="pt-2">
            <label className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--admin-cinza-3)]">
              Observações internas
            </label>
            <textarea
              defaultValue={reserva.observacoes_internas ?? ""}
              onBlur={(e) => {
                if (e.target.value !== (reserva.observacoes_internas ?? "")) {
                  updateMut.mutate({ observacoes_internas: e.target.value });
                }
              }}
              rows={3}
              className="mt-1 w-full rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
              placeholder="Notas internas sobre essa reserva…"
            />
          </div>
        </section>
      </div>

      <Visao360 reservaId={id} />



      <ReservaPagamentos
        reservaId={id}
        expedicaoId={reserva.expedicao_id ?? null}
        valorTotal={reserva.valor_total}
        pagamentos={pagamentosQ.data ?? []}
        onChanged={() => {
          pagamentosQ.refetch();
          timelineQ.refetch();
        }}
      />

      <ReservaParticipantes 
        reservaId={id} 
        expedicaoId={reserva.expedicao_id ?? null}
        dataId={reserva.data_id ?? null}
      />

      <Documentos reservaId={id} docs={docsQ.data ?? []} onChange={() => docsQ.refetch()} />

      <Timeline items={timelineQ.data ?? []} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--admin-cinza-3)]">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-display text-base text-[color:var(--admin-cinza-1)]",
          tone === "ok" && "text-emerald-300",
          tone === "warn" && "text-amber-300",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[color:var(--admin-cinza-2)]">
      <Icon className="h-3.5 w-3.5 text-[color:var(--admin-cinza-3)]" />
      <span className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--admin-cinza-3)] w-24">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  at,
  onChange,
}: {
  label: string;
  checked: boolean;
  at: string | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer">
      <span className="text-sm">
        {label}
        {at && (
          <span className="ml-2 text-[11px] text-[color:var(--admin-cinza-3)]">
            ({fmtDate(at)})
          </span>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[color:var(--admin-dourado)]"
      />
    </label>
  );
}

function SituacaoVisual({ tone, label }: { tone: string; label: string }) {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "danger" ? AlertTriangle : Clock;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 text-sm font-medium",
        TONE_CLASSES[tone] ?? TONE_CLASSES.info,
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}

function Documentos({
  reservaId,
  docs,
  onChange,
}: {
  reservaId: string;
  docs: Awaited<ReturnType<typeof listReservaDocumentos>>;
  onChange: () => void;
}) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    tipo: "contrato",
    titulo: "",
    url: "",
    observacoes: "",
  });

  const add = async () => {
    if (!form.titulo) return toast.error("Informe um título");
    try {
      await createReservaDocumento({
        reserva_id: reservaId,
        tipo: form.tipo,
        titulo: form.titulo,
        url: form.url || null,
        status: "pendente",
        enviado_em: null,
        assinado_em: null,
        observacoes: form.observacoes || null,
      });
      toast.success("Documento adicionado");
      setShow(false);
      setForm({ tipo: "contrato", titulo: "", url: "", observacoes: "" });
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir documento?")) return;
    try {
      await deleteReservaDocumento(id);
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em]">
          <FileText className="h-3.5 w-3.5" /> Documentos da reserva
        </div>
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="inline-flex items-center gap-1 text-xs text-[color:var(--admin-dourado)] hover:underline"
        >
          <Plus className="h-3 w-3" /> Novo documento
        </button>
      </header>

      {show && (
        <div className="mb-4 grid sm:grid-cols-2 gap-3 rounded-lg border border-[color:var(--admin-borda)] p-3 bg-[color:var(--admin-carvao)]/40">
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          >
            {TIPOS_DOCUMENTO_RESERVA.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título"
            className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="URL (opcional)"
            className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm sm:col-span-2"
          />
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            placeholder="Observações"
            rows={2}
            className="rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao)] px-2 py-1.5 text-sm sm:col-span-2"
          />
          <button
            type="button"
            onClick={add}
            className="sm:col-span-2 rounded-md bg-[color:var(--admin-dourado)] text-[color:var(--admin-carvao)] px-3 py-2 text-sm font-medium"
          >
            Salvar documento
          </button>
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">
          Nenhum documento vinculado ainda. Use o botão acima para anexar contratos,
          comprovantes, documentos do participante ou termos.
        </p>
      ) : (
        <ul className="divide-y divide-[color:var(--admin-borda)]">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusBadge status={d.tipo} />
                  <span className="text-sm text-[color:var(--admin-cinza-1)] truncate">
                    {d.titulo}
                  </span>
                </div>
                {d.observacoes && (
                  <div className="text-[11px] text-[color:var(--admin-cinza-3)] mt-1">
                    {d.observacoes}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {d.url && (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[color:var(--admin-cinza-3)] hover:text-[color:var(--admin-dourado)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => del(d.id)}
                  className="text-[color:var(--admin-cinza-3)] hover:text-rose-300"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="rounded-xl border border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/20 p-5">
      <header className="flex items-center gap-2 text-[color:var(--admin-cinza-3)] text-xs uppercase tracking-[0.2em] mb-4">
        <Clock className="h-3.5 w-3.5" /> Timeline unificada
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-[color:var(--admin-cinza-3)]">
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <ol className="relative border-l border-[color:var(--admin-borda)] pl-5 space-y-4">
          {items.map((it) => (
            <li key={it.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--admin-carvao)]",
                  it.fonte === "pagamento" && "bg-emerald-400",
                  it.fonte === "documento" && "bg-amber-400",
                  it.fonte === "reserva" && "bg-sky-400",
                  it.fonte === "lead" && "bg-violet-400",
                )}
              />
              <div className="flex items-center gap-2 mb-0.5">
                <StatusBadge status={it.tipo} />
                <span className="text-[11px] text-[color:var(--admin-cinza-3)]">
                  {fmtDate(it.at)}
                </span>
              </div>
              <div className="text-sm text-[color:var(--admin-cinza-1)]">{it.titulo}</div>
              {it.descricao && (
                <div className="text-[11px] text-[color:var(--admin-cinza-3)] mt-0.5">
                  {it.descricao}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
