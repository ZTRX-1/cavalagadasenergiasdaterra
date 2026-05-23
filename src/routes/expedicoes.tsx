import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listExpedicoes } from "@/lib/expedicoes.functions";
import { ExpedicaoCard } from "@/components/expedicao-card";

const qo = queryOptions({ queryKey: ["expedicoes"], queryFn: () => listExpedicoes() });

export const Route = createFileRoute("/expedicoes")({
  head: () => ({
    meta: [
      { title: "Expedições — Cavalgadas Energias da Terra" },
      { name: "description", content: "Conheça nossas expedições a cavalo: Vale da Canastra, Serra do Cipó, Chapada Diamantina e mais." },
      { property: "og:title", content: "Expedições — Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Roteiros cinematográficos a cavalo pelo Brasil." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(qo),
  component: ExpedicoesPage,
});

function ExpedicoesPage() {
  const { data: expedicoes } = useSuspenseQuery(qo);
  return (
    <div className="bg-background pb-24 pt-32 md:pb-32 md:pt-40">
      <div className="container-tight">
        <div className="max-w-3xl">
          <div className="eyebrow">Catálogo</div>
          <h1 className="mt-4 font-display text-5xl text-balance md:text-7xl">Expedições</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
            Cada expedição é um roteiro autoral, com curadoria de trilhas, hospedagens e gastronomia. Escolha a sua próxima travessia.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {expedicoes.map((e) => <ExpedicaoCard key={e.id} expedicao={e} />)}
        </div>
      </div>
    </div>
  );
}
