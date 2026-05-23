import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

interface Props {
  youtubeId: string;
  poster: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * Bloco cinematográfico premium para o vídeo da marca.
 * Desktop e mobile: poster estático elegante + botão play.
 * Ao clicar: abre modal fullscreen com iframe do YouTube (autoplay + som).
 */
export function VideoCinematic({ youtubeId, poster, eyebrow, title, subtitle }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Assistir vídeo"
        className="group relative block w-full overflow-hidden rounded-sm text-left text-areia shadow-elegant"
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden md:aspect-[21/9]">
          <img
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
          />
          {/* Overlay cinematográfico */}
          <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/40 to-carvao/30" />
          <div className="absolute inset-0 bg-carvao/15 transition-colors duration-500 group-hover:bg-carvao/5" />

          {/* Texto opcional */}
          {(eyebrow || title || subtitle) && (
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
              {eyebrow && (
                <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre-soft">
                  {eyebrow}
                </div>
              )}
              {title && (
                <h3 className="mt-3 max-w-2xl font-display text-3xl text-balance md:text-5xl">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-3 max-w-xl text-sm text-areia/85 md:text-base">{subtitle}</p>
              )}
            </div>
          )}

          {/* Play button */}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-areia/10 backdrop-blur-md ring-1 ring-areia/40 transition-all duration-500 group-hover:bg-cobre group-hover:ring-cobre md:h-24 md:w-24">
              <span className="absolute inset-0 animate-ping rounded-full bg-areia/10 opacity-60" />
              <Play className="relative ml-1 h-7 w-7 fill-areia text-areia md:h-8 md:w-8" />
            </span>
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-carvao/95 p-4 backdrop-blur-md md:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar vídeo"
            className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-areia/30 bg-carvao/50 text-areia transition-colors hover:border-cobre hover:text-cobre md:right-8 md:top-8"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative aspect-video w-full max-w-6xl overflow-hidden rounded-sm shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Vídeo Cavalgadas Energias da Terra"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}
    </>
  );
}
