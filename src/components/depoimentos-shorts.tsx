import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type Short = {
  id: string;
  nome: string;
  legenda: string;
};

const SHORTS: Short[] = [
  {
    id: "0ICoXcp_40Q",
    nome: "Travessia da Canastra",
    legenda: "Sobre atravessar e ser atravessada.",
  },
  {
    id: "zTldVJWyVR8",
    nome: "Refúgio da Mantiqueira",
    legenda: "O cavalo, o silêncio, o tempo certo.",
  },
  {
    id: "z0dNP6dztEI",
    nome: "Elas na Sela",
    legenda: "Uma irmandade que só a estrada revela.",
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
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]" aria-hidden>
        <div className="h-full w-full bg-gradient-to-br from-cobre/40 via-transparent to-transparent" />
      </div>

      <div className="container-tight relative">
        <div className="max-w-2xl">
          <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre-soft">
            Depoimentos · Voz de quem viveu
          </div>
          <h2 className="mt-5 font-display text-4xl text-balance leading-[1.05] md:text-5xl lg:text-6xl">
            Histórias reais de quem atravessou conosco.
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-areia/65">
            Mais do que viagens — experiências que permanecem. Três relatos em vídeo, gravados no calor do encontro.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3 md:gap-8 lg:gap-10">
          {SHORTS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpen(s.id)}
              aria-label={`Assistir depoimento — ${s.nome}`}
              className={`group relative block w-full text-left text-areia ${
                i === 1 ? "md:translate-y-8" : ""
              }`}
            >
              <div className="relative aspect-[9/16] overflow-hidden bg-carvao/60 shadow-elegant ring-1 ring-areia/10 transition-all duration-700 group-hover:ring-cobre/40">
                <img
                  src={`https://i.ytimg.com/vi/${s.id}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-[1.6] object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.7]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/30 to-carvao/10" />
                <div className="absolute inset-0 bg-carvao/20 transition-colors duration-500 group-hover:bg-carvao/5" />

                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-areia/10 backdrop-blur-md ring-1 ring-areia/40 transition-all duration-500 group-hover:bg-cobre group-hover:ring-cobre md:h-20 md:w-20">
                    <Play className="ml-1 h-6 w-6 fill-areia text-areia md:h-7 md:w-7" />
                  </span>
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
                  <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">
                    0{i + 1} · Depoimento
                  </div>
                  <div className="mt-2 font-display text-xl text-balance leading-tight md:text-2xl">
                    {s.legenda}
                  </div>
                  <div className="mt-2 text-xs text-areia/70">{s.nome}</div>
                </div>
              </div>
            </button>
          ))}
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
