import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type Short = {
  id: string;
  nome: string;
  legenda: string;
  capitulo: string;
  src?: string;
};

const SHORTS: Short[] = [
  {
    id: "depoimento-local-1",
    nome: "Energias da Terra",
    legenda: "Quando o cavalo nos devolve ao essencial.",
    capitulo: "Capítulo I",
    src: "/depoimentos/depoimento-1.mp4",
  },
  {
    id: "zTldVJWyVR8",
    nome: "Refúgio da Mantiqueira",
    legenda: "O cavalo, o silêncio, o tempo certo.",
    capitulo: "Capítulo II",
  },
  {
    id: "z0dNP6dztEI",
    nome: "Elas na Sela",
    legenda: "Uma irmandade que só a estrada revela.",
    capitulo: "Capítulo III",
  },
];

export function DepoimentosShorts() {
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className="relative overflow-hidden bg-carvao py-28 text-areia md:py-40">
      {/* atmospheric layers */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.cobre/12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,theme(colors.couro/10),transparent_60%)]" />
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      <div className="container-tight relative">
        <div className="grid items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="font-eyebrow text-[0.68rem] uppercase tracking-[0.34em] text-cobre-soft">
              Depoimentos · Mini-documentários
            </div>
            <h2 className="mt-6 font-display text-4xl text-balance leading-[1.02] md:text-5xl lg:text-[3.75rem]">
              Histórias reais de quem atravessou conosco.
            </h2>
          </div>
          <div className="md:col-span-5">
            <div className="hidden h-px w-full bg-gradient-to-r from-transparent via-cobre/40 to-transparent md:block" />
            <p className="mt-6 max-w-md text-pretty text-[0.98rem] leading-relaxed text-areia/70">
              Três capítulos breves — filmados no calor do encontro. A voz, o vento, o passo. O que fica quando se desce do cavalo.
            </p>
          </div>
        </div>

        <div className="mt-20 grid gap-10 md:mt-24 md:grid-cols-3 md:gap-7 lg:gap-10">
          {SHORTS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpen(s.id)}
              aria-label={`Assistir mini-documentário — ${s.nome}`}
              className={`group relative block w-full text-left text-areia ${
                i === 1 ? "md:translate-y-10" : ""
              }`}
            >
              {/* chapter marker above frame */}
              <div className="mb-5 flex items-center gap-3 font-eyebrow text-[0.6rem] uppercase tracking-[0.34em] text-cobre-soft">
                <span className="h-px w-8 bg-cobre/50" />
                {s.capitulo}
              </div>

              {/* premium frame: thin gold border + inset shadow */}
              <div className="relative">
                <div className="pointer-events-none absolute -inset-[6px] border border-cobre/25 transition-colors duration-700 group-hover:border-cobre/55" />
                <div className="relative aspect-[9/16] overflow-hidden bg-carvao/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-areia/8">
                  {/* high-res thumb with graceful fallback */}
                  <img
                    src={`https://i.ytimg.com/vi/${s.id}/maxresdefault.jpg`}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.dataset.fallback) {
                        img.dataset.fallback = "1";
                        img.src = `https://i.ytimg.com/vi/${s.id}/sddefault.jpg`;
                      }
                    }}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full scale-[1.35] object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.42]"
                  />

                  {/* cinematic gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/35 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-carvao/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-carvao/15 transition-colors duration-500 group-hover:bg-carvao/0" />

                  {/* vignette ring */}
                  <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />

                  {/* film grain overlay */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                    }}
                  />

                  {/* corner ornaments */}
                  <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-areia/40 transition-colors group-hover:border-cobre-soft" />
                  <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-areia/40 transition-colors group-hover:border-cobre-soft" />
                  <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-areia/40 transition-colors group-hover:border-cobre-soft" />
                  <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-areia/40 transition-colors group-hover:border-cobre-soft" />

                  {/* refined play */}
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-areia/40 bg-carvao/35 backdrop-blur-md transition-all duration-500 group-hover:border-cobre group-hover:bg-cobre/90 md:h-24 md:w-24">
                      <span className="absolute inset-0 rounded-full bg-cobre/0 transition-colors duration-700 group-hover:bg-cobre/15" />
                      <span className="absolute -inset-2 rounded-full border border-areia/10 transition-all duration-700 group-hover:-inset-3 group-hover:border-cobre/40" />
                      <Play className="ml-1 h-7 w-7 fill-areia text-areia transition-transform duration-500 group-hover:scale-110 md:h-8 md:w-8" />
                    </span>
                  </span>

                  {/* caption */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
                      {s.nome}
                    </div>
                    <div className="mt-3 font-display text-[1.35rem] text-balance leading-[1.15] text-areia [text-shadow:0_1px_3px_rgb(0_0_0/0.55)] md:text-[1.55rem]">
                      {s.legenda}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-24 flex items-center justify-center gap-4 text-cobre-soft md:mt-28">
          <span className="h-px w-12 bg-cobre/40" />
          <span className="font-eyebrow text-[0.6rem] uppercase tracking-[0.34em]">
            Filmados no campo — sem roteiro
          </span>
          <span className="h-px w-12 bg-cobre/40" />
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-carvao/95 p-4 backdrop-blur-md animate-in fade-in duration-300 md:p-8"
        >
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Fechar depoimento"
            className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-areia/30 bg-carvao/50 text-areia transition-colors hover:border-cobre hover:text-cobre md:right-8 md:top-8"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative aspect-[9/16] h-[88vh] max-h-[860px] overflow-hidden rounded-sm shadow-elegant ring-1 ring-areia/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -inset-[6px] z-10 border border-cobre/30" />
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${open}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Depoimento"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}
    </section>
  );
}
