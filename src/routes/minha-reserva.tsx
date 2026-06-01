import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildReservaWhatsappUrl } from "@/lib/whatsapp";
import { consultarReservaPorProtocolo } from "@/lib/pre-reserva";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/minha-reserva")({
  head: () => ({
    meta: [
      { title: "Minha Reserva, Cavalgadas Energias da Terra" },
      { name: "description", content: "Consulte o status da sua pré-reserva pelo protocolo." },
    ],
  }),
  component: MinhaReserva,
});

type Reserva = {
  protocolo: string;
  expedicao_nome: string;
  data_label: string;
  quantidade_participantes: number;
  nome_responsavel: string;
  status: string;
};

function MinhaReserva() {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Reserva | null>(null);
  const [searched, setSearched] = useState(false);

  const STATUS_STEPS = [
    { key: "pre_reserva_enviada", label: t("minhaReserva.statusPreReserva") },
    { key: "aguardando_contato", label: t("minhaReserva.statusAguardandoContato") },
    { key: "aguardando_pagamento", label: t("minhaReserva.statusAguardandoPagamento") },
    { key: "confirmada", label: t("minhaReserva.statusConfirmada") },
  ] as const;

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("p");
      if (p && inputRef.current) {
        inputRef.current.value = p;
      }
    } catch {
      /* noop */
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = (inputRef.current?.value ?? "").trim().toUpperCase();
    if (!value) return;
    setLoading(true);
    setSearched(true);
    try {
      const remote = await consultarReservaPorProtocolo(value);
      if (remote) {
        setResult({
          protocolo: remote.protocolo,
          expedicao_nome: remote.expedicao_nome,
          data_label: remote.data_label,
          quantidade_participantes: remote.quantidade_participantes,
          nome_responsavel: remote.nome_responsavel,
          status: remote.status,
        });
      } else {
        // fallback: reserva apenas local (offline / cache)
        const stored = localStorage.getItem(`cet.reserva.${value}`);
        setResult(stored ? (JSON.parse(stored) as Reserva) : null);
      }
    } catch {
      try {
        const stored = localStorage.getItem(`cet.reserva.${value}`);
        setResult(stored ? (JSON.parse(stored) as Reserva) : null);
      } catch {
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="container-tight max-w-3xl">
        <div className="eyebrow">{t("minhaReserva.eyebrow")}</div>
        <h1 className="mt-4 font-display text-5xl text-balance md:text-6xl">{t("minhaReserva.title")}</h1>
        <p className="mt-4 text-muted-foreground text-pretty">
          {t("minhaReserva.intro")}{" "}
          <code className="font-mono text-foreground">CET-2026-K7M9QX</code>
        </p>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <input
            ref={inputRef}
            type="text"
            name="protocolo"
            defaultValue=""
            placeholder={t("minhaReserva.placeholderProtocolo")}
            aria-label={t("minhaReserva.title")}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="text"
            className="flex-1 rounded-sm border border-border bg-card px-5 py-4 font-mono text-lg tracking-wider outline-none focus:border-cobre"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-floresta-deep px-7 py-4 text-sm uppercase tracking-widest text-areia hover:bg-cobre disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{" "}
            {t("minhaReserva.consultar")}
          </button>
        </form>

        {searched && !loading && (
          result ? (
            <div className="mt-12 overflow-hidden rounded-sm border border-border bg-card">
              <div className="border-b border-border p-6">
                <div className="eyebrow">{result.protocolo}</div>
                <h2 className="mt-2 font-display text-2xl">{result.expedicao_nome}</h2>
                <div className="mt-1 text-sm text-muted-foreground">
                  {result.data_label} · {result.quantidade_participantes} {t("minhaReserva.participantes")}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("minhaReserva.responsavel")}: {result.nome_responsavel}
                </div>
              </div>
              <div className="p-6">
                <div className="eyebrow">{t("minhaReserva.statusAtual")}</div>
                {result.status === "cancelada" ? (
                  <div className="mt-4 inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {t("minhaReserva.cancelada")}
                  </div>
                ) : (
                  <ol className="mt-6 space-y-4">
                    {STATUS_STEPS.map((s, i) => {
                      const currentIdx = STATUS_STEPS.findIndex((x) => x.key === result.status);
                      const done = i <= currentIdx;
                      const current = i === currentIdx;
                      return (
                        <li key={s.key} className="flex items-center gap-4">
                          <span
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-display",
                              done
                                ? "border-cobre bg-cobre text-areia"
                                : "border-border text-muted-foreground",
                            )}
                          >
                            {i + 1}
                          </span>
                          <span
                            className={cn(
                              "text-sm",
                              current
                                ? "font-medium text-foreground"
                                : done
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {s.label}
                          </span>
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
                    <WhatsAppIcon className="h-4 w-4" /> {t("minhaReserva.continuarWhatsapp")}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-12 rounded-sm border border-destructive/30 bg-destructive/5 p-6 text-sm text-foreground">
              {t("minhaReserva.naoEncontrado")}
            </div>
          )
        )}
      </div>
    </div>
  );
}
