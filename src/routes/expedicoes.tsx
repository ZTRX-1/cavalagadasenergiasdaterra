import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listExpedicoes, listProximasDatas } from "@/lib/expedicoes.functions";
import { ExpedicaoCard } from "@/components/expedicao-card";
import { formatDuracaoRange } from "@/lib/format";

const qo = queryOptions({ queryKey: ["expedicoes"], queryFn: () => listExpedicoes() });
const qoDatas = queryOptions({ queryKey: ["proximas-datas-all"], queryFn: () => listProximasDatas() });

export const Route = createFileRoute("/expedicoes")({
  head: () => ({
    meta: [
      { title: "Expedições a Cavalo pelo Brasil e Mundo | Cavalgadas Energias da Terra" },
      { name: "description", content: "Catálogo completo de expedições a cavalo: Serra da Canastra, Mantiqueira, Jericoacoara, Patagônia Gaúcha, Peru (Vale do Colca) e Caminho de Santiago. Roteiros autorais em pequenos grupos." },
      { property: "og:title", content: "Expedições a Cavalo | Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Roteiros autorais a cavalo pelo Brasil e pelo Mundo, em pequenos grupos com direção editorial premium." },
      { property: "og:url", content: "https://cavalgadasenergiasdaterra.com.br/expedicoes" },
    ],
    links: [{ rel: "canonical", href: "https://cavalgadasenergiasdaterra.com.br/expedicoes" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(qo),
      context.queryClient.ensureQueryData(qoDatas),
    ]),
  component: ExpedicoesPage,
});

function ExpedicoesPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isCatalogRoute = pathname.replace(/\/+$/, "") === "/expedicoes";

  if (!isCatalogRoute) return <Outlet />;

  return <ExpedicoesCatalog />;
}

function ExpedicoesCatalog() {
  const { t } = useTranslation();
  const { data: expedicoes } = useSuspenseQuery(qo);
  const { data: datas } = useSuspenseQuery(qoDatas);

  // Agrupa as datas publicadas por expedição para exibir a duração real
  // (dias/noites) de cada saída — inclusive quando há mais de uma duração.
  const infoPorSlug = new Map<string, { duracoes: string[]; total: number }>();
  for (const d of datas ?? []) {
    const slug = d.expedicao_slug;
    if (!slug) continue;
    const entry = infoPorSlug.get(slug) ?? { duracoes: [], total: 0 };
    const label = formatDuracaoRange(d.data_inicio, d.data_fim);
    if (label && !entry.duracoes.includes(label)) entry.duracoes.push(label);
    entry.total += 1;
    infoPorSlug.set(slug, entry);
  }

  return (
    <div className="bg-background pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="container-tight">
        <div className="max-w-3xl">
          <div className="eyebrow">{t("expedicoes.catalogoEyebrow")}</div>
          <h1 className="mt-4 font-display text-[2.2rem] xs:text-5xl text-balance leading-tight md:text-7xl">{t("expedicoes.catalogoTitle")}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            {t("expedicoes.catalogoIntro")}
          </p>
        </div>
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {expedicoes.map((e) => <ExpedicaoCard key={e.id} expedicao={e} />)}
        </div>
      </div>
    </div>
  );
}
