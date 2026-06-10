import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, Heart, Mountain, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EditorialFrame } from "@/components/editorial-frame";
import { NaMidia } from "@/components/na-midia";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import ligia from "@/assets/founders/ligia-rio.jpg";
import alinne from "@/assets/founders/alinne-pantanal.jpg";
import heroPaisagem from "@/assets/fotos/mantiqueira/05.jpg";
import travessia from "@/assets/fotos/canastra/37.jpg";
import equipe from "@/assets/fotos/equipe/equipe-mangalarga.jpg";
import expedicaoMulheres from "@/assets/fotos/mantiqueira/15.jpg";
import natureza from "@/assets/fotos/mantiqueira/13.jpg";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem Somos · Cavalgadas Energias da Terra" },
      {
        name: "description",
        content:
          "A história, o propósito e as fundadoras da Cavalgadas Energias da Terra — expedições equestres boutique, cavalos próprios e hospitalidade autoral.",
      },
      { property: "og:title", content: "Quem Somos · Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Uma marca autoral de expedições equestres, criada por quem vive o cavalo de verdade." },
      { property: "og:image", content: heroPaisagem },
      { name: "twitter:image", content: heroPaisagem },
    ],
  }),
  component: QuemSomosPage,
});

const DIFERENCIAIS = [
  {
    icon: Mountain,
    title: "Criação própria de cavalos",
    desc: "Mangalarga Marchador criados no Refúgio & Haras Energias da Terra, com respeito ao ritmo e ao bem-estar animal.",
  },
  {
    icon: Sparkles,
    title: "Hospedagem com propósito",
    desc: "Pousadas, hotéis e acomodações locais escolhidas com intenção, sem excesso e sem ruído.",
  },
  {
    icon: Compass,
    title: "Expedições no Brasil e exterior",
    desc: "Expedições conduzidas com repertório, segurança e leitura cultural de cada território." ,
  },

  {
    icon: Heart,
    title: "Transformação real",
    desc: "A marca nasce de uma jornada pessoal e se sustenta no propósito de conectar pessoas, natureza e bem-estar.",
  },

];

function QuemSomosPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-carvao text-areia">
        <div className="relative h-[64svh] min-h-[520px] overflow-hidden md:h-[78svh] md:min-h-[640px]">
          <img
            src={heroPaisagem}
            alt="Amazona cruzando a paisagem da Mantiqueira"
            className="absolute inset-0 h-full w-full object-cover object-[58%_40%] md:object-[58%_36%] xl:object-[56%_34%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-carvao/40" />
          <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-carvao via-carvao/70 to-transparent" />
          <div className="absolute inset-y-0 left-0 w-full md:w-[62%] bg-gradient-to-r from-carvao/80 via-carvao/32 to-transparent" />
        </div>

        <div className="container-tight relative -mt-28 pb-18 md:-mt-36 md:pb-24">
          <div className="max-w-3xl">
            <div className="eyebrow text-cobre-soft">{t("quemSomos.eyebrow")}</div>
            <h1 className="mt-5 font-display text-4xl leading-[1.01] text-balance md:text-6xl lg:text-[4.5rem]">
              {t("quemSomos.heroTitleStart")} <em className="not-italic text-cobre-soft">{t("quemSomos.heroTitleEm")}</em>.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-areia/82 md:text-lg ">
              {t("quemSomos.heroIntro")}
            </p>

          </div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32 texture-paper">
        <div className="container-tight grid gap-14 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <div className="eyebrow">Nossa origem</div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
              Onde tudo começou.
            </h2>
            <div className="mt-8 space-y-6 text-[1.02rem] leading-relaxed text-foreground/82 ">
              <p className="text-pretty">
                A Cavalgadas Energias da Terra nasceu da paixão pelo universo equestre e da certeza de que algumas experiências só podem ser vividas no ritmo do cavalo.
              </p>
              <p className="text-pretty">
                Ao longo dos anos, transformamos essa paixão em expedições cuidadosamente planejadas, conectando pessoas, natureza, cultura e hospitalidade em destinos selecionados.
              </p>
              <p className="text-pretty">
                Mais do que percorrer caminhos, buscamos criar jornadas que deixem memórias, fortaleçam conexões e revelem a essência de cada lugar.
              </p>
            </div>

          </div>

          <div className="md:col-span-5">
            <EditorialFrame
              src={travessia}
              alt="Cavalos em travessia por paisagem natural"
              variant="organic"
              accent="floresta"
              side="right"
            />
          </div>
        </div>

        <div className="container-tight mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DIFERENCIAIS.map((item) => (
            <div key={item.title} className="border border-border/70 bg-background/70 p-6">
              <item.icon className="h-6 w-6 text-cobre" strokeWidth={1.5} />
              <div className="mt-4 font-display text-xl">{item.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/68 ">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-background py-10 md:py-16">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">As fundadoras</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">
              Duas trajetórias muito diferentes. Uma mesma verdade.
            </h2>
          </div>
        </div>
      </section>

      <section className="bg-background pb-24 md:pb-32">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <EditorialFrame
              src={ligia}
              alt="Lígia de Jesus Martins de Oliveira durante uma travessia a cavalo"
              variant="portrait"
              accent="cobre"
              side="left"
            />
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
              Lígia de Jesus Martins de Oliveira · Fundadora &amp; idealizadora
            </div>
            <h3 className="mt-4 font-display text-3xl leading-[1.04] text-balance md:text-5xl">
              O cavalo veio primeiro como cura. Depois, como destino.
            </h3>
            <div className="mt-8 space-y-7 text-[1rem] leading-relaxed text-foreground/84 ">
              <p className="text-pretty">
                Aos 38 anos, Lígia reúne duas dimensões que definem a marca: é cirurgiã-dentista formada há 17 anos
                e também a idealizadora do projeto Cavalgadas Energias da Terra. Sócia-proprietária das empresas do
                grupo, atua diretamente na criação de experiências ligadas ao turismo rural, hospitalidade,
                peregrinação e expedições equestres no Brasil e no exterior.
              </p>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Transformação pessoal</div>
                <p className="mt-3 text-pretty">
                  Sua jornada com os cavalos começou após superar a síndrome do pânico e a depressão. A convivência
                  com os animais tornou-se instrumento real de reconstrução interna, inspirando uma filosofia de vida
                  baseada em presença, natureza, bem-estar e desenvolvimento humano.
                </p>
              </div>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Formação equestre</div>
                <p className="mt-3 text-pretty">
                  Criadora de cavalos Mangalarga Marchador e associada à ABCCMM, possui formação em Doma Racional
                  Índia, rédeas, equitação clássica e adestramento. Seu trabalho parte do respeito, da comunicação e
                  da conexão com o animal — nunca de imposição ou espetáculo.
                </p>
              </div>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Direção das expedições</div>
                <p className="mt-3 text-pretty">
                  Lígia guia, desenha e conduz roteiros que integram cultura, gastronomia, patrimônio imaterial e
                  natureza profunda. É ela quem garante a escolha criteriosa dos cavalos, a segurança dos grupos e a
                  autenticidade de cada expedição.
                </p>

              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/35 py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:order-2 md:col-span-5">
            <EditorialFrame
              src={alinne}
              alt="Alinne Telloli Trassi Martins Bento montada a cavalo no Pantanal"
              variant="portrait"
              accent="floresta"
              side="right"
            />
          </div>
          <div className="md:order-1 md:col-span-7 flex flex-col justify-center">
            <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
              Alinne Telloli Trassi Martins Bento · Fundadora &amp; sócia
            </div>
            <h3 className="mt-4 font-display text-3xl leading-[1.04] text-balance md:text-5xl">
              A sensibilidade da marca só existe porque existe estrutura para sustentá-la.
            </h3>
            <div className="mt-8 space-y-7 text-[1rem] leading-relaxed text-foreground/84 ">
              <p className="text-pretty">
                Empresária e engenheira civil, Alinne é sócia-proprietária da Cavalgadas Energias da Terra, Elas na
                Sela, Canastra a Cavalo e do Refúgio &amp; Haras Energias da Terra. Atua na gestão de negócios voltados
                ao turismo rural, hospitalidade, criação de cavalos e experiências equestres exclusivas no Brasil e no exterior.
              </p>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Formação e repertório</div>
                <p className="mt-3 text-pretty">
                  Formada em Engenharia Civil pelo Instituto Mauá de Tecnologia, com pós-graduação em Administração
                  para Engenheiros pela Universidade Presbiteriana Mackenzie e especializações pela FGV e FIA,
                  construiu uma carreira sólida em Suprimentos, com atuação em grandes construtoras nas áreas de
                  gestão, negociações, planejamento e liderança.
                </p>
              </div>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Gestão que vira experiência</div>
                <p className="mt-3 text-pretty">
                  Essa bagagem corporativa foi essencial para estruturar e expandir os empreendimentos do grupo,
                  profissionalizando hospitalidade, operação, roteiros e crescimento da marca sem perder sua alma.
                </p>
              </div>
              <div>
                <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">Encontro com o universo equestre</div>
                <p className="mt-3 text-pretty">
                  Sua conexão com os cavalos nasceu por meio de Lígia e do impacto transformador que os animais
                  exercem na vida das pessoas. Desde então, passou a unir gestão e propósito para entregar vivências
                  autênticas, seguras, memoráveis e profundamente humanas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-floresta-deep py-24 text-areia md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="eyebrow text-cobre-soft">Estrutura própria</div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
              Haras, equipe e criação própria a serviço da experiência.
            </h2>
            <p className="mt-6 text-pretty text-areia/80 ">
              A autoridade da marca não vem só da estética. Vem da base: cavalo bem cuidado, equipe treinada,
              operação afinada e um território que é vivido por dentro.
            </p>
          </div>
          <div className="md:col-span-7">
            <EditorialFrame
              src={equipe}
              alt="Equipe da Energias da Terra reunida no haras"
              variant="landscape"
              accent="couro"
              side="right"
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="border border-areia/15 p-5">
                <div className="font-display text-xl text-cobre-soft">Criação</div>
                <p className="mt-2 text-sm leading-relaxed text-areia/72 ">Cavalos próprios preparados com método, descanso e respeito.</p>
              </div>
              <div className="border border-areia/15 p-5">
                <div className="font-display text-xl text-cobre-soft">Hospitalidade</div>
                <p className="mt-2 text-sm leading-relaxed text-areia/72 ">Refúgio, acolhimento e roteiro pensados como uma experiência completa.</p>
              </div>
              <div className="border border-areia/15 p-5">
                <div className="font-display text-xl text-cobre-soft">Condução</div>
                <p className="mt-2 text-sm leading-relaxed text-areia/72 ">Guias, parceiros e operação alinhados com segurança e sofisticação discreta.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-14 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <EditorialFrame
              src={expedicaoMulheres}
              alt="Amazonas em expedição por estrada cercada de árvores"
              variant="organic"
              accent="cobre"
              side="left"
            />
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="eyebrow">Expedições e propósito</div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
              Criamos experiências para quem quer voltar diferente.
            </h2>
            <div className="mt-8 space-y-6 text-[1.02rem] leading-relaxed text-foreground/80 ">
              <p className="text-pretty">
                As expedições da marca integram natureza, cultura, silêncio, gastronomia e relação autêntica com o
                cavalo. Seja no Brasil ou em destinos internacionais, o objetivo é o mesmo: tirar o corpo e a mente
                do automático e devolver sentido ao tempo vivido.
              </p>
              <p className="text-pretty">
                Da criação dos roteiros ao ritmo dos grupos, tudo é cuidadosamente planejado para preservar autenticidade, beleza e conexão.
              </p>
              <p className="text-pretty">
                Mais do que visitar destinos, proporcionamos jornadas que transformam a forma como as pessoas se relacionam com o tempo, a natureza e consigo mesmas.
              </p>
            </div>

          </div>
        </div>
      </section>

      <NaMidia variant="full" eyebrow="Reconhecimento" title="Quando a verdade da marca encontra repercussão." />

      <section className="relative overflow-hidden bg-carvao py-28 text-areia md:py-36">
        <img
          src={natureza}
          alt="Paisagem natural da Mantiqueira"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carvao/75 via-carvao/85 to-carvao" />
        <div className="container-tight relative text-center">
          <div className="eyebrow text-cobre-soft">{t("quemSomos.ctaEyebrow")}</div>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl text-balance md:text-6xl">
            {t("quemSomos.ctaTitle")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-areia/82 ">
            {t("quemSomos.ctaSubtitle")}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/expedicoes"
              className="inline-flex items-center gap-2 rounded-full bg-cobre px-7 py-4 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia hover:bg-cobre-soft"
            >
              Ver expedições <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={buildContactWhatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-areia/40 bg-carvao/30 px-7 py-4 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia hover:bg-areia/10"
            >
              Falar com a equipe
            </a>
          </div>
        </div>

      </section>
    </div>
  );
}
