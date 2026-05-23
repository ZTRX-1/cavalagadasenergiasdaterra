import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import hero from "@/assets/hero-cavalgada.jpg";
import logo from "@/assets/logo-cavalgadas.jpg";
import { MarcaCrossNav } from "@/components/marca-cross-nav";


export const Route = createFileRoute("/marcas/cavalgadas")({
  head: () => ({
    meta: [
      { title: "Cavalgadas Energias da Terra — Expedições imersivas" },
      { name: "description", content: "A marca-mãe: expedições autorais a cavalo pelo Brasil e pelo mundo." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <>
      <section className="relative min-h-[78svh] overflow-hidden text-areia">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" decoding="async" />
        <div className="absolute inset-0 bg-carvao/65" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-carvao via-carvao/70 to-transparent" />
        <div className="container-tight relative flex min-h-[78svh] flex-col justify-end pb-20 pt-32 md:pb-24 md:pt-40">
          <Link to="/" className="absolute left-5 top-28 inline-flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.28em] text-areia/80 hover:text-cobre-soft md:left-8 md:top-32">
            <ArrowLeft className="h-3 w-3" /> Voltar para o início
          </Link>
          <img src={logo} alt="" loading="lazy" className="h-20 w-20 rounded-full ring-1 ring-cobre/40 object-cover" />
          <div className="eyebrow mt-6 text-cobre-soft">A marca-mãe</div>
          <h1 className="mt-3 font-display text-5xl text-balance md:text-7xl text-shadow-strong">
            Cavalgadas <em className="not-italic text-cobre-soft">Energias da Terra</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-areia text-shadow-soft text-pretty">
            Expedições imersivas a cavalo, conduzidas com curadoria, cuidado e profundo conhecimento do território.
            Brasil e mundo, em pequenos grupos, com a alma de quem cria seus próprios cavalos.
          </p>
        </div>

      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="eyebrow">Manifesto</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Uma forma antiga de prestar atenção ao mundo.</h2>
          </div>
          <div className="md:col-span-7 text-lg leading-relaxed text-foreground/85 space-y-5">
            <p>Cavalgar é mais lento que dirigir, mais íntimo que caminhar. É o ritmo certo para atravessar uma paisagem sem violá-la.</p>
            <p>Nossas expedições nascem de uma manada própria de Mangalarga Marchador, criada com tempo e afeto — não alugada, não improvisada.</p>
            <p>Cada roteiro é desenhado como um filme: fotografia, ritmo, hospedagem, gastronomia. Tudo cuidado para que você apenas chegue, monte, e se entregue à travessia.</p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20 md:py-24">
        <div className="container-tight text-center">
          <h2 className="font-display text-4xl text-balance md:text-5xl">Pronto para a próxima travessia?</h2>
          <Link to="/expedicoes" className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia hover:bg-cobre-soft">
            Ver expedições <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarcaCrossNav current="cavalgadas" />
    </>
  );
}

