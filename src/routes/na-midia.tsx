import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { NaMidia } from "@/components/na-midia";
import heroImg from "@/assets/fotos/mantiqueira/05.jpg";

export const Route = createFileRoute("/na-midia")({
  head: () => ({
    meta: [
      { title: "Na Mídia · Cavalgadas Energias da Terra" },
      {
        name: "description",
        content:
          "Reportagens, editoriais e entrevistas sobre a Cavalgadas Energias da Terra — Globo, Revista Horse, BSC Portugal e outros reconhecimentos institucionais.",
      },
      { property: "og:title", content: "Na Mídia · Cavalgadas Energias da Terra" },
      {
        property: "og:description",
        content: "Reconhecimento institucional, editoriais e cobertura premium da marca.",
      },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
  }),
  component: NaMidiaPage,
});

function NaMidiaPage() {
  return (
    <main className="bg-areia-warm">
      {/* Editorial hero */}
      <section className="relative overflow-hidden bg-carvao text-areia">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt=""
            className="h-full w-full object-cover object-[50%_40%] opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-carvao/55 via-carvao/45 to-carvao" />
        </div>

        <div className="container-tight relative pt-44 pb-28 md:pt-52 md:pb-36">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 font-eyebrow text-[0.62rem] uppercase tracking-[0.34em] text-cobre-soft">
              <span className="h-px w-10 bg-cobre/60" />
              Press & Editorial
            </div>
            <h1 className="mt-7 font-display text-5xl text-balance leading-[1.02] md:text-6xl lg:text-7xl">
              A marca que ganhou repercussão — porque vive o que conta.
            </h1>
            <p className="mt-8 max-w-2xl text-pretty text-[1.05rem] leading-relaxed text-areia/80">
              Globo, Revista Horse, BSC Portugal e outras publicações acompanharam de perto as
              expedições, as fundadoras e a filosofia da Energias da Terra. Reunimos aqui as
              matérias, vídeos e editoriais — para ler dentro do próprio site.
            </p>
          </div>
        </div>
      </section>

      {/* Full grid of media items */}
      <NaMidia
        variant="full"
        eyebrow="Reconhecimento institucional"
        title="Reportagens, editoriais e entrevistas."
      />

      {/* Closing CTA */}
      <section className="bg-carvao py-24 text-areia md:py-32">
        <div className="container-tight text-center">
          <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-cobre-soft">
            Imprensa & parcerias
          </div>
          <h2 className="mt-5 font-display text-3xl text-balance md:text-4xl">
            Pautas, entrevistas e visitas guiadas para a imprensa.
          </h2>
          <div className="mt-10 flex justify-center">
            <Link
              to="/contato"
              className="group inline-flex items-center gap-3 rounded-full bg-cobre px-8 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.24em] text-areia transition-colors hover:bg-couro"
            >
              Falar com a comunicação
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
