import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import hero from "@/assets/fotos/mantiqueira/01.jpg";
import logo from "@/assets/logo-elas-na-sela.jpg";
import { MarcaCrossNav } from "@/components/marca-cross-nav";
import { GaleriaEditorial } from "@/components/galeria-editorial";
import { GALERIA_ELAS_NA_SELA } from "@/lib/expedicao-images";


export const Route = createFileRoute("/marcas/elas-na-sela")({
  head: () => ({
    meta: [
      { title: "Elas na Sela — Expedições femininas a cavalo" },
      { name: "description", content: "Travessias exclusivas para mulheres que exploram o mundo a cavalo." },
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
          <div className="eyebrow mt-6 text-cobre-soft">Para elas</div>
          <h1 className="mt-3 font-display text-5xl text-balance md:text-7xl text-shadow-strong">
            Elas na <em className="not-italic text-cobre-soft">Sela</em>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-areia text-shadow-soft text-pretty font-sans font-light">
            Expedições desenhadas por mulheres, para mulheres. Liberdade, irmandade e natureza no ritmo de quem quer atravessar a si mesma.
          </p>
        </div>

      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="eyebrow">O movimento</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Cavalgar em comunidade. Voltar inteira.</h2>
          </div>
          <div className="md:col-span-7 text-lg leading-relaxed text-foreground/85 space-y-5">
            <p>Elas na Sela nasceu da vontade de criar um espaço seguro, sofisticado e potente para mulheres viverem a cavalgada com profundidade.</p>
            <p>Grupos pequenos, guias experientes, hospedagens acolhedoras, e uma rede de irmandade que muitas vezes começa na trilha e segue para a vida.</p>
            <p>Para iniciantes ou amazonas experientes. O que importa é a vontade de atravessar.</p>
          </div>
        </div>
      </section>

      <section className="bg-background pb-24 md:pb-32">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">Galeria</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">Cenas de quem atravessou.</h2>
          </div>
          <div className="mt-12">
            <GaleriaEditorial fotos={GALERIA_ELAS_NA_SELA} alt="Elas na Sela" />
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20 md:py-24">
        <div className="container-tight text-center">
          <h2 className="font-display text-4xl text-balance md:text-5xl">Sua próxima expedição espera.</h2>
          <Link to="/expedicoes" className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia hover:bg-cobre-soft">
            Ver expedições <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <MarcaCrossNav current="elas-na-sela" />
    </>
  );
}

