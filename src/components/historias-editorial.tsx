import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import man01 from "@/assets/fotos/mantiqueira/01.jpg";
import can37 from "@/assets/fotos/canastra/37.jpg";
import man27 from "@/assets/fotos/mantiqueira/27.jpg";

const RELATOS = [
  {
    nome: "Fernanda M.",
    local: "São Paulo",
    expedicao: "Travessia da Canastra",
    texto:
      "Foi como sair do tempo. A cada amanhecer eu sentia que estava sendo devolvida a alguma coisa muito antiga em mim. Cada detalhe foi pensado, da seleção dos cavalos ao silêncio à fogueira.",
    foto: can37,
  },
  {
    nome: "Ricardo A.",
    local: "Rio de Janeiro",
    expedicao: "Mantiqueira Refúgio",
    texto:
      "Já fiz cavalgadas em vários países. Esta foi a mais bem produzida que vivi no Brasil. Não é luxo de vitrine. É luxo de cuidado, de presença, de quem entende o que está fazendo.",
    foto: man01,
  },
  {
    nome: "Juliana & Pedro",
    local: "Belo Horizonte",
    expedicao: "Berço do Marchador",
    texto:
      "Saímos transformados. A hospedagem, a comida, a condução, a manada. Tudo num nível raro de inteireza. Já estamos planejando a próxima travessia.",
    foto: man27,
  },
];

export function HistoriasEditorial() {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  // auto-rotação suave
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % RELATOS.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, []);

  const relato = RELATOS[active];

  return (
    <section className="relative overflow-hidden bg-carvao py-28 text-areia md:py-40">
      {/* textura sutil */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden>
        <div className="h-full w-full bg-gradient-to-br from-cobre/30 via-transparent to-transparent" />
      </div>

      <div className="container-tight relative">
        <div className="max-w-2xl">
          <div className="eyebrow text-cobre-soft">{t("historias.eyebrow")}</div>
          <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl lg:text-6xl">
            {t("historias.title")}
          </h2>
          <p className="mt-5 max-w-xl text-areia/65 text-pretty">
            {t("historias.intro")}
          </p>
        </div>

        <div className="mt-16 grid gap-12 md:mt-20 md:grid-cols-12 md:gap-16">
          {/* retrato */}
          <div className="md:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden bg-carvao/40">
              {RELATOS.map((r, i) => (
                <img
                  key={r.foto}
                  src={r.foto}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-carvao/80 to-transparent" />
              <div className="absolute bottom-5 left-5 font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/75">
                {relato.expedicao}
              </div>
            </div>
          </div>

          {/* relato */}
          <div ref={trackRef} className="md:col-span-7 flex flex-col justify-center">
            <blockquote
              key={active}
              className="font-display text-2xl italic leading-[1.35] text-balance text-areia md:text-3xl lg:text-[2.4rem] animate-in fade-in duration-700"
            >
              &ldquo;{relato.texto}&rdquo;
            </blockquote>
            <div className="mt-10 flex items-center gap-6">
              <div>
                <div className="font-display text-lg text-cobre-soft">{relato.nome}</div>
                <div className="text-sm text-areia/55">{relato.local}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {RELATOS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ver relato ${i + 1}`}
                    onClick={() => setActive(i)}
                    className={`h-px w-12 transition-all duration-500 ${
                      i === active ? "bg-cobre" : "bg-areia/20 hover:bg-areia/40"
                    } ${i === active ? "h-[2px]" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
