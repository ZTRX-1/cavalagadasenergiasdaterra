import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  FileText,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FilaItem = {
  id: string;
  titulo: string;
  detalhe?: string;
  href: string;
  meta?: string;
};

type Fila = {
  id: string;
  titulo: string;
  descricao: string;
  icon: typeof Wallet;
  tone: "warn" | "info" | "danger" | "ok";
  itens: FilaItem[];
  total: number;
};

const TONE_CLASS: Record<Fila["tone"], string> = {
  warn:   "border-amber-400/30  bg-amber-400/5  text-amber-100",
  info:   "border-sky-400/30    bg-sky-400/5    text-sky-100",
  danger: "border-rose-400/30   bg-rose-400/5   text-rose-100",
  ok:     "border-emerald-400/30 bg-emerald-400/5 text-emerald-100",
};

async function carregarFilas(): Promise<Fila[]> {
  const sevenDays = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
  const hoje = new Date().toISOString().slice(0, 10);

  const [leadsRespRes, reservasPagRes, fichasRes, docsRes, expsRes] = await Promise.all([
    // 1. Leads aguardando resposta
    supabase
      .from("leads")
      .select("id, nome, expedicao_interesse, created_at, proxima_acao")
      .in("etapa_atendimento", ["novo", "triagem_ia", "qualificado"])
      .neq("status", "abandonado")
      .order("created_at", { ascending: false })
      .limit(6),

    // 2. Reservas aguardando pagamento
    supabase
      .from("reservas")
      .select("id, protocolo, cliente_nome, valor_total, valor_pago, saldo_restante, expedicao_nome, data_label, status_financeiro")
      .in("status_financeiro", ["aguardando_pagamento", "parcialmente_pago"])
      .order("created_at", { ascending: false })
      .limit(6),

    // 3. Participantes com ficha incompleta
    supabase
      .from("participantes")
      .select("id, nome, reserva_id, cpf_recebido, ficha_medica_enviada")
      .or("cpf_recebido.eq.false,ficha_medica_enviada.eq.false")
      .limit(6),

    // 4. Reservas com contrato pendente
    supabase
      .from("reservas")
      .select("id, protocolo, cliente_nome, expedicao_nome, contrato_enviado, contrato_assinado")
      .or("contrato_enviado.eq.false,contrato_assinado.eq.false")
      .limit(6),

    // 5. Próximas expedições (próx. 7 dias)
    supabase
      .from("datas")
      .select("id, expedicao_id, data_inicio, data_fim, vagas_disponiveis, vagas_total")
      .gte("data_inicio", hoje)
      .lte("data_inicio", sevenDays)
      .order("data_inicio", { ascending: true })
      .limit(6),
  ]);

  const expIdsSet = new Set(
    (expsRes.data ?? []).map((d: any) => d.expedicao_id).filter(Boolean),
  );
  const expsMap = new Map<string, string>();
  if (expIdsSet.size > 0) {
    const { data: expData } = await supabase
      .from("expedicoes")
      .select("id, nome")
      .in("id", Array.from(expIdsSet));
    (expData ?? []).forEach((e: any) => expsMap.set(e.id, e.nome));
  }

  const filas: Fila[] = [
    {
      id: "leads",
      titulo: "Aguardando resposta",
      descricao: "Contatos novos e em qualificação",
      icon: Sparkles,
      tone: "warn",
      total: leadsRespRes.data?.length ?? 0,
      itens: (leadsRespRes.data ?? []).map((l: any) => ({
        id: l.id,
        titulo: l.nome ?? "Sem nome",
        detalhe: l.expedicao_interesse ?? l.proxima_acao ?? "Sem expedição definida",
        meta: l.created_at ? new Date(l.created_at).toLocaleDateString("pt-BR") : undefined,
        href: `/admin/leads/${l.id}`,
      })),
    },
    {
      id: "pagamento",
      titulo: "Aguardando pagamento",
      descricao: "Reservas com saldo em aberto",
      icon: Wallet,
      tone: "warn",
      total: reservasPagRes.data?.length ?? 0,
      itens: (reservasPagRes.data ?? []).map((r: any) => ({
        id: r.id,
        titulo: r.cliente_nome ?? r.protocolo,
        detalhe: `${r.expedicao_nome ?? "—"} · ${r.data_label ?? "—"}`,
        meta: Number(r.saldo_restante ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
        href: `/admin/reservas/${r.id}`,
      })),
    },
    {
      id: "fichas",
      titulo: "Fichas incompletas",
      descricao: "Participantes com dados pendentes",
      icon: Users,
      tone: "info",
      total: fichasRes.data?.length ?? 0,
      itens: (fichasRes.data ?? []).map((p: any) => ({
        id: p.id,
        titulo: p.nome ?? "Sem nome",
        detalhe: [!p.cpf_recebido && "CPF", !p.ficha_medica_enviada && "Ficha médica"]
          .filter(Boolean)
          .join(" · "),
        href: p.reserva_id ? `/admin/reservas/${p.reserva_id}` : `/admin/participantes`,
      })),
    },
    {
      id: "docs",
      titulo: "Contratos pendentes",
      descricao: "Documentação não assinada",
      icon: FileText,
      tone: "info",
      total: docsRes.data?.length ?? 0,
      itens: (docsRes.data ?? []).map((r: any) => ({
        id: r.id,
        titulo: r.cliente_nome ?? r.protocolo,
        detalhe: r.contrato_assinado
          ? "Contrato assinado"
          : r.contrato_enviado
          ? "Aguardando assinatura"
          : "Contrato não enviado",
        href: `/admin/reservas/${r.id}`,
      })),
    },
    {
      id: "proximas",
      titulo: "Próximas expedições",
      descricao: "Embarques nos próximos 7 dias",
      icon: Calendar,
      tone: "ok",
      total: expsRes.data?.length ?? 0,
      itens: (expsRes.data ?? []).map((d: any) => ({
        id: d.id,
        titulo: expsMap.get(d.expedicao_id) ?? "Expedição",
        detalhe: `${new Date(d.data_inicio + "T00:00:00").toLocaleDateString("pt-BR")} → ${new Date(d.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}`,
        meta: `${(d.vagas_total ?? 0) - (d.vagas_disponiveis ?? 0)}/${d.vagas_total ?? 0} vagas`,
        href: `/admin/expedicoes/${d.expedicao_id}`,
      })),
    },
  ];
  return filas;
}

export function CentralOperacional() {
  const { data: filas, isLoading } = useQuery({
    queryKey: ["admin", "central-operacional"],
    queryFn: carregarFilas,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="admin-card h-56 animate-pulse" />
        ))}
      </div>
    );
  }

  const totalPendencias = (filas ?? []).slice(0, 4).reduce((s, f) => s + f.total, 0);

  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-3)]">
            Central Operacional
          </div>
          <h2 className="font-display text-2xl text-[color:var(--admin-cinza-1)]">
            O que precisa da sua atenção hoje
          </h2>
        </div>
        <div className={`rounded-full border px-3 py-1 text-[11px] ${totalPendencias > 0 ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"}`}>
          {totalPendencias > 0 ? `${totalPendencias} pendência(s)` : "Sem pendências"}
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(filas ?? []).map((fila) => (
          <FilaCard key={fila.id} fila={fila} />
        ))}
      </div>
    </section>
  );
}

function FilaCard({ fila }: { fila: Fila }) {
  const Icon = fila.icon;
  return (
    <article className={`admin-card flex flex-col p-4 ${TONE_CLASS[fila.tone]}`}>
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/20 ring-1 ring-white/10">
            <Icon className="h-4 w-4" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-display text-sm text-[color:var(--admin-cinza-1)]">{fila.titulo}</h3>
            <p className="text-[10px] text-[color:var(--admin-cinza-3)]">{fila.descricao}</p>
          </div>
        </div>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-mono">{fila.total}</span>
      </header>

      {fila.itens.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-6 text-[11px] text-[color:var(--admin-cinza-3)]">
          Nada pendente
        </div>
      ) : (
        <ul className="space-y-1.5">
          {fila.itens.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                to={item.href as never}
                className="group flex items-start justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-[color:var(--admin-borda)] hover:bg-black/20 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-[color:var(--admin-cinza-1)]">{item.titulo}</div>
                  {item.detalhe ? (
                    <div className="truncate text-[10px] text-[color:var(--admin-cinza-3)]">{item.detalhe}</div>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  {item.meta ? (
                    <span className="text-[10px] font-mono text-[color:var(--admin-cinza-2)]">{item.meta}</span>
                  ) : null}
                  <ArrowRight className="h-3 w-3 text-[color:var(--admin-cinza-3)] group-hover:text-[color:var(--admin-dourado)]" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
