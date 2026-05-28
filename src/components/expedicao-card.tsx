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
  return (
    <Link
      to="/expedicoes/$slug"
      params={{ slug: getPublicExpedicaoSlug(expedicao.slug) }}
      className="group relative block overflow-hidden rounded-sm bg-card shadow-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={getExpedicaoImage(expedicao.slug)}
          alt={expedicao.nome}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        {/* Overlay forte: garante leitura absoluta sobre qualquer fotografia */}
        <div className="absolute inset-0 bg-carvao/20" />
        <div className="absolute inset-x-0 bottom-0 h-[78%] bg-gradient-to-t from-carvao via-carvao/85 to-transparent" />

        {isElas && (
          <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full border border-areia/25 bg-areia/10 px-2.5 py-1 text-[0.58rem] uppercase tracking-[0.26em] text-areia/90 backdrop-blur-md shadow-[0_1px_8px_rgb(0_0_0/0.18)]">
            <span className="h-[3px] w-[3px] rounded-full bg-cobre-soft" />
            {t("expedicoes.badgeElas", "Exclusiva para mulheres")}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-6 text-areia md:p-7 [text-shadow:0_1px_3px_rgb(0_0_0/0.55)]">
          {expedicao.regiao && (
            <div className="font-eyebrow text-[0.72rem] uppercase tracking-[0.28em] text-cobre-soft font-medium">
              {expedicao.regiao}
            </div>
          )}
          <h3 className="mt-2 font-display text-2xl md:text-[1.7rem] lg:text-3xl text-balance leading-[1.05] text-areia">
            {expedicao.nome}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-areia/90 line-clamp-2 text-pretty">
            {expedicao.descricao_curta}
          </p>
          <div className="mt-4 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em] text-areia/70">
            <span>{expedicao.duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{expedicao.nivel}</span>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-[0.62rem] uppercase tracking-[0.22em] text-areia/60">A partir de · acomodação dupla</div>
              <div className="font-display text-xl text-cobre-soft">{formatPriceWithBRL(expedicao.preco, expedicao.moeda)}</div>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-areia/40 text-areia transition-all group-hover:bg-cobre group-hover:border-cobre">
              <span className="sr-only">Abrir experiência {expedicao.nome}</span>
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
