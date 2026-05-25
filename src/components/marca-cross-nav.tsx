import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowLeft } from "lucide-react";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import logoCanastra from "@/assets/logo-canastra.jpg";
import logoElas from "@/assets/logo-elas-na-sela.jpg";

type MarcaKey = "cavalgadas" | "elas-na-sela" | "canastra-a-cavalo";

const MARCAS = {
  cavalgadas: { logo: logoCavalgadas, nome: "Cavalgadas Energias da Terra", tagline: "Expedições a cavalo pelo Brasil e pelo mundo.", to: "/marcas/cavalgadas" as const },
  "elas-na-sela": { logo: logoElas, nome: "Elas na Sela", tagline: "Expedições femininas autorais.", to: "/marcas/elas-na-sela" as const },
  "canastra-a-cavalo": { logo: logoCanastra, nome: "Canastra a Cavalo", tagline: "Expedições a cavalo pela Serra da Canastra.", to: "/marcas/canastra-a-cavalo" as const },
};

export function MarcaTopBar() {
  return (
    <div className="container-tight pt-24 md:pt-28">
      <Link
        to="/"
        className="inline-flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.28em] text-areia/80 hover:text-cobre-soft"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar para o início
      </Link>
    </div>
  );
}

export function MarcaCrossNav({ current }: { current: MarcaKey }) {
  const outras = (Object.keys(MARCAS) as MarcaKey[]).filter((k) => k !== current);
  return (
    <section className="bg-background py-20 md:py-24">
      <div className="container-tight">
        <div className="max-w-2xl">
          <div className="eyebrow">Descubra também</div>
          <h2 className="mt-3 font-display text-3xl text-balance md:text-4xl">
            Três caminhos. Uma mesma essência.
          </h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {outras.map((k) => {
            const m = MARCAS[k];
            return (
              <Link
                key={k}
                to={m.to}
                className="group flex items-center gap-5 rounded-sm border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-cobre"
              >
                <img src={m.logo} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-cobre/30" />
                <div className="flex-1">
                  <div className="font-display text-xl leading-tight">{m.nome}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{m.tagline}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-cobre transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link to="/expedicoes" className="inline-flex items-center gap-2 rounded-full bg-cobre px-7 py-3.5 text-xs uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft">
            Ver expedições <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-xs uppercase tracking-widest text-foreground hover:border-cobre hover:text-cobre">
            Voltar para o início
          </Link>
        </div>
      </div>
    </section>
  );
}
