import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import hero from "@/assets/expedicao-canastra.jpg";
import logo from "@/assets/logo-canastra.jpg";
import { MarcaCrossNav } from "@/components/marca-cross-nav";
import { GaleriaEditorial } from "@/components/galeria-editorial";
import { GALERIA_CANASTRA_MARCA, FOTO_EQUIPE } from "@/lib/expedicao-images";


export const Route = createFileRoute("/marcas/canastra-a-cavalo")({
  head: () => ({
    meta: [
      { title: "Canastra a Cavalo · Expedições a cavalo pela Serra da Canastra" },
      { name: "description", content: "Expedições autorais pela Serra da Canastra, terra do queijo, do Mangalarga e das cabeceiras do São Francisco." },
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
          <div className="eyebrow mt-6 text-cobre-soft">Nosso território</div>
          <h1 className="mt-3 font-display text-5xl text-balance md:text-7xl text-shadow-strong">
            Canastra <em className="not-italic text-cobre-soft">a Cavalo</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-areia text-shadow-soft text-pretty font-sans font-light">
            Explore a Serra da Canastra a cavalo, por rotas cuidadosamente selecionadas.
          </p>
        </div>

      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="eyebrow">O território</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Nosso ponto de origem.</h2>
          </div>
          <div className="md:col-span-7 text-lg leading-relaxed text-foreground/85 space-y-5 font-sans font-light">
            <p>A Canastra é o nosso ponto de origem. Conhecemos cada trilha, cada paisagem, cada história que fazem desta região um dos destinos equestres mais especiais do Brasil.</p>
            <p>Trabalhamos ao lado de parceiros locais selecionados, que compartilham dos mesmos valores de cuidado, autenticidade e respeito à cultura da Serra da Canastra.</p>
          </div>
        </div>
      </section>

      <section className="bg-background pb-24 md:pb-32">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">Galeria</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">Imagens da Serra.</h2>
          </div>
          <div className="mt-12">
            <GaleriaEditorial fotos={GALERIA_CANASTRA_MARCA} alt="Canastra a Cavalo" />
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20 md:py-24">
        <div className="container-tight grid items-center gap-12 md:grid-cols-2">
          <img src={FOTO_EQUIPE} alt="Equipe Mangalarga Marchador" loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover shadow-card" />
          <div>
            <div className="eyebrow">Quem conduz</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">A equipe que vive a Canastra.</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/80 text-pretty">
              Amazonas, guias e amigos. Gente que nasceu aqui, monta há décadas e conhece o terreno como ninguém.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20 md:py-24">
        <div className="container-tight text-center">
          <h2 className="font-display text-4xl text-balance md:text-5xl">Atravesse a Canastra com quem mora nela.</h2>
          <Link to="/expedicoes/$slug" params={{ slug: "serra-da-canastra" }} className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia hover:bg-cobre-soft">
            Ver expedição <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarcaCrossNav current="canastra-a-cavalo" />
    </>
  );
}

