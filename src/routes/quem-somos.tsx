import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Heart, Compass, Mountain, Sparkles } from "lucide-react";
import { EditorialFrame } from "@/components/editorial-frame";
import { NaMidia } from "@/components/na-midia";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import ligia from "@/assets/founders/ligia-rio.jpg";
import alinne from "@/assets/founders/alinne-pantanal.jpg";
import heroPaisagem from "@/assets/fotos/mantiqueira/05.jpg";
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
      {/* HERO — faixa cinematográfica minimalista */}
      <section className="relative bg-carvao text-areia">
        <div className="relative h-[52svh] min-h-[420px] max-h-[640px] overflow-hidden md:h-[58svh]">
          <img
            src={ligia}
            alt="Lígia atravessando o rio a cavalo"
            className="absolute inset-0 h-full w-full object-cover [object-position:47%_24%]"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-carvao/35" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carvao to-transparent" />
        </div>

        <div className="container-tight relative -mt-24 pb-20 md:-mt-32 md:pb-28">
          <div className="max-w-2xl">
            <div className="eyebrow text-cobre-soft">Boutique equestrian expeditions</div>
            <h1 className="mt-5 font-display text-4xl leading-[1.02] text-balance md:text-6xl">
              Quem cuida da <em className="not-italic text-cobre-soft">travessia</em>.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-areia/80 md:text-lg">
              Marca brasileira de expedições equestres boutique. Cavalos próprios criados no
              Refúgio &amp; Haras Energias da Terra, guias bilíngues, hospedagens curadas e
              direção autoral.
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

      {/* FUNDADORAS — intro */}
      <section className="bg-background pt-28 md:pt-36">
        <div className="container-tight">
          <div className="mx-auto max-w-2xl text-center">
            <div className="eyebrow">As fundadoras</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">
              Duas mulheres. Uma travessia compartilhada.
            </h2>
            <p className="mt-5 text-foreground/75 text-pretty">
              Lígia e Alinne lideram a Cavalgadas Energias da Terra, a Elas na Sela, a Canastra a
              Cavalo e o Refúgio &amp; Haras Energias da Terra. Cada uma traz uma força distinta —
              juntas, são o rosto e a estrutura de uma marca boutique brasileira que ganhou o
              mundo.
            </p>
          </div>
        </div>
      </section>

      {/* LÍGIA — perfil editorial completo */}
      <section className="bg-background py-20 md:py-28">
        <div className="container-tight">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:col-span-5">
              <EditorialFrame
                src={ligia}
                alt="Lígia de Jesus Martins de Oliveira"
                variant="portrait"
                accent="cobre"
                side="left"
              />
              <div className="mt-6 hidden md:block">
                <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-foreground/55">
                  Lígia · 38 anos · Cirurgiã-dentista &amp; idealizadora
                </div>
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col justify-center">
              <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
                Lígia de Jesus Martins de Oliveira · Fundadora &amp; idealizadora
              </div>
              <h3 className="mt-4 font-display text-3xl leading-[1.05] text-balance md:text-5xl">
                A travessia começou nela.
              </h3>

              <div className="mt-8 space-y-7 text-[1rem] leading-relaxed text-foreground/85">
                <p className="text-pretty">
                  Cirurgiã-dentista formada há 17 anos, empresária e idealizadora do projeto
                  Cavalgadas Energias da Terra. Sócia-proprietária da Cavalgadas Energias da Terra,
                  Elas na Sela, Canastra a Cavalo e do Refúgio &amp; Haras Energias da Terra —
                  empreendimento voltado ao turismo rural, hospitalidade, peregrinação e
                  experiências equestres.
                </p>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Origem · superação
                  </div>
                  <p className="mt-3 text-pretty">
                    Sua trajetória com os cavalos começou após superar a síndrome do pânico e a
                    depressão. A convivência com os animais tornou-se um instrumento real de
                    transformação — e, mais tarde, a vocação que dá nome a tudo o que cria. É dessa
                    travessia interna que nasce o propósito da marca: bem-estar, desenvolvimento
                    humano e contato profundo com a natureza.
                  </p>
                </div>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Formação equestre
                  </div>
                  <p className="mt-3 text-pretty">
                    Criadora de cavalos Mangalarga Marchador, associada à ABCCMM. Formação em Doma
                    Racional Índia, rédeas, equitação clássica e adestramento — métodos baseados no
                    respeito, na comunicação e na conexão com o animal.
                  </p>
                </div>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Direção das expedições
                  </div>
                  <p className="mt-3 text-pretty">
                    Atua como guia e responsável pela criação e condução dos roteiros equestres no
                    Brasil e no exterior. Integra cultura, gastronomia, patrimônio imaterial e
                    contato profundo com a natureza — sempre pautada pela seleção criteriosa dos
                    cavalos, segurança dos participantes e valorização das tradições locais.
                  </p>
                </div>

                <blockquote className="border-l-2 border-cobre pl-5 font-display text-2xl italic leading-snug text-foreground/90">
                  "Os cavalos não me salvaram só da dor. Me mostraram o tempo certo das coisas."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALINNE — perfil editorial completo */}
      <section className="bg-background py-20 md:py-28">
        <div className="container-tight">
          <div className="grid gap-12 md:grid-cols-12 md:gap-16">
            <div className="md:order-2 md:col-span-5">
              <EditorialFrame
                src={alinne}
                alt="Alinne Telloli Trassi Martins Bento"
                variant="portrait"
                accent="floresta"
                side="right"
              />
              <div className="mt-6 hidden md:block text-right">
                <div className="font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-foreground/55">
                  Alinne · Engenheira civil · Gestão &amp; expansão
                </div>
              </div>
            </div>

            <div className="md:order-1 md:col-span-7 flex flex-col justify-center">
              <div className="font-eyebrow text-[0.7rem] uppercase tracking-[0.32em] text-cobre">
                Alinne Telloli Trassi Martins Bento · Fundadora &amp; sócia
              </div>
              <h3 className="mt-4 font-display text-3xl leading-[1.05] text-balance md:text-5xl">
                A estrutura que sustenta o sonho.
              </h3>

              <div className="mt-8 space-y-7 text-[1rem] leading-relaxed text-foreground/85">
                <p className="text-pretty">
                  Empresária e engenheira civil, sócia-proprietária da Cavalgadas Energias da
                  Terra, Elas na Sela, Canastra a Cavalo e do Refúgio &amp; Haras Energias da
                  Terra. Atua na gestão de negócios voltados ao turismo rural, hospitalidade,
                  criação de cavalos e experiências equestres exclusivas no Brasil e no exterior.
                </p>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Formação
                  </div>
                  <p className="mt-3 text-pretty">
                    Graduada em Engenharia Civil pelo Instituto Mauá de Tecnologia, com
                    pós-graduação em Administração para Engenheiros pela Universidade Presbiteriana
                    Mackenzie e especializações pela FGV e pela Fundação Instituto de Administração
                    (FIA).
                  </p>
                </div>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Trajetória corporativa
                  </div>
                  <p className="mt-3 text-pretty">
                    Construiu uma carreira sólida na área de Suprimentos em grandes construtoras —
                    gestão, negociações, planejamento e liderança. Essa bagagem foi a base para
                    estruturar e expandir os empreendimentos no setor de turismo equestre e
                    hospedagem.
                  </p>
                </div>

                <div>
                  <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre">
                    Encontro com os cavalos
                  </div>
                  <p className="mt-3 text-pretty">
                    A conexão veio por meio de sua sócia, Lígia, e da força transformadora que os
                    animais exercem na vida das pessoas. A partir daí, dedicou-se intensamente ao
                    universo equestre, unindo gestão e propósito para entregar experiências
                    autênticas, seguras e memoráveis na natureza.
                  </p>
                </div>

                <blockquote className="border-l-2 border-cobre pl-5 font-display text-2xl italic leading-snug text-foreground/90">
                  "A emoção é da Lígia. A entrega é minha. As duas precisam existir para a marca
                  ser real."
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILOSOFIA / PROPÓSITO */}
      <section className="bg-floresta-deep py-24 text-areia md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="eyebrow text-cobre-soft">Filosofia</div>
            <h2 className="mt-5 font-display text-4xl leading-[1.05] text-balance md:text-5xl">
              Conectar pessoas, natureza e bem-estar.
            </h2>
          </div>
          <div className="md:col-span-7 space-y-6 text-[1.02rem] leading-relaxed text-areia/85">
            <p className="text-pretty">
              Acreditamos no turismo equestre como ferramenta de transformação — um caminho de
              reencontro com a natureza, com o silêncio e com o próprio ritmo. Criamos nossos
              cavalos Mangalarga Marchador, treinamos com método e respeito, e desenhamos cada
              expedição em torno do bem-estar do animal e da segurança do cavaleiro.
            </p>
            <p className="text-pretty">
              Boutique, para nós, não é estética: é cuidado. Grupos pequenos, hospedagens curadas,
              gastronomia que dialoga com o território, guias que conhecem o terreno como
              conhecem o cavalo. É na escolha do que <em>não</em> entra na expedição que o luxo
              acontece.
            </p>
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
