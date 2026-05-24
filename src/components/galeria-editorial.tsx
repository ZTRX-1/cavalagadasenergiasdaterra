import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GaleriaEditorialProps {
  fotos: string[];
  alt?: string;
}

/**
 * Galeria editorial cinematográfica — layout assimétrico (bento + full-bleed),
 * lazy-loading, sem CLS (aspect-ratio fixo), lightbox sutil.
 *
 * Padrão de ritmo a cada 5 fotos:
 *   [grande à esq + 2 pequenas à dir]  →  [full-bleed cinemática]  →  [3 quadradas]
 */
export function GaleriaEditorial({ fotos, alt = "" }: GaleriaEditorialProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const open = useCallback((i: number) => setOpenIdx(i), []);
  const close = useCallback(() => setOpenIdx(null), []);
  const prev = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i - 1 + fotos.length) % fotos.length)),
    [fotos.length],
  );
  const next = useCallback(
    () => setOpenIdx((i) => (i === null ? null : (i + 1) % fotos.length)),
    [fotos.length],
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

  if (!fotos.length) return null;

  // dividir em blocos de 6: [hero+2] [full] [3]
  const blocos: { tipo: "split" | "full" | "trio"; fotos: { src: string; i: number }[] }[] = [];
  let i = 0;
  let turn = 0;
  while (i < fotos.length) {
    const slot = turn % 3;
    if (slot === 0) {
      const take = fotos.slice(i, i + 3).map((src, k) => ({ src, i: i + k }));
      blocos.push({ tipo: "split", fotos: take });
      i += take.length;
    } else if (slot === 1) {
      const take = fotos.slice(i, i + 1).map((src, k) => ({ src, i: i + k }));
      blocos.push({ tipo: "full", fotos: take });
      i += take.length;
    } else {
      const take = fotos.slice(i, i + 3).map((src, k) => ({ src, i: i + k }));
      blocos.push({ tipo: "trio", fotos: take });
      i += take.length;
    }
    turn += 1;
  }

  return (
    <>
      <div className="space-y-6 md:space-y-10">
        {blocos.map((b, bi) => {
          if (b.tipo === "split") {
            const [a, c, d] = b.fotos;
            return (
              <div key={bi} className="grid gap-3 md:grid-cols-12 md:gap-6">
                {a && (
                  <FotoTile
                    src={a.src}
                    alt={alt}
                    onClick={() => open(a.i)}
                    className="md:col-span-8 aspect-[4/5] md:aspect-[5/6]"
                    priority={bi === 0}
                  />
                )}
                <div className="grid gap-3 md:col-span-4 md:gap-6">
                  {c && (
                    <FotoTile
                      src={c.src}
                      alt={alt}
                      onClick={() => open(c.i)}
                      className="aspect-[4/3]"
                    />
                  )}
                  {d && (
                    <FotoTile
                      src={d.src}
                      alt={alt}
                      onClick={() => open(d.i)}
                      className="aspect-[4/3]"
                    />
                  )}
                </div>
              </div>
            );
          }
          if (b.tipo === "full") {
            const [a] = b.fotos;
            return a ? (
              <FotoTile
                key={bi}
                src={a.src}
                alt={alt}
                onClick={() => open(a.i)}
                className="aspect-[16/9] md:aspect-[21/9]"
              />
            ) : null;
          }
          // trio
          return (
            <div key={bi} className="grid gap-3 sm:grid-cols-3 md:gap-6">
              {b.fotos.map((f) => (
                <FotoTile
                  key={f.i}
                  src={f.src}
                  alt={alt}
                  onClick={() => open(f.i)}
                  className="aspect-square"
                />
              ))}
            </div>
          );
        })}
      </div>

      {openIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-carvao/95 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Fechar"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20 md:left-8"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Próxima"
            className="absolute right-3 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-areia/10 text-areia transition-colors hover:bg-areia/20 md:right-8"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <img
            src={fotos[openIdx]}
            alt={alt}
            className="max-h-[90vh] max-w-[92vw] object-contain shadow-card"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.28em] text-areia/70">
            {openIdx + 1} / {fotos.length}
          </div>
        </div>
      )}
    </>
  );
}

function FotoTile({
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
        className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-carvao/0 transition-colors duration-500 group-hover:bg-carvao/15" />
    </button>
  );
}
