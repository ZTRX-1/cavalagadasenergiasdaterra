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
            <h2 className="mt-4 font-display text-4xl md:text-5xl">Uma produtora de travessias.</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-lg leading-relaxed text-areia/80 text-pretty">
            <p>
              Nascemos em 2018 com uma obsessão: oferecer expedições a cavalo no Brasil com o mesmo nível de cuidado, curadoria e estética que se vê nas melhores experiências do mundo.
            </p>
            <p>
              Cada roteiro é construído com guias locais, produtores rurais, chefs e horsemen que conhecem profundamente o território. Cuidamos do que importa para que você só precise estar presente.
            </p>
            <p className="text-cobre-soft">
              "Cavalgar é uma forma antiga de prestar atenção ao mundo."
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
