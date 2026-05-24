import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, ExternalLink, X, ArrowRight } from "lucide-react";

interface Props {
  variant?: "compact" | "full";
  eyebrow?: string;
  title?: string;
}

type MediaKey = "video" | "horse" | "horse-patagonia" | "bsc";

const YT_ID = "lAsPBK_D7Mw";
const HORSE_URL =
  "https://revistahorse.com.br/liberdade-irmandade-e-a-forca-feminina-em-sintonia-com-o-cavalo-e-a-natureza/";
const HORSE_PATAGONIA_URL =
  "https://revistahorse.com.br/brasileiras-comecam-2026-cavalgando-pela-fascinante-patagonia-argentina/";
const BSC_URL =
  "https://www.bsc.com.vc/magazine/pdf/980b6fac-68ef-4845-9c20-bbff05d69bc7/flipbook";

export function NaMidia({
  variant = "compact",
  eyebrow = "Reconhecidas pela mídia",
  title = "Histórias que ganharam o mundo.",
}: Props) {
  const [openItem, setOpenItem] = useState<MediaKey | null>(null);

  const items = useMemo(
    () => [
      {
        key: "video" as const,
        kicker: "TV · Reportagem",
        name: "Globo",
        description: "Cavalgadas do Brasil ao mundo",
        cta: "Assistir no site",
      },
      {
        key: "horse" as const,
        kicker: "Editorial · Matéria",
        name: "Revista Horse",
        description: "Liberdade, irmandade e força feminina",
        cta: "Ler no site",
      },
      {
        key: "horse-patagonia" as const,
        kicker: "Editorial · 2026",
        name: "Revista Horse",
        description: "Brasileiras cavalgando pela Patagônia argentina",
        cta: "Ler no site",
      },
      {
        key: "bsc" as const,
        kicker: "Magazine · Portugal",
        name: "BSC",
        description: "Presença boutique internacional",
        cta: "Abrir revista",
      },
    ],
    [],
  );

  const activeMeta =
    openItem === "video"
      ? {
          eyebrow: "Globo · Reportagem",
          title: "Cavalgadas no Brasil",
          url: `https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
          type: "video" as const,
        }
      : openItem === "horse"
      ? { eyebrow: "Revista Horse · Editorial", title: "Liberdade, irmandade e força feminina", url: HORSE_URL, type: "iframe" as const }
      : openItem === "horse-patagonia"
      ? { eyebrow: "Revista Horse · 2026", title: "Brasileiras começam 2026 cavalgando pela Patagônia", url: HORSE_PATAGONIA_URL, type: "iframe" as const }
      : openItem === "bsc"
      ? { eyebrow: "BSC Portugal · Magazine", title: "Boutique equestre internacional", url: BSC_URL, type: "iframe" as const }
      : null;

  // COMPACT — apenas autoridade discreta (sem cards, sem embeds)
  if (variant === "compact") {
    return (
      <section className="relative bg-areia-warm py-20 md:py-24">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className="mt-5 font-display text-3xl text-balance md:text-4xl">
              Reconhecidas por grandes mídias.
            </h2>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-14 gap-y-8 md:gap-x-20">
            <MediaWordmark label="Globo" />
            <span className="hidden h-8 w-px bg-carvao/15 md:block" aria-hidden />
            <MediaWordmark label="Revista Horse" italic />
            <span className="hidden h-8 w-px bg-carvao/15 md:block" aria-hidden />
            <MediaWordmark label="BSC" subtitle="Portugal" />
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              to="/quem-somos"
              hash="na-midia"
              className="group inline-flex items-center gap-3 rounded-full border border-carvao/25 bg-background/60 px-8 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.24em] text-carvao transition-colors hover:border-cobre hover:bg-background hover:text-cobre"
            >
              Ver reportagens e entrevistas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // FULL — grid editorial completo
  return (
    <section id="na-midia" className="relative bg-areia-warm py-28 md:py-36">
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{title}</h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-foreground/70">
            Autoridade construída por quem vive o cavalo, a natureza e a hospitalidade como prática diária.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setOpenItem(item.key)}
              className="group flex min-h-[250px] flex-col justify-between border border-carvao/10 bg-background/60 p-7 text-left transition-all hover:-translate-y-1 hover:border-cobre/35 hover:bg-background/85"
            >
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.32em] text-cobre">
                  0{index + 1} · {item.kicker}
                </div>
                <div className="mt-7 font-display text-2xl text-carvao md:text-3xl">
                  {item.name}
                </div>
                <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-foreground/65">
                  {item.description}
                </p>
              </div>

              <span className="mt-8 inline-flex items-center gap-2 font-eyebrow text-[0.68rem] uppercase tracking-[0.24em] text-carvao/75 transition-colors group-hover:text-cobre">
                {item.key === "video" ? <Play className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                {item.cta}
              </span>
            </button>
          ))}
        </div>
      </div>

      {activeMeta && (
        <PremiumOverlay onClose={() => setOpenItem(null)} label={`Fechar ${activeMeta.title}`}>
          <div className="relative w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="text-areia">
                <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.3em] text-cobre-soft">
                  {activeMeta.eyebrow}
                </div>
                <div className="mt-1 font-display text-xl md:text-2xl">{activeMeta.title}</div>
              </div>
              <a
                href={activeMeta.type === "video" ? `https://www.youtube.com/watch?v=${YT_ID}` : activeMeta.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 self-start rounded-full border border-areia/30 px-4 py-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-areia transition-colors hover:border-cobre hover:text-cobre-soft"
              >
                Abrir em nova aba <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="relative overflow-hidden rounded-sm bg-carvao shadow-elegant ring-1 ring-areia/10">
              {activeMeta.type === "video" ? (
                <div className="relative aspect-video w-full">
                  <iframe
                    src={activeMeta.url}
                    title={activeMeta.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              ) : (
                <div className="relative aspect-[16/10] w-full">
                  <iframe
                    src={activeMeta.url}
                    title={activeMeta.title}
                    className="absolute inset-0 h-full w-full bg-background"
                    referrerPolicy="no-referrer"
                    allow="fullscreen"
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-carvao/80 via-transparent to-transparent p-6">
                    <a
                      href={activeMeta.url}
                      target="_blank"
                      rel="noreferrer"
                      className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-cobre px-6 py-3 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia hover:bg-cobre-soft"
                    >
                      Caso não carregue, abrir aqui <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </PremiumOverlay>
      )}
    </section>
  );
}

function MediaWordmark({ label, subtitle, italic }: { label: string; subtitle?: string; italic?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center text-carvao/70 transition-colors hover:text-carvao">
      <span className={`font-display text-2xl md:text-3xl ${italic ? "italic" : ""}`}>{label}</span>
      {subtitle && (
        <span className="mt-1 font-eyebrow text-[0.55rem] uppercase tracking-[0.32em] text-carvao/55">
          {subtitle}
        </span>
      )}
    </div>
  );
}

function PremiumOverlay({
  children,
  onClose,
  label,
}: {
  children: React.ReactNode;
  onClose: () => void;
  label: string;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-carvao/95 p-4 backdrop-blur-md animate-in fade-in duration-300 md:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={label}
        className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-areia/30 bg-carvao/50 text-areia transition-colors hover:border-cobre hover:text-cobre md:right-8 md:top-8"
      >
        <X className="h-5 w-5" />
      </button>
      {children}
    </div>
  );
}
