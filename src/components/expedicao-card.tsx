import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Expedicao } from "@/lib/expedicoes.functions";
import { getExpedicaoImage } from "@/lib/expedicao-images";
import { getPublicExpedicaoSlug } from "@/lib/expedicao-slugs";

export function ExpedicaoCard({ expedicao }: { expedicao: Expedicao }) {
  const { t } = useTranslation();
  const isElas = expedicao.marca === "elas-na-sela";
  const slug = expedicao.slug;

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
      aria-label={`${nome}${regiao ? ` — ${regiao}` : ""}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={getExpedicaoImage(slug, { capaUrl: expedicao.imagem_url })}
          alt={nome}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />

        <div className="pointer-events-none absolute inset-0 bg-carvao/15" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80%] bg-[linear-gradient(to_top,rgba(20,18,15,0.94)_0%,rgba(20,18,15,0.78)_30%,rgba(20,18,15,0.42)_60%,transparent_100%)]" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col p-4 sm:p-5 md:p-6 text-areia [text-shadow:0_1px_3px_rgb(0_0_0/0.55)]">
          {isElas && (
            <span className="mb-2.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-areia/25 bg-carvao/45 px-2.5 py-1 text-[0.55rem] uppercase tracking-[0.22em] text-areia/95 backdrop-blur-md">
              <span className="h-[3px] w-[3px] rounded-full bg-cobre-soft" />
              {t("expedicoes.badgeElas", "Exclusiva para mulheres")}
            </span>
          )}

          {regiao && (
            <div className="truncate font-eyebrow text-[0.62rem] sm:text-[0.65rem] uppercase tracking-[0.22em] text-cobre-soft font-medium">
              {regiao}
            </div>
          )}
          <h3 className="mt-1.5 font-display text-[1.35rem] sm:text-2xl lg:text-[1.7rem] text-balance leading-[1.1] text-areia">
            {nome}
          </h3>
          <p className="mt-2 hidden text-[0.82rem] leading-relaxed text-areia/90 line-clamp-2 text-pretty sm:block min-h-[2.5rem]">
            {descricao}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.58rem] sm:text-[0.62rem] uppercase tracking-[0.18em] text-areia/75 whitespace-nowrap">
            <span>{duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{nivel}</span>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[0.58rem] uppercase tracking-[0.2em] text-areia/65">
                {expedicao.mensagem_comercial_publica || t("expedicoes.cardAPartirDe", "Consulte disponibilidade")}
              </div>
            </div>
            <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 flex-none items-center justify-center rounded-full border border-areia/40 text-areia transition-all group-hover:bg-cobre group-hover:border-cobre">
              <span className="sr-only">{t("expedicoes.abrirExperiencia", "Abrir experiência")} {nome}</span>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
