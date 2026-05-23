import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MessageCircle, MapPin } from "lucide-react";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import cavaloCloseup from "@/assets/cavalo-closeup.jpg";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato, FAQ e Quem Somos — Cavalgadas Energias da Terra" },
      { name: "description", content: "Fale conosco, conheça nossa história e tire suas dúvidas sobre as expedições." },
    ],
  }),
  component: ContatoPage,
});

const FAQ = [
  { q: "Quem pode participar das expedições?", a: "Qualquer pessoa em boas condições de saúde, dentro dos requisitos de cada expedição (idade e peso). Temos roteiros para todos os níveis." },
  { q: "Preciso de experiência prévia com cavalos?", a: "Não. Nossas expedições iniciantes são desenhadas para quem nunca montou. Para os roteiros avançados pedimos experiência prévia." },
  { q: "Como funciona a hospedagem?", a: "Trabalhamos com pousadas selecionadas e, em alguns roteiros, acampamentos de luxo. Todos com curadoria nossa e padrão premium." },
  { q: "E em caso de chuva?", a: "Operamos com chuva leve. Em caso de tempestades, ajustamos o roteiro para garantir segurança. Em situações extremas, remarcamos sem custo." },
  { q: "Os cavalos são treinados?", a: "Sim. Todos os cavalos são treinados, descansados entre expedições e acompanhados por equipe profissional." },
  { q: "Posso fazer uma expedição privada?", a: "Sim. Organizamos expedições privadas para grupos, casais e empresas. Fale conosco para um orçamento personalizado." },
  { q: "Qual a melhor época para ir?", a: "Cada região tem sua melhor janela. Em geral, abril a outubro são meses ideais — clima seco e paisagens em equilíbrio." },
  { q: "Como faço o pagamento?", a: "Aceitamos Pix, transferência, boleto e cartão parcelado. Combinamos tudo via WhatsApp após a pré-reserva." },
];

function ContatoPage() {
  return (
    <>
      <section className="bg-background pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="eyebrow">Contato</div>
            <h1 className="mt-4 font-display text-5xl text-balance md:text-7xl">Vamos conversar.</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
              Atendemos pelo WhatsApp e Instagram. Em geral respondemos em menos de 2 horas durante o horário comercial.
            </p>
            <div className="mt-10 space-y-4">
              <a href={buildContactWhatsappUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-cobre">
                <MessageCircle className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">WhatsApp</div>
                  <div className="text-sm text-muted-foreground">+55 11 94162-6907</div>
                </div>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-cobre">
                <Instagram className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">Instagram</div>
                  <div className="text-sm text-muted-foreground">@cavalgadasenergiadaterra</div>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-sm border border-border bg-card p-5">
                <MapPin className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">Base de operações</div>
                  <div className="text-sm text-muted-foreground">Serra da Canastra · Minas Gerais</div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-5">
            <img src={cavaloCloseup} alt="Cavalo de uma das nossas expedições" className="aspect-[4/5] w-full rounded-sm object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Quem somos */}
      <section className="bg-floresta-deep py-24 text-areia md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow text-cobre-soft">Quem somos</div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">Apaixonados por cavalos, natureza e experiências transformadoras.</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-lg leading-relaxed text-areia/85 text-pretty">
            <p>
              A Cavalgadas Energias da Terra nasceu do desejo de unir turismo, cultura, aventura e o universo equestre em jornadas cuidadosamente planejadas para pessoas que buscam algo além do turismo convencional.
            </p>
            <p>
              Como criadores de cavalos, proprietários de haras e operadores de experiências equestres, vivemos esse universo diariamente.
            </p>
          </div>
        </div>
      </section>

      {/* Nosso diferencial */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">Nosso diferencial</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Não vendemos cavalgadas — criamos experiências boutique.</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-lg leading-relaxed text-foreground/80 text-pretty">
            <p>
              Criamos experiências equestres boutique para pequenos grupos, acompanhando pessoalmente cada etapa da jornada e cuidando de cada detalhe para que nossos clientes possam simplesmente viver o momento.
            </p>
            <p>
              Além de operar expedições no Brasil e no exterior, também somos criadores de cavalos da raça Mangalarga Marchador.
            </p>
            <p>
              Cada roteiro é desenvolvido para proporcionar muito mais do que uma viagem: uma imersão na cultura local, paisagens extraordinárias, conexão com os cavalos e encontros entre pessoas que compartilham a mesma paixão.
            </p>
            <p className="font-display text-2xl text-cobre">
              Mais do que clientes, formamos uma verdadeira manada.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">Perguntas frequentes</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">FAQ</h2>
          </div>
          <div className="md:col-span-8">
            <div className="divide-y divide-border border-y border-border">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-6">
                  <summary className="flex cursor-pointer items-center justify-between font-display text-lg">
                    {f.q}
                    <span className="ml-4 text-cobre transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
