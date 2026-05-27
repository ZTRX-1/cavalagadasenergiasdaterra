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
    <section className="relative overflow-hidden bg-carvao py-16 text-areia md:py-20">
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

      <div className="container-tight relative max-w-4xl">
        <div className="grid gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-4">
            <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">
              {eyebrow}
            </div>
            <div className="mt-4 h-px w-12 bg-cobre/60" />
            <p className="mt-4 max-w-xs text-pretty text-[0.85rem] leading-relaxed text-areia/60">
              Um relato enviado depois da travessia. Mantido inteiro, na voz de quem viveu.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="relative">
              <span
                aria-hidden
                className="absolute -left-2 -top-7 select-none font-display text-[5rem] leading-none text-cobre/30 md:-left-5 md:-top-9 md:text-[7rem]"
              >
                “
              </span>

              <blockquote className="relative font-display text-balance text-[1.1rem] leading-[1.35] text-areia md:text-[1.25rem] lg:text-[1.35rem]">
                <p className="whitespace-pre-line">{preview}</p>

                <div
                  className={`grid transition-all duration-700 ease-out ${
                    aberto ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
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
                    className="pointer-events-none mt-2 h-10 bg-gradient-to-b from-transparent to-carvao"
                  />
                )}
              </blockquote>

              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                className="mt-6 inline-flex items-center gap-3 font-eyebrow text-[0.65rem] uppercase tracking-[0.3em] text-cobre-soft transition-colors hover:text-areia"
              >
                <span className="h-px w-6 bg-cobre/60" />
                {aberto ? "Recolher relato" : "Continuar lendo"}
              </button>

              <div className="mt-7 flex items-center gap-3">
                <span aria-hidden className="h-px w-8 bg-cobre/60" />
                <div>
                  <div className="font-display text-[0.95rem] leading-tight text-areia">{autora}</div>
                  <div className="mt-1 font-eyebrow text-[0.6rem] uppercase tracking-[0.3em] text-cobre-soft">
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
