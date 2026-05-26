import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { DataExpedicao } from "@/lib/expedicoes.functions";
import { getPublicExpedicaoSlug } from "@/lib/expedicao-slugs";
import { formatDateRange, formatDayShort, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  disponivel: "Disponível",
  poucas_vagas: "Poucas vagas",
  esgotado: "Esgotado",
};

const STATUS_CLASS: Record<string, string> = {
  disponivel: "bg-floresta/10 text-floresta border-floresta/30",
  poucas_vagas: "bg-cobre/15 text-cobre border-cobre/40",
  esgotado: "bg-muted text-muted-foreground border-border",
};

export function DataCard({ data }: { data: DataExpedicao }) {
  const inicio = formatDayShort(data.data_inicio);
  const isEsgotado = data.status === "esgotado";
  const publicSlug = getPublicExpedicaoSlug(data.expedicao_slug ?? "");

  return (
    <div className="group relative flex flex-col gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-cobre/50 md:flex-row md:items-center md:gap-8 md:p-6">
      <div className="flex items-center gap-5 md:w-48">
        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-sm border border-cobre/30 bg-floresta-deep text-areia md:h-20 md:w-20">
          <span className="font-display text-2xl leading-none md:text-3xl">{inicio.day}</span>
          <span className="mt-1 font-eyebrow text-[0.6rem] tracking-[0.22em] text-cobre-soft">{inicio.month}</span>
        </div>
        <div className="md:hidden">
          <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-cobre">{data.expedicao_nome}</div>
          <div className="mt-1 font-display text-lg leading-tight text-foreground">{formatDateRange(data.data_inicio, data.data_fim)}</div>
        </div>
      </div>

      <div className="hidden md:block md:flex-1">
        <div className="font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-cobre">{data.expedicao_nome}</div>
        <div className="mt-1.5 font-display text-xl text-foreground">{formatDateRange(data.data_inicio, data.data_fim)}</div>
        {(data.preco_pix || data.preco_cartao) && (
          <div className="mt-2 text-xs text-foreground/70">
            {data.preco_pix && <span><strong className="text-cobre">{formatPrice(data.preco_pix)}</strong> à vista (PIX)</span>}
            {data.preco_pix && data.preco_cartao && <span className="mx-2 text-muted-foreground">·</span>}
            {data.preco_cartao && <span>{formatPrice(data.preco_cartao)} no cartão</span>}
          </div>
        )}
      </div>


      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:gap-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {data.tag && (
            <span className="inline-flex items-center rounded-full border border-cobre/50 bg-cobre/10 px-3 py-1 text-[0.7rem] uppercase tracking-widest text-cobre">
              {data.tag}
            </span>
          )}
          {data.status !== "disponivel" && (
            <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-[0.7rem] uppercase tracking-widest", STATUS_CLASS[data.status])}>
              {STATUS_LABEL[data.status] ?? data.status}
            </span>
          )}
        </div>
        {!isEsgotado && (
          <Link
            to="/expedicoes/$slug"
            params={{ slug: publicSlug }}
            className="inline-flex items-center gap-2 rounded-full bg-floresta-deep px-4 py-2 text-xs uppercase tracking-widest text-areia transition-colors hover:bg-cobre"
          >
            Ver expedição <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
