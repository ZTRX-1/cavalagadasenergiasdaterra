import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Mountain, ShieldCheck, Sparkles, Utensils, Tent, Compass } from "lucide-react";
import { listExpedicoes, listProximasDatas } from "@/lib/expedicoes.functions";
import { ExpedicaoCard } from "@/components/expedicao-card";
import { DataCard } from "@/components/data-card";
import hero from "@/assets/hero-cavalgada.jpg";
import cavaloCloseup from "@/assets/cavalo-closeup.jpg";
import acampamento from "@/assets/acampamento.jpg";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import logoCanastra from "@/assets/logo-canastra.jpg";
import logoElas from "@/assets/logo-elas-na-sela.jpg";

const expedicoesQO = queryOptions({ queryKey: ["expedicoes"], queryFn: () => listExpedicoes() });
const datasQO = queryOptions({ queryKey: ["proximas-datas"], queryFn: () => listProximasDatas() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cavalgadas Energias da Terra — Expedições a cavalo premium" },
      { name: "description", content: "Expedições cinematográficas a cavalo pelas serras do Brasil. Natureza, sofisticação e aventura em pequenos grupos selecionados." },
      { property: "og:title", content: "Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Expedições cinematográficas a cavalo pelas serras do Brasil." },
      { property: "og:image", content: hero },
      { name: "twitter:image", content: hero },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(expedicoesQO),
      context.queryClient.ensureQueryData(datasQO),
    ]);
  },
  component: HomePage,
});

const INCLUI = [
  { icon: Mountain, label: "Cavalos selecionados", desc: "Animais dóceis, treinados e acompanhados por equipe experiente." },
  { icon: Tent, label: "Hospedagem premium", desc: "Pousadas de charme e acampamentos de luxo cuidadosamente curados." },
  { icon: Utensils, label: "Gastronomia curada", desc: "Refeições assinadas, ingredientes regionais e fogueira ao anoitecer." },
  { icon: ShieldCheck, label: "Seguro aventura", desc: "Cobertura completa, briefing técnico e equipe de apoio em campo." },
  { icon: Compass, label: "Guias bilíngues", desc: "Roteiros conduzidos por guias profissionais com profundo conhecimento local." },
  { icon: Sparkles, label: "Grupos íntimos", desc: "Expedições limitadas para preservar a experiência e o silêncio." },
];

const PASSOS = [
  { n: "01", t: "Escolha sua expedição", d: "Explore os destinos e selecione a experiência que mais ressoa com você." },
  { n: "02", t: "Faça sua pré-reserva", d: "Preencha o formulário em poucos minutos. Você receberá um protocolo automaticamente." },
  { n: "03", t: "Confirme via WhatsApp", d: "Nossa equipe entra em contato para alinhar detalhes e confirmar a sua vaga." },
  { n: "04", t: "Viva a experiência", d: "Chegue, monte e deixe o resto com a gente. Cada detalhe foi pensado." },
];

const DEPOIMENTOS = [
  { nome: "Fernanda M.", local: "São Paulo", texto: "A travessia da Canastra mudou minha relação com o tempo. Cada detalhe foi impecável — da seleção dos cavalos ao jantar à fogueira." },
  { nome: "Ricardo A.", local: "Rio de Janeiro", texto: "Já fiz cavalgadas em várias partes do mundo. Esta foi a mais bem produzida que vivi no Brasil. Premium de verdade." },
  { nome: "Juliana e Pedro", local: "Belo Horizonte", texto: "Saímos transformados. Hospedagem, gastronomia, condução — tudo num nível raro. Já estamos planejando a próxima." },
];

const FAQ = [
  { q: "Preciso ter experiência prévia?", a: "Não. Temos expedições para todos os níveis, desde iniciantes até cavaleiros avançados. Indicamos a melhor opção conforme seu perfil." },
  { q: "Como funciona o pagamento?", a: "Após a pré-reserva, nossa equipe entra em contato via WhatsApp para alinhar o pagamento — aceitamos Pix, transferência e cartão parcelado." },
  { q: "E se eu precisar cancelar?", a: "Aplicamos nossa política de cancelamento, transparente e proporcional ao tempo de antecedência. Detalhamos tudo antes da confirmação." },
  { q: "Vocês oferecem transfer?", a: "Sim. Todas as expedições incluem transfer do aeroporto/ponto combinado até a base da experiência." },
];

function HomePage() {
  const { data: expedicoes } = useSuspenseQuery(expedicoesQO);
  const { data: datas } = useSuspenseQuery(datasQO);
  const proximasDatas = datas.slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[100svh] overflow-hidden text-areia">
        <img src={hero} alt="Cavaleiro ao pôr do sol nas montanhas" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-carvao/40" />
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-carvao via-carvao/60 to-transparent" />

        <div className="container-tight relative flex min-h-[100svh] flex-col justify-end pb-20 pt-32 md:pb-28 md:pt-40">
          <div className="max-w-3xl">
            <div className="eyebrow text-cobre-soft text-shadow-soft">Energias da Terra · Expedições imersivas</div>
            <h1 className="mt-5 font-display text-5xl leading-[0.98] text-balance text-shadow-strong md:text-7xl lg:text-8xl">
              Expedições imersivas <em className="not-italic text-cobre-soft">a cavalo</em> pelo Brasil e pelo mundo.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-areia/95 text-shadow-soft text-pretty">
              Experiências exclusivas para quem busca liberdade, natureza e aventura de verdade. Pequenos grupos, cavalos Mangalarga Marchador, hospedagens curadas.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/expedicoes" className="inline-flex items-center gap-2 rounded-full bg-cobre px-7 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft">
                Ver Expedições <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/datas" className="inline-flex items-center gap-2 rounded-full border border-areia/50 px-7 py-4 text-sm uppercase tracking-widest text-areia hover:bg-areia/10">
                Próximas Datas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ESCOLHA SUA EXPERIÊNCIA — 3 sub-marcas */}
      <section className="relative bg-background py-24 md:py-32 texture-paper">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">Escolha sua experiência</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Três caminhos. Uma mesma essência.</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/75 text-pretty">
              Cada marca da Energias da Terra existe para uma forma específica de viver a cavalgada. Encontre a sua.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { logo: logoCavalgadas, nome: "Cavalgadas Energias da Terra", tagline: "Expedições imersivas pelo Brasil e pelo mundo.", to: "/expedicoes" as const },
              { logo: logoElas, nome: "Elas na Sela", tagline: "Experiências exclusivas para mulheres que exploram o mundo a cavalo.", to: "/expedicoes" as const },
              { logo: logoCanastra, nome: "Canastra a Cavalo", tagline: "Travessias premium na Serra da Canastra.", to: "/expedicoes/$slug" as const, params: { slug: "serra-da-canastra" } },
            ].map((m) => (
              <Link
                key={m.nome}
                to={m.to}
                params={m.params}
                className="group flex flex-col items-center bg-carvao p-10 text-center text-areia transition-transform hover:-translate-y-1"
              >
                <img src={m.logo} alt={m.nome} className="h-28 w-28 rounded-full object-cover ring-1 ring-cobre/40" />
                <div className="mt-6 font-display text-2xl text-balance leading-tight">{m.nome}</div>
                <p className="mt-3 text-sm leading-relaxed text-areia/75 text-pretty">{m.tagline}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-cobre-soft group-hover:text-areia">
                  Explorar <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="eyebrow">A experiência</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Não é um passeio. É uma travessia interna.</h2>
          </div>
          <div className="md:col-span-7">
            <p className="text-lg leading-relaxed text-foreground/80 text-pretty">
              Desenhamos cada expedição como um filme: roteiro, ritmo, fotografia. Trilhas selecionadas a dedo, hospedagens com alma, gastronomia que conversa com o território.
              Cada vaga é limitada para preservar o silêncio — e a profundidade — do que estamos oferecendo.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                ["Manada própria", "Mangalarga Marchador de alta performance"],
                ["Grupos íntimos", "no máximo 14 cavaleiros por travessia"],
                ["Brasil & mundo", "Canastra · Mantiqueira · Jeri · Peru · Patagônia"],
                ["Seguro aventura", "guias, carro de apoio e cobertura completa"],
              ].map(([big, sub]) => (
                <div key={big} className="border-l-2 border-cobre pl-4">
                  <div className="font-display text-2xl">{big}</div>
                  <div className="text-sm text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INCLUI */}
      <section className="relative bg-floresta-deep py-24 text-areia md:py-32">
        <img src={cavaloCloseup} alt="" aria-hidden className="absolute inset-y-0 right-0 hidden h-full w-1/3 object-cover opacity-25 lg:block" />
        <div className="absolute inset-0 bg-gradient-to-r from-floresta-deep via-floresta-deep to-transparent" />
        <div className="container-tight relative">
          <div className="max-w-2xl">
            <div className="eyebrow text-cobre-soft">O que está incluso</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Tudo cuidado. Você apenas chega e cavalga.</h2>
          </div>
          <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUI.map(({ icon: Icon, label, desc }) => (
              <div key={label}>
                <Icon className="h-7 w-7 text-cobre-soft" />
                <div className="mt-5 font-display text-xl">{label}</div>
                <p className="mt-2 text-sm leading-relaxed text-areia/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPEDIÇÕES */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="eyebrow">Expedições</div>
              <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Destinos selecionados, roteiros assinados.</h2>
            </div>
            <Link to="/expedicoes" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-foreground hover:text-cobre">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {expedicoes.map((e) => <ExpedicaoCard key={e.id} expedicao={e} />)}
          </div>
        </div>
      </section>

      {/* PRÓXIMAS DATAS */}
      <section className="bg-secondary/40 py-24 md:py-32">
        <div className="container-tight">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">Calendário</div>
              <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Próximas datas</h2>
            </div>
            <Link to="/datas" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-cobre">
              Ver todas as datas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 space-y-3">
            {proximasDatas.map((d) => <DataCard key={d.id} data={d} />)}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">Como funciona</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Reservar sua vaga é simples e direto.</h2>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PASSOS.map((p) => (
              <div key={p.n} className="border-t border-border pt-6">
                <div className="font-display text-3xl text-cobre">{p.n}</div>
                <div className="mt-3 font-display text-xl">{p.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="relative overflow-hidden bg-carvao py-24 text-areia md:py-32">
        <img src={acampamento} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="container-tight relative">
          <div className="eyebrow text-cobre-soft">Quem viveu</div>
          <h2 className="mt-4 max-w-2xl font-display text-4xl text-balance md:text-5xl">Histórias de quem atravessou conosco.</h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {DEPOIMENTOS.map((d) => (
              <figure key={d.nome} className="border-t border-areia/20 pt-6">
                <blockquote className="font-display text-xl leading-snug text-balance">"{d.texto}"</blockquote>
                <figcaption className="mt-6 text-sm">
                  <div className="text-cobre-soft">{d.nome}</div>
                  <div className="text-areia/60">{d.local}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">Perguntas</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">Para você ir tranquilo.</h2>
            <Link to="/contato" className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-cobre">
              Ver todas as perguntas <ArrowRight className="h-4 w-4" />
            </Link>
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

      {/* CTA FINAL */}
      <section className="relative isolate overflow-hidden bg-floresta-deep py-32 text-areia md:py-40">
        <img src={hero} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-carvao via-floresta-deep/80 to-floresta-deep/40" />
        <div className="container-tight relative text-center">
          <div className="eyebrow text-cobre-soft">Sua próxima travessia</div>
          <h2 className="mx-auto mt-6 max-w-3xl font-display text-5xl text-balance md:text-7xl">
            A serra está te esperando.
          </h2>
          <Link to="/expedicoes" className="mt-10 inline-flex items-center gap-3 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft">
            Escolher minha expedição <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
