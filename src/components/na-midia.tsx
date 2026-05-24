import { useEffect, useState } from "react";
import { Play, ExternalLink, X } from "lucide-react";

interface Props {
  variant?: "compact" | "full";
  eyebrow?: string;
  title?: string;
}

const YT_ID = "lAsPBK_D7Mw";
const HORSE_URL =
  "https://revistahorse.com.br/liberdade-irmandade-e-a-forca-feminina-em-sintonia-com-o-cavalo-e-a-natureza/";
const BSC_URL =
  "https://www.bsc.com.vc/magazine/pdf/980b6fac-68ef-4845-9c20-bbff05d69bc7/flipbook";

/**
 * Bloco "Na Mídia" — wordmarks editoriais (sem logos oficiais)
 * abrindo modais premium.
 */
export function NaMidia({
  variant = "compact",
  eyebrow = "Reconhecidas pela mídia",
  title = "Histórias que ganharam o mundo.",
}: Props) {
  const [openVideo, setOpenVideo] = useState(false);
  const [openMag, setOpenMag] = useState(false);

  const padding = variant === "compact" ? "py-20 md:py-24" : "py-28 md:py-36";

  return (
    <section className={`relative bg-areia-warm ${padding}`}>
      <div className="container-tight">
        <div className="mx-auto max-w-2xl text-center">
          <div className="eyebrow">{eyebrow}</div>
          {variant === "full" && (
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{title}</h2>
          )}
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-0 border-y border-carvao/15 md:grid-cols-3 md:divide-x md:divide-carvao/15">
          <MediaItem
            wordmark="Globo"
            kicker="Reportagem · TV"
            description="Cavalgadas no Brasil"
            cta="Assistir"
            icon={<Play className="h-3.5 w-3.5" />}
            onClick={() => setOpenVideo(true)}
          />
          <MediaItem
            wordmark="Revista Horse"
            kicker="Editorial · Matéria"
            description="Liberdade, irmandade e força feminina"
            cta="Ler"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => window.open(HORSE_URL, "_blank", "noopener,noreferrer")}
          />
          <MediaItem
            wordmark="BSC Portugal"
            kicker="Revista · Flipbook"
            description="Boutique equestre internacional"
            cta="Abrir revista"
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            onClick={() => setOpenMag(true)}
          />
        </div>
      </div>

      {openVideo && (
        <PremiumOverlay onClose={() => setOpenVideo(false)} label="Fechar vídeo">
          <div
            className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-sm shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Reportagem Globo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </PremiumOverlay>
      )}

      {openMag && (
        <PremiumOverlay onClose={() => setOpenMag(false)} label="Fechar revista">
          <div
            className="relative w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between text-areia">
              <div>
                <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.3em] text-cobre-soft">
                  BSC Portugal · Magazine
                </div>
                <div className="mt-1 font-display text-xl md:text-2xl">
                  Boutique equestre internacional
                </div>
              </div>
              <a
                href={BSC_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-areia/30 px-4 py-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-areia transition-colors hover:border-cobre hover:text-cobre-soft"
              >
                Abrir em nova aba <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-carvao shadow-elegant">
              <iframe
                src={BSC_URL}
                title="Revista BSC Portugal"
                className="absolute inset-0 h-full w-full"
                referrerPolicy="no-referrer"
                allow="fullscreen"
              />
              {/* Fallback caso o site bloqueie iframe */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-carvao/80 via-transparent to-transparent p-6">
                <a
                  href={BSC_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-cobre px-6 py-3 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia hover:bg-cobre-soft"
                >
                  Caso não carregue, abrir aqui <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </PremiumOverlay>
      )}
    </section>
  );
}

function MediaItem({
  wordmark,
  kicker,
  description,
  cta,
  icon,
  onClick,
}: {
  wordmark: string;
  kicker: string;
  description: string;
  cta: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 px-6 py-12 text-center transition-colors hover:bg-areia/50"
    >
      <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre">
        {kicker}
      </div>
      <div className="font-display text-3xl tracking-tight text-carvao md:text-4xl">
        {wordmark}
      </div>
      <div className="text-xs text-foreground/65">{description}</div>
      <span className="mt-2 inline-flex items-center gap-2 font-eyebrow text-[0.62rem] uppercase tracking-[0.28em] text-carvao/70 transition-colors group-hover:text-cobre">
        {icon} {cta}
      </span>
    </button>
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
