import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Compass, Mountain, Sparkles } from "lucide-react";
import { EditorialFrame } from "@/components/editorial-frame";
import { NaMidia } from "@/components/na-midia";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import ligia from "@/assets/founders/ligia-rio.jpg";
import alinne from "@/assets/founders/alinne-pantanal.jpg";
import natureza from "@/assets/fotos/mantiqueira/13.jpg";
import travessia from "@/assets/fotos/canastra/37.jpg";

export const Route = createFileRoute("/quem-somos")({
  head: () => ({
    meta: [
      { title: "Quem Somos · Cavalgadas Energias da Terra" },
      {
        name: "description",
        content:
          "A história, o propósito e as fundadoras da Cavalgadas Energias da Terra — marca boutique de expedições equestres premium pelo Brasil e pelo mundo.",
      },
      { property: "og:title", content: "Quem Somos · Cavalgadas Energias da Terra" },
      {
        property: "og:description",
        content: "Boutique brasileira de expedições equestres premium.",
      },
      { property: "og:image", content: ligia },
      { name: "twitter:image", content: ligia },
    ],
  }),
  component: QuemSomosPage,
});

const DIFERENCIAIS = [
  {
    icon: Mountain,
    title: "Criação própria de cavalos",
    desc:
      "Mangalarga Marchador criados e treinados pela nossa equipe, em ciclos respeitosos de trabalho e descanso.",
  },
  {
    icon: Sparkles,
    title: "Curadoria boutique",
    desc:
      "Grupos íntimos, hospedagens com alma, gastronomia que conversa com o território.",
  },
  {
    icon: Compass,
    title: "Direção autoral",
    desc:
      "Cada expedição é desenhada como um filme: roteiro, ritmo e fotografia ao serviço da emoção.",
  },
  {
    icon: Heart,
    title: "Transformação real",
    desc:
      "Não é um passeio. É uma travessia que reorganiza o que você sabe sobre liberdade.",
  },
];

function QuemSomosPage() {
  return (
    <div className="bg-background">
      {/* HERO — faixa cinematográfica editorial */}
      <section className="relative h-[64svh] min-h-[480px] overflow-hidden text-areia md:h-[68svh] md:min-h-[560px]">
        <img
          src={ligia}
          alt="Lígia atravessando o rio a cavalo"
          className="absolute inset-0 h-full w-full object-cover object-[55%_25%] md:object-[60%_30%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-carvao/45" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-carvao via-carvao/70 to-transparent" />
        <div className="absolute inset-y-0 left-0 w-full md:w-2/3 bg-gradient-to-r from-carvao/70 via-carvao/20 to-transparent" />

        <div className="container-tight relative flex h-full flex-col justify-end pb-14 pt-28 md:pb-20 md:pt-32">
          <div className="max-w-3xl">
            <div className="eyebrow text-cobre-soft text-shadow-soft">
              Boutique equestrian expeditions
            </div>
            <h1 className="mt-5 font-display text-4xl leading-[1] text-balance text-shadow-strong md:text-6xl lg:text-[4.25rem]">
              Quem cuida da <em className="not-italic text-cobre-soft">travessia</em>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-areia/90 text-shadow-soft md:text-lg">
              Marca brasileira de expedições equestres boutique. Cavalos próprios, guias
              bilíngues, hospedagens curadas e direção autoral.
            </p>
          </div>
        </div>
      </section>

      {/* HISTÓRIA DA MARCA — editorial */}
      <section className="bg-background py-28 md:py-36 texture-paper">
        <div className="container-tight grid gap-14 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <div className="eyebrow">Nossa história</div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
              Nascemos da mata, do silêncio e da mão que conhece o cavalo.
            </h2>

            <div className="mt-10 space-y-6 text-[1.02rem] leading-relaxed text-foreground/85">
              <p className="text-pretty">
                <span className="float-left mr-3 mt-1 font-display text-6xl leading-[0.8] text-cobre">
                  E
                </span>
                xistimos para devolver às pessoas algo que o mundo apressou demais: o tempo de
                atravessar. Cada expedição da Cavalgadas Energias da Terra é desenhada como uma
                travessia interna — natureza profunda, cavalos preparados, hospedagens com alma,
                grupos íntimos.
              </p>
              <p className="text-pretty">
                Operamos sob três marcas — Cavalgadas Energias da Terra, Canastra a Cavalo e Elas
                na Sela — cada uma com um endereço emocional próprio, mas todas com a mesma
                essência: turismo equestre boutique, conexão real com a natureza e respeito
                inegociável ao bem-estar dos animais.
              </p>

              <blockquote className="relative border-l-2 border-cobre py-2 pl-6 font-display text-2xl italic text-foreground/90 md:text-3xl">
                "O cavalo não é meio de transporte. É o tempo certo das coisas."
              </blockquote>

              <p className="text-pretty">
                Criamos nossos próprios cavalos Mangalarga Marchador, num ciclo de trabalho e
                descanso que respeita o animal. Curamos cada hospedagem, cada refeição, cada
                parada. Limitamos vagas para preservar o silêncio. É assim que o luxo, para nós,
                acontece: na escolha do que <em>não</em> entra na expedição.
              </p>
            </div>
          </div>

          <div className="md:col-span-5">
            <EditorialFrame
              src={travessia}
              alt="Cavalos na travessia"
              variant="organic"
              accent="floresta"
              side="right"
            />
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="bg-floresta-deep py-28 text-areia md:py-32">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow text-cobre-soft">O que nos diferencia</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">
              Quatro princípios. Uma só assinatura.
            </h2>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {DIFERENCIAIS.map((d) => (
              <div key={d.title}>
                <d.icon className="h-7 w-7 text-cobre-soft" strokeWidth={1.4} />
                <div className="mt-5 font-display text-xl">{d.title}</div>
                <p className="mt-3 text-sm leading-relaxed text-areia/75">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDADORAS */}
      <section className="bg-background py-28 md:py-36">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">As fundadoras</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">
              Duas mulheres. Uma travessia compartilhada.
            </h2>
            <p className="mt-5 text-foreground/75 text-pretty">
              Lígia e Alinne lideram a Cavalgadas Energias da Terra com sensibilidade, técnica e
              propósito. Cada uma traz uma força distinta — juntas, formam o rosto e a estrutura
              de uma marca boutique brasileira que ganhou o mundo.
            </p>
          </div>

          {/* LÍGIA */}
          <div className="mt-20 grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <EditorialFrame
                src={ligia}
                alt="Lígia, fundadora"
                variant="portrait"
                accent="cobre"
                side="left"
              />
            </div>
            <div className="md:col-span-7 flex flex-col justify-center">
              <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
                Lígia · Fundadora & diretora criativa
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight text-balance md:text-5xl">
                A travessia começou nela.
              </h3>
              <div className="mt-7 space-y-5 text-[1rem] leading-relaxed text-foreground/85">
                <p className="text-pretty">
                  Lígia descobriu nos cavalos um caminho de cura. Foram eles que a reorganizaram
                  em momentos de dor, e foram eles que a apresentaram à sua vocação: criar
                  travessias capazes de transformar quem as vive.
                </p>
                <p className="text-pretty">
                  Sua sensibilidade dita o ritmo das expedições — o silêncio antes do amanhecer,
                  a parada na cachoeira, a fogueira que dura mais um pouco. É dela a direção
                  emocional da marca; a mão que traduz natureza, cavalo e tempo em experiência.
                </p>
                <p className="text-pretty italic text-foreground/70">
                  "Eu não conduzo cavalgadas. Eu cuido do que acontece dentro das pessoas
                  enquanto cavalgam."
                </p>
              </div>
            </div>
          </div>

          {/* ALINNE — invertido */}
          <div className="mt-24 grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:order-2 md:col-span-5">
              <EditorialFrame
                src={alinne}
                alt="Alinne, fundadora"
                variant="portrait"
                accent="floresta"
                side="right"
              />
            </div>
            <div className="md:order-1 md:col-span-7 flex flex-col justify-center">
              <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
                Alinne · Fundadora & diretora executiva
              </div>
              <h3 className="mt-4 font-display text-3xl leading-tight text-balance md:text-5xl">
                A estrutura que sustenta o sonho.
              </h3>
              <div className="mt-7 space-y-5 text-[1rem] leading-relaxed text-foreground/85">
                <p className="text-pretty">
                  Alinne é a arquitetura por trás da marca. Estratégia, gestão, expansão
                  internacional — é dela a leitura de mercado que permitiu à Cavalgadas Energias
                  da Terra se posicionar como uma marca boutique reconhecida fora do Brasil.
                </p>
                <p className="text-pretty">
                  Cuida das operações como cuida de um cavalo: com método, escuta e respeito.
                  Garante que cada expedição rode com a precisão que a experiência premium exige
                  — do transfer ao último brinde na fogueira.
                </p>
                <p className="text-pretty italic text-foreground/70">
                  "A emoção é da Lígia. A entrega é minha. As duas precisam existir para a marca
                  ser real."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NA MÍDIA */}
      <NaMidia
        variant="full"
        eyebrow="Reconhecimento"
        title="Histórias que ganharam o mundo."
      />

      {/* CTA EMOCIONAL */}
      <section className="relative overflow-hidden bg-carvao py-28 text-areia md:py-36">
        <img
          src={natureza}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carvao/70 via-carvao/85 to-carvao" />
        <div className="container-tight relative text-center">
          <div className="eyebrow text-cobre-soft">Sua travessia</div>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl text-balance md:text-6xl">
            A serra está te esperando.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-areia/85">
            Escolha uma expedição, fale com a nossa equipe ou simplesmente venha entender por
            que voltar de uma cavalgada nossa é diferente.
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
