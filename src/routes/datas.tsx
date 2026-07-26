import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listProximasDatas } from "@/lib/expedicoes.functions";
import { DataCard } from "@/components/data-card";
import { formatMonthYear } from "@/lib/format";

const qo = queryOptions({ queryKey: ["proximas-datas-all"], queryFn: () => listProximasDatas() });

export const Route = createFileRoute("/datas")({
  head: () => ({
    meta: [
      { title: "Próximas Datas de Cavalgadas 2026 e 2027 | Cavalgadas Energias da Terra" },
      { name: "description", content: "Calendário completo de expedições a cavalo 2026/2027: Canastra, Mantiqueira, Jericoacoara, Patagônia, Peru e Caminho de Santiago. Reserve sua vaga em pequenos grupos." },
      { property: "og:title", content: "Próximas Datas de Cavalgadas | Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Calendário oficial 2026/2027 de expedições a cavalo pelo Brasil e Mundo." },
      { property: "og:url", content: "https://cavalgadasenergiasdaterra.com.br/datas" },
    ],
    links: [{ rel: "canonical", href: "https://cavalgadasenergiasdaterra.com.br/datas" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: DatasPage,
});

function DatasPage() {
  const { t } = useTranslation();
  const { data } = useSuspenseQuery(qo);
  
  // Ordenação cronológica por data de início
  const sortedData = [...data].sort((a, b) => 
    new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );

  const grouped = sortedData.reduce<Record<string, typeof data>>((acc, d) => {
    const k = formatMonthYear(d.data_inicio);
    (acc[k] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="bg-background pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="container-tight">
        <div className="max-w-3xl">
          <div className="eyebrow">{t("datas.eyebrow")}</div>
          <h1 className="mt-4 font-display text-5xl text-balance md:text-7xl">{t("datas.title")}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty ">
            {t("datas.intro")}
          </p>
        </div>

        <div className="mt-16 space-y-16">
          {Object.entries(grouped).map(([mes, items]) => (
            <div key={mes}>
              <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
                <h2 className="font-display text-2xl capitalize md:text-3xl">{mes}</h2>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{items.length} {t("datas.expedicoesCount")}</span>
              </div>
              <div className="space-y-3">
                {items.map((d) => <DataCard key={d.id} data={d} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
