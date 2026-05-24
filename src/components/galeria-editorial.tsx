import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GaleriaEditorialProps {
  fotos: string[];
  alt?: string;
  /** Limite máximo de imagens a exibir (curadoria). Default 8. */
  max?: number;
}

/**
 * Galeria editorial enxuta — máx ~8 imagens, ritmo cinematográfico:
 *   1) full-bleed
 *   2) split 60/40
 *   3) retrato grande + paisagem
 *   4) full-bleed final
 *
 * Sem grid empilhado. Muito respiro. Hover sutil. Lightbox elegante.
 */
export function GaleriaEditorial({ fotos, alt = "", max = 8 }: GaleriaEditorialProps) {
  const curated = fotos.slice(0, max);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const open = useCallback((i: number) => setOpenIdx(i), []);
  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i - 1 + curated.length) % curated.length)),
    [curated.length],
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % curated.length)),
    [curated.length],
  );

  useEffect(() => {
    if (openIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [openIdx, close, prev, next]);

  if (!curated.length) return null;

  const f = (i: number) => curated[i];

  return (
    <>
      <div className="space-y-10 md:space-y-16">
        {/* 1) full-bleed cinemática */}
        {f(0) && (
          <Tile
            src={f(0)}
            alt={alt}
            onClick={() => open(0)}
            className="aspect-[16/9] md:aspect-[21/9]"
            priority
          />
        )}

        {/* 2) split 60/40 */}
        {f(1) && f(2) && (
          <div className="grid gap-6 md:grid-cols-12 md:gap-10">
            <Tile
              src={f(1)}
              alt={alt}
              onClick={() => open(1)}
              className="md:col-span-7 aspect-[4/3]"
            />
            <Tile
              src={f(2)}
              alt={alt}
              onClick={() => open(2)}
              className="md:col-span-5 aspect-[4/5]"
            />
          </div>
        )}

        {/* 3) retrato grande + paisagem (invertido) */}
        {f(3) && f(4) && (
          <div className="grid gap-6 md:grid-cols-12 md:gap-10">
            <Tile
              src={f(3)}
              alt={alt}
              onClick={() => open(3)}
              className="md:col-span-5 md:order-1 aspect-[4/5]"
            />
            <Tile
              src={f(4)}
              alt={alt}
              onClick={() => open(4)}
              className="md:col-span-7 md:order-2 aspect-[4/3]"
            />
          </div>
        )}

        {/* 4) trio editorial opcional */}
        {f(5) && f(6) && (
          <div className="grid gap-6 md:grid-cols-2 md:gap-10">
            <Tile src={f(5)} alt={alt} onClick={() => open(5)} className="aspect-[3/2]" />
            <Tile src={f(6)} alt={alt} onClick={() => open(6)} className="aspect-[3/2]" />
          </div>
        )}

        {/* 5) full-bleed final */}
        {f(7) && (
          <Tile
            src={f(7)}
            alt={alt}
            onClick={() => open(7)}
            className="aspect-[16/9] md:aspect-[21/9]"
          />
        )}
      </div>

      {openIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-carvao/95 backdrop-blur-md"
          onClick={close}
          role="dialog"
          aria-modal
        >
          <button
            onClick={(e) => { e.stopPropagation(); close(); }}
            aria-label="Fechar"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20 md:left-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Próxima"
            className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20 md:right-8"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <img
            src={curated[openIdx]}
            alt={alt}
            className="max-h-[90vh] max-w-[92vw] object-contain shadow-card"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-areia/70">
            {openIdx + 1} / {curated.length}
          </div>
        </div>
      )}
    </>
  );
}

function Tile({
  src,
  alt,
  onClick,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  onClick: () => void;
  className: string;
  priority?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative block w-full overflow-hidden bg-carvao/10 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover transition-opacity duration-700 group-hover:opacity-90"
      />
    </button>
  );
}
