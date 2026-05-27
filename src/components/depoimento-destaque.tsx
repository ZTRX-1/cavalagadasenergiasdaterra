import { useState } from "react";

type Props = {
  eyebrow?: string;
  preview: string;
  resto: string;
  autora: string;
  cidade: string;
};

export function DepoimentoDestaque({ eyebrow = "Relato em destaque", preview, resto, autora, cidade }: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <section className="relative overflow-hidden bg-carvao py-28 text-areia md:py-36">
      {/* atmospheric texture */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,theme(colors.cobre/15),transparent_60%)]" />
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
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.34em] text-cobre-soft">
              {eyebrow}
            </div>
            <div className="mt-6 h-px w-16 bg-cobre/60" />
            <p className="mt-6 max-w-xs text-pretty text-[0.95rem] leading-relaxed text-areia/60">
              Um relato enviado depois da travessia. Mantido inteiro, na voz de quem viveu.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -left-3 -top-12 select-none font-display text-[8rem] leading-none text-cobre/30 md:-left-8 md:-top-16 md:text-[12rem]"
              >
                “
              </span>

              <blockquote className="relative font-display text-balance text-[1.55rem] leading-[1.22] text-areia md:text-[2rem] lg:text-[2.3rem]">
                <p className="whitespace-pre-line">{preview}</p>

                <div
                  className={`grid transition-all duration-700 ease-out ${
                    aberto ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                  aria-hidden={!aberto}
                >
                  <div className="overflow-hidden">
                    <p className="whitespace-pre-line">{resto}</p>
                  </div>
                </div>

                {!aberto && (
                  <div
                    aria-hidden
                    className="pointer-events-none mt-2 h-16 bg-gradient-to-b from-transparent to-carvao"
                  />
                )}
              </blockquote>

              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="mt-8 inline-flex items-center gap-3 font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre-soft transition-colors hover:text-areia"
              >
                <span className="h-px w-8 bg-cobre/60 transition-all group-hover:w-12" />
                {aberto ? "Recolher relato" : "Continuar lendo"}
              </button>

              <div className="mt-10 flex items-center gap-4">
                <span aria-hidden className="h-px w-10 bg-cobre/60" />
                <div>
                  <div className="font-display text-[1.1rem] leading-tight text-areia">{autora}</div>
                  <div className="mt-1 font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-cobre-soft">
                    {cidade}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
