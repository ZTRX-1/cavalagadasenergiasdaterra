import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Expedicao } from "@/lib/expedicoes.functions";
import { getExpedicaoImage } from "@/lib/expedicao-images";
import { formatPrice } from "@/lib/format";

export function ExpedicaoCard({ expedicao }: { expedicao: Expedicao }) {
  return (
    <Link
      to="/expedicoes/$slug"
      params={{ slug: expedicao.slug }}
      className="group relative block overflow-hidden rounded-sm bg-card shadow-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={getExpedicaoImage(expedicao.slug)}
          alt={expedicao.nome}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/70 to-carvao/10" />

        <div className="absolute inset-x-0 bottom-0 p-6 text-areia md:p-7 [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">
          {expedicao.regiao && (
            <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.28em] text-areia font-semibold">
              {expedicao.regiao}
            </div>
          )}
          <h3 className="mt-2 font-display text-2xl md:text-3xl text-balance leading-[1.05]">
            {expedicao.nome}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-areia/80 line-clamp-2 text-pretty">
            {expedicao.descricao_curta}
          </p>
          <div className="mt-4 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em] text-areia/70">
            <span>{expedicao.duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{expedicao.nivel}</span>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-[0.62rem] uppercase tracking-[0.22em] text-areia/60">A partir de</div>
              <div className="font-display text-xl text-cobre-soft">{formatPrice(expedicao.preco, expedicao.moeda)}</div>
            </div>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-areia/40 text-areia transition-all group-hover:bg-cobre group-hover:border-cobre">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
