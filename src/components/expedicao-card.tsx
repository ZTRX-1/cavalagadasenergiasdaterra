import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Expedicao } from "@/lib/expedicoes.functions";
import { getExpedicaoImage } from "@/lib/expedicao-images";
import { getPublicExpedicaoSlug } from "@/lib/expedicao-slugs";
import { formatPriceWithBRL } from "@/lib/format";

export function ExpedicaoCard({ expedicao }: { expedicao: Expedicao }) {
  const { t } = useTranslation();
  const isElas = expedicao.marca === "elas-na-sela";
  const slug = expedicao.slug;

  // Per-expedição translations (fallback to DB/static Portuguese content)
  const nome = t(`expedicoes.cards.${slug}.nome`, { defaultValue: expedicao.nome });
  const regiao = expedicao.regiao
    ? t(`expedicoes.cards.${slug}.regiao`, { defaultValue: expedicao.regiao })
    : null;
  const descricao = t(`expedicoes.cards.${slug}.descricao`, {
    defaultValue: expedicao.descricao_curta,
  });
  const duracao = t(`expedicoes.cards.${slug}.duracao`, { defaultValue: expedicao.duracao });
  const nivel = t(`expedicoes.cards.${slug}.nivel`, { defaultValue: expedicao.nivel });

  return (
    <Link
      to="/expedicoes/$slug"
      params={{ slug: getPublicExpedicaoSlug(slug) }}
      className="group relative block overflow-hidden rounded-sm bg-card shadow-card"
      aria-label={`${nome} — ${regiao ?? ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={getExpedicaoImage(slug)}
          alt={nome}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />

        {/* Overlay sofisticado em camadas: garante leitura em qualquer foto sem virar bloco escuro */}
        <div className="pointer-events-none absolute inset-0 bg-carvao/15" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-carvao/55 via-carvao/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[82%] bg-[linear-gradient(to_top,rgba(20,18,15,0.94)_0%,rgba(20,18,15,0.78)_28%,rgba(20,18,15,0.42)_58%,transparent_100%)]" />

        {isElas && (
          <span className="absolute right-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-areia/30 bg-carvao/40 px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.26em] text-areia/95 backdrop-blur-md shadow-[0_2px_10px_rgb(0_0_0/0.28)]">
            <span className="h-[3px] w-[3px] rounded-full bg-cobre-soft" />
            {t("expedicoes.badgeElas", "Exclusiva para mulheres")}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 flex flex-col p-7 md:p-8 text-areia [text-shadow:0_1px_4px_rgb(0_0_0/0.55)]">
          {regiao && (
            <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.3em] text-cobre-soft font-medium">
              {regiao}
            </div>
          )}
          <h3 className="mt-2.5 font-display text-2xl md:text-[1.7rem] lg:text-[1.85rem] text-balance leading-[1.08] text-areia">
            {nome}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-areia/90 line-clamp-2 text-pretty">
            {descricao}
          </p>
          <div className="mt-4 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.24em] text-areia/75">
            <span>{duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{nivel}</span>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[0.62rem] uppercase tracking-[0.24em] text-areia/65">
                {t("expedicoes.cardAPartirDe", "A partir de · acomodação dupla")}
              </div>
              <div className="mt-1 font-display text-xl text-cobre-soft">
                {formatPriceWithBRL(expedicao.preco, expedicao.moeda)}
              </div>
            </div>
            <span className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-full border border-areia/40 text-areia transition-all group-hover:bg-cobre group-hover:border-cobre">
              <span className="sr-only">{t("expedicoes.abrirExperiencia", "Abrir experiência")} {nome}</span>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
