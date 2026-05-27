import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CenaNarrativa {
  src: string;
  eyebrow: string;
  titulo: string;
}

interface Props {
  cenas: CenaNarrativa[];
  alt?: string;
}

/**
 * Carrossel editorial premium — slide central em destaque,
 * vizinhos atenuados, legenda cinematográfica, swipe nativo.
 */
export function CarrosselNarrativo({ cenas, alt = "" }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: true,
    skipSnaps: false,
    dragFree: false,
  });
  const [selected, setSelected] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    const onScroll = () => {
      const p = Math.max(0, Math.min(1, emblaApi.scrollProgress()));
      setScrollProgress(p);
    };
    onSelect();
    onScroll();
    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
    };
  }, [emblaApi]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") scrollPrev();
      if (e.key === "ArrowRight") scrollNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [scrollPrev, scrollNext]);

  if (!cenas.length) return null;

  const total = cenas.length;
  const atual = String(selected + 1).padStart(2, "0");
  const totalStr = String(total).padStart(2, "0");

  return (
    <section
      role="region"
      aria-roledescription="carousel"
      aria-label="Narrativa visual da expedição"
      className="relative"
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y -ml-4 md:-ml-8">
          {cenas.map((cena, i) => {
            const isActive = i === selected;
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${total} — ${cena.titulo}`}
                className="relative shrink-0 grow-0 basis-[88%] pl-4 md:basis-[64%] md:pl-8 lg:basis-[58%]"
              >
                <figure
                  className={cn(
                    "relative overflow-hidden rounded-sm shadow-elegant ring-1 ring-carvao/10 transition-all duration-700 ease-out",
                    isActive ? "opacity-100 scale-100" : "opacity-50 scale-[0.96]",
                  )}
                >
                  <div className="relative aspect-[4/5] md:aspect-[3/4]">
                    <img
                      src={cena.src}
                      alt={`${alt} — ${cena.titulo}`}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding={i === 0 ? "sync" : "async"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                    {/* grão sutil */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.07]"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
                        backgroundSize: "3px 3px",
                      }}
                    />
                    {/* gradiente para legibilidade da legenda */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-carvao/85 via-carvao/30 to-transparent"
                    />
                    {/* vinheta cinematográfica */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.22) 100%)",
                      }}
                    />
                    {/* legenda */}
                    <figcaption
                      className={cn(
                        "absolute inset-x-0 bottom-0 p-6 md:p-9 text-areia transition-opacity duration-500",
                        isActive ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/75 md:text-[0.65rem]">
                        {cena.eyebrow}
                      </div>
                      <div className="mt-2 font-display text-2xl leading-tight text-balance md:text-3xl">
                        {cena.titulo}
                      </div>
                    </figcaption>
                  </div>
                </figure>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controles */}
      <div className="container-tight mt-8 flex items-center justify-between gap-6 md:mt-10">
        <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-foreground/60">
          {atual} <span className="mx-1 text-foreground/30">/</span> {totalStr}
        </div>

        <div className="relative h-px flex-1 bg-foreground/15">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-cobre transition-[width] duration-300"
            style={{ width: `${((selected + 1) / total) * 100}%` }}
          />
          <span
            aria-hidden
            className="absolute -top-px h-[3px] w-12 bg-cobre/40 blur-sm"
            style={{ left: `calc(${scrollProgress * 100}% - 24px)` }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Cena anterior"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground/80 transition-colors hover:border-cobre hover:text-cobre"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Próxima cena"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground/80 transition-colors hover:border-cobre hover:text-cobre"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
