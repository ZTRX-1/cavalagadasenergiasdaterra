import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Loader2, Search, MessageCircle } from "lucide-react";
import { consultarReserva } from "@/lib/reservas.functions";
import { buildReservaWhatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ p: z.string().optional() });

export const Route = createFileRoute("/minha-reserva")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Minha Reserva — Cavalgadas Energias da Terra" },
      { name: "description", content: "Consulte o status da sua pré-reserva pelo protocolo." },
    ],
  }),
  component: MinhaReserva,
});

const STATUS_STEPS = [
  { key: "pre_reserva_enviada", label: "Pré-reserva enviada" },
  { key: "aguardando_contato", label: "Aguardando contato" },
  { key: "aguardando_pagamento", label: "Aguardando pagamento" },
  { key: "confirmada", label: "Confirmada" },
] as const;

function MinhaReserva() {
  const search = Route.useSearch();
  const consultar = useServerFn(consultarReserva);
  const [protocolo, setProtocolo] = useState(search.p ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolo.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const r = await consultar({ data: { protocolo: protocolo.trim() } });
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="container-tight max-w-3xl">
        <div className="eyebrow">Consulta</div>
        <h1 className="mt-4 font-display text-5xl text-balance md:text-6xl">Minha Reserva</h1>
        <p className="mt-4 text-muted-foreground text-pretty">
          Informe o protocolo recebido após sua pré-reserva. Ex: <code className="font-mono text-foreground">CET-2026-001</code>
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            value={protocolo}
            onChange={(e) => setProtocolo(e.target.value)}
            placeholder="CET-2026-001"
            className="flex-1 rounded-sm border border-border bg-card px-5 py-4 font-mono text-lg uppercase tracking-wider outline-none focus:border-cobre"
          />
          <button disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-floresta-deep px-7 py-4 text-sm uppercase tracking-widest text-areia hover:bg-cobre disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Consultar
          </button>
        </form>

        {searched && !loading && (
          result ? (
            <div className="mt-12 overflow-hidden rounded-sm border border-border bg-card">
              <div className="border-b border-border p-6">
                <div className="eyebrow">{result.protocolo}</div>
                <h2 className="mt-2 font-display text-2xl">{result.expedicao_nome}</h2>
                <div className="mt-1 text-sm text-muted-foreground">{result.data_label} · {result.quantidade_participantes} participante(s)</div>
                <div className="mt-1 text-sm text-muted-foreground">Responsável: {result.nome_responsavel}</div>
              </div>
              <div className="p-6">
                <div className="eyebrow">Status atual</div>
                {result.status === "cancelada" ? (
                  <div className="mt-4 inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">Cancelada</div>
                ) : (
                  <ol className="mt-6 space-y-4">
                    {STATUS_STEPS.map((s, i) => {
                      const currentIdx = STATUS_STEPS.findIndex((x) => x.key === result.status);
                      const done = i <= currentIdx;
                      const current = i === currentIdx;
                      return (
                        <li key={s.key} className="flex items-center gap-4">
                          <span className={cn("flex h-8 w-8 items-center justify-center rounded-full border text-xs font-display", done ? "border-cobre bg-cobre text-areia" : "border-border text-muted-foreground")}>{i + 1}</span>
                          <span className={cn("text-sm", current ? "font-medium text-foreground" : done ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
              {result.status !== "cancelada" && (
                <div className="border-t border-border bg-secondary/50 p-6">
                  <a
                    href={buildReservaWhatsappUrl({
                      nomeResponsavel: result.nome_responsavel,
                      expedicaoNome: result.expedicao_nome,
                      dataLabel: result.data_label,
                      quantidadeParticipantes: result.quantidade_participantes,
                      protocolo: result.protocolo,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-white sm:w-auto"
                  >
                    <MessageCircle className="h-4 w-4" /> Continuar pelo WhatsApp
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-12 rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-sm text-foreground">
              Protocolo não encontrado. Verifique se foi digitado corretamente.
            </div>
          )
        )}
      </div>
    </div>
  );
}
