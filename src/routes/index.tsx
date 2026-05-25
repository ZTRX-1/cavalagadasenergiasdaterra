import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowRight, Mountain, ShieldCheck, Sparkles, Utensils, Tent, Compass } from "lucide-react";
import { listExpedicoes, listProximasDatas } from "@/lib/expedicoes.functions";
import { ExpedicaoCard } from "@/components/expedicao-card";
import { DataCard } from "@/components/data-card";
import { DepoimentosShorts } from "@/components/depoimentos-shorts";
import { VideoCinematic } from "@/components/video-cinematic";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NaMidia } from "@/components/na-midia";
import hero from "@/assets/founders/ligia-rio.jpg";
import manifestoImg from "@/assets/fotos/mantiqueira/13.jpg";
import ctaFinal from "@/assets/fotos/canastra/26.jpg";
import acampamento from "@/assets/acampamento.jpg";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import logoCanastra from "@/assets/logo-canastra.jpg";
import logoElas from "@/assets/logo-elas-na-sela.jpg";


const expedicoesQO = queryOptions({ queryKey: ["expedicoes"], queryFn: () => listExpedicoes() });
const datasQO = queryOptions({ queryKey: ["proximas-datas"], queryFn: () => listProximasDatas() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cavalgadas Energias da Terra · Premium horseback expeditions" },
      { name: "description", content: "Cinematic horseback expeditions across Brazil and the world. Nature, sophistication and adventure in small curated groups." },
      { property: "og:title", content: "Cavalgadas Energias da Terra" },
      { property: "og:description", content: "Cinematic horseback expeditions across Brazil and the world." },
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
  { icon: Mountain, key: "cavalos" },
  { icon: Tent, key: "hospedagem" },
  { icon: Utensils, key: "gastronomia" },
  { icon: ShieldCheck, key: "seguro" },
  { icon: Compass, key: "guias" },
  { icon: Sparkles, key: "grupos" },
];

const INCLUI_TXT: Record<string, Record<string, { label: string; desc: string }>> = {
  pt: {
    cavalos: { label: "Cavalos selecionados", desc: "Animais dóceis, treinados e acompanhados por equipe experiente." },
    hospedagem: { label: "Hospedagem premium", desc: "Pousadas de charme e acampamentos de luxo cuidadosamente curados." },
    gastronomia: { label: "Gastronomia curada", desc: "Refeições assinadas, ingredientes regionais e fogueira ao anoitecer." },
    seguro: { label: "Seguro aventura", desc: "Cobertura completa, briefing técnico e equipe de apoio em campo." },
    guias: { label: "Guias bilíngues", desc: "Roteiros conduzidos por guias profissionais com profundo conhecimento local." },
    grupos: { label: "Grupos íntimos", desc: "Expedições limitadas para preservar a experiência e o silêncio." },
  },
  en: {
    cavalos: { label: "Selected horses", desc: "Gentle, well-trained animals accompanied by an experienced team." },
    hospedagem: { label: "Premium lodging", desc: "Boutique inns and luxury camps, carefully curated." },
    gastronomia: { label: "Curated cuisine", desc: "Signature meals, regional ingredients and a fire at nightfall." },
    seguro: { label: "Adventure insurance", desc: "Full coverage, technical briefing and a support team on field." },
    guias: { label: "Bilingual guides", desc: "Itineraries led by professional guides with deep local knowledge." },
    grupos: { label: "Intimate groups", desc: "Limited expeditions to preserve the experience and the silence." },
  },
  es: {
    cavalos: { label: "Caballos seleccionados", desc: "Animales dóciles, entrenados y acompañados por un equipo experto." },
    hospedagem: { label: "Alojamiento premium", desc: "Posadas con encanto y campamentos de lujo cuidadosamente seleccionados." },
    gastronomia: { label: "Gastronomía curada", desc: "Comidas firmadas, ingredientes regionales y fogón al anochecer." },
    seguro: { label: "Seguro de aventura", desc: "Cobertura completa, briefing técnico y equipo de apoyo en campo." },
    guias: { label: "Guías bilingües", desc: "Itinerarios conducidos por guías profesionales con profundo conocimiento local." },
    grupos: { label: "Grupos íntimos", desc: "Expediciones limitadas para preservar la experiencia y el silencio." },
  },
};

const PASSOS_TXT: Record<string, Array<{ n: string; t: string; d: string }>> = {
  pt: [
    { n: "01", t: "Escolha sua expedição", d: "Explore os destinos e selecione a experiência que mais ressoa com você." },
    { n: "02", t: "Faça sua pré-reserva", d: "Preencha o formulário em poucos minutos. Você receberá um protocolo automaticamente." },
    { n: "03", t: "Confirme via WhatsApp", d: "Nossa equipe entra em contato para alinhar detalhes e confirmar a sua vaga." },
    { n: "04", t: "Viva a experiência", d: "Chegue, monte e deixe o resto com a gente. Cada detalhe foi pensado." },
  ],
  en: [
    { n: "01", t: "Choose your expedition", d: "Explore the destinations and select the experience that resonates most with you." },
    { n: "02", t: "Request your booking", d: "Fill in the short form in minutes. You'll receive a confirmation protocol automatically." },
    { n: "03", t: "Confirm on WhatsApp", d: "Our team gets in touch to align details and confirm your spot." },
    { n: "04", t: "Live the experience", d: "Arrive, mount and leave the rest to us. Every detail has been considered." },
  ],
  es: [
    { n: "01", t: "Elige tu expedición", d: "Explora los destinos y selecciona la experiencia que más te resuene." },
    { n: "02", t: "Solicita tu reserva", d: "Completa el formulario en minutos. Recibirás un protocolo automáticamente." },
    { n: "03", t: "Confirma por WhatsApp", d: "Nuestro equipo te contacta para alinear detalles y confirmar tu lugar." },
    { n: "04", t: "Vive la experiencia", d: "Llega, monta y déjanos el resto. Cada detalle fue pensado." },
  ],
};

const FAQ_TXT: Record<string, Array<{ q: string; a: string }>> = {
  pt: [
    { q: "Preciso ter experiência prévia?", a: "Não. Temos expedições para todos os níveis, desde iniciantes até cavaleiros avançados. Indicamos a melhor opção conforme seu perfil." },
    { q: "Como funciona o pagamento?", a: "Após a pré-reserva, nossa equipe entra em contato via WhatsApp para alinhar o pagamento. Aceitamos Pix, transferência e cartão parcelado." },
    { q: "E se eu precisar cancelar?", a: "Aplicamos nossa política de cancelamento, transparente e proporcional ao tempo de antecedência. Detalhamos tudo antes da confirmação." },
    { q: "Vocês oferecem transfer?", a: "Sim. Todas as expedições incluem transfer do aeroporto ou ponto combinado até a base da experiência." },
  ],
  en: [
    { q: "Do I need previous experience?", a: "No. We have expeditions for every level, from first-time riders to advanced. We recommend the best fit based on your profile." },
    { q: "How does payment work?", a: "After requesting your booking, our team contacts you on WhatsApp to align payment. We accept Pix, bank transfer and credit card installments." },
    { q: "What if I need to cancel?", a: "We apply our cancellation policy, transparent and proportional to how far in advance you cancel. We detail everything before confirmation." },
    { q: "Do you provide transfers?", a: "Yes. All expeditions include transfer from the airport or agreed pickup point to the base of the experience." },
  ],
  es: [
    { q: "¿Necesito experiencia previa?", a: "No. Tenemos expediciones para todos los niveles, desde principiantes hasta jinetes avanzados. Recomendamos la mejor opción según tu perfil." },
    { q: "¿Cómo funciona el pago?", a: "Tras la solicitud, nuestro equipo te contacta por WhatsApp para alinear el pago. Aceptamos Pix, transferencia y tarjeta en cuotas." },
    { q: "¿Y si necesito cancelar?", a: "Aplicamos nuestra política de cancelación, transparente y proporcional a la antelación. Lo detallamos todo antes de la confirmación." },
    { q: "¿Ofrecen traslados?", a: "Sí. Todas las expediciones incluyen traslado desde el aeropuerto o punto acordado hasta la base de la experiencia." },
  ],
};

function HomePage() {
  const { t, i18n } = useTranslation();
  const { data: expedicoes } = useSuspenseQuery(expedicoesQO);
  const { data: datas } = useSuspenseQuery(datasQO);
  const proximasDatas = datas.slice(0, 4);
  const lng = (["pt", "en", "es"].includes(i18n.language) ? i18n.language : "pt") as "pt" | "en" | "es";
  const incluiCopy = INCLUI_TXT[lng];
  const passos = PASSOS_TXT[lng];
  const faq = FAQ_TXT[lng];

  return (
    <>
      {/* HERO — focal points por breakpoint, preservando rosto + cavalo */}
      <section className="relative min-h-[100svh] overflow-hidden text-areia md:min-h-[720px] md:h-screen">
        <img
          src={hero}
          alt="Lígia montando a cavalo em travessia pelo rio"
          className="absolute inset-0 h-full w-full object-cover object-[62%_18%] md:hidden"
          fetchPriority="high"
          decoding="async"
        />
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full object-cover object-[50%_18%] md:block xl:hidden"
          fetchPriority="high"
          decoding="async"
        />
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full object-cover object-[46%_22%] xl:block"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-carvao/45 md:bg-carvao/40" />
        <div className="absolute inset-x-0 bottom-0 h-[85%] bg-gradient-to-t from-carvao via-carvao/82 to-transparent md:h-[72%] md:via-carvao/70" />
        <div className="absolute inset-y-0 left-0 w-full md:w-[68%] bg-gradient-to-r from-carvao/85 via-carvao/45 to-transparent md:from-carvao/80 md:via-carvao/38" />

        <div className="container-tight relative flex min-h-[100svh] flex-col justify-end pb-14 pt-24 md:min-h-0 md:h-full md:pb-20 md:pt-28 lg:pb-24">
          <div className="max-w-3xl">
            <div className="eyebrow text-areia text-shadow-strong text-[0.62rem] md:text-xs">{t("hero.eyebrow")}</div>
            <h1 className="mt-4 font-display text-[1.85rem] leading-[1.06] text-balance text-shadow-strong text-areia xs:text-[2.1rem] sm:text-5xl md:mt-5 md:text-6xl md:leading-[0.98] lg:text-7xl">
              {t("hero.titlePart1")} <em className="not-italic text-cobre-soft whitespace-nowrap">{t("hero.titleAccent")}</em> {t("hero.titlePart2")}
            </h1>
            <p className="mt-4 max-w-xl font-display text-[1.1rem] leading-[1.28] text-areia text-shadow-strong text-balance sm:text-2xl md:mt-5 md:text-[1.7rem] md:leading-[1.2]">
              {t("hero.subtitle")}
            </p>
            <p className="mt-3 max-w-lg text-[0.86rem] leading-relaxed text-areia/85 text-shadow-soft text-pretty md:mt-4 md:text-[0.98rem]">
              {t("hero.support")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 md:mt-7">
              <Link to="/expedicoes" className="inline-flex items-center gap-2 rounded-full bg-cobre px-6 py-3.5 text-[0.74rem] uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft md:px-7 md:py-4 md:text-sm">
                {t("hero.ctaPrimary")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/datas" className="inline-flex items-center gap-2 rounded-full border border-areia/60 bg-carvao/30 px-6 py-3.5 text-[0.74rem] uppercase tracking-widest text-areia backdrop-blur-sm hover:bg-areia/15 md:px-7 md:py-4 md:text-sm">
                {t("hero.ctaSecondary")}
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-3 md:mt-6 xl:hidden">
              <span className="h-px w-8 bg-areia/30" />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </section>


      {/* TRÊS MARCAS — sem fundo de imagem */}
      <section className="relative bg-background py-28 md:py-36 texture-paper">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">{t("marcas.eyebrow")}</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{t("marcas.title")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-foreground/75 text-pretty">
              {t("marcas.subtitle")}
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {[
              { logo: logoCavalgadas, nome: "Cavalgadas Energias da Terra", tagline: { pt: "Expedições a cavalo pelo Brasil e pelo mundo.", en: "Horseback expeditions across Brazil and the world.", es: "Expediciones a caballo por Brasil y el mundo." }, to: "/marcas/cavalgadas" as const },
              { logo: logoElas, nome: "Elas na Sela", tagline: { pt: "Experiências exclusivas para mulheres que exploram o mundo a cavalo.", en: "Exclusive experiences for women who explore the world on horseback.", es: "Experiencias exclusivas para mujeres que exploran el mundo a caballo." }, to: "/marcas/elas-na-sela" as const },
              { logo: logoCanastra, nome: "Canastra a Cavalo", tagline: { pt: "Expedições a cavalo pela Serra da Canastra.", en: "Horseback expeditions through Serra da Canastra.", es: "Expediciones a caballo por la Sierra da Canastra." }, to: "/marcas/canastra-a-cavalo" as const },
            ].map((m) => (
              <Link
                key={m.nome}
                to={m.to}
                className="group flex flex-col items-center bg-carvao p-10 text-center text-areia transition-transform hover:-translate-y-1"
              >
                <img src={m.logo} alt={m.nome} loading="lazy" decoding="async" className="h-28 w-28 rounded-full object-cover ring-1 ring-cobre/40" />
                <div className="mt-6 font-display text-2xl text-balance leading-tight">{m.nome}</div>
                <p className="mt-3 text-sm leading-relaxed text-areia/80 text-pretty">{m.tagline[lng]}</p>
                <span className="mt-6 inline-flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.32em] text-cobre-soft group-hover:text-areia">
                  {t("marcas.cta")} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO — texto + 1 imagem lateral */}
      <section className="bg-background py-28 md:py-36">
        <div className="container-tight grid gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <div className="overflow-hidden">
              <img src={manifestoImg} alt="" loading="lazy" decoding="async" className="h-full max-h-[640px] w-full object-cover" />
            </div>
          </div>
          <div className="md:col-span-7 flex flex-col justify-center">
            <div className="eyebrow">{t("manifesto.eyebrow")}</div>
            <h2 className="mt-5 font-display text-4xl text-balance leading-[1.05] md:text-5xl lg:text-[3.5rem]">{t("manifesto.title")}</h2>
            <p className="mt-8 text-lg leading-relaxed text-foreground/80 text-pretty">
              {t("manifesto.body")}
            </p>
          </div>
        </div>
      </section>

      {/* VÍDEO CINEMATOGRÁFICO */}
      <section className="bg-carvao py-24 md:py-32">
        <div className="container-tight">
          <VideoCinematic
            youtubeId="nPoJeABD5ko"
            poster={acampamento}
            eyebrow="Energias da Terra · filme oficial"
            title={lng === "en" ? "The crossing, before the crossing." : lng === "es" ? "La travesía, antes de la travesía." : "A travessia, antes da travessia."}
            subtitle={lng === "en" ? "Tap to watch with sound" : lng === "es" ? "Toca para ver con sonido" : "Toque para assistir com som"}
          />
        </div>
      </section>

      {/* INCLUI — sem imagem de fundo, apenas ícones */}
      <section className="bg-floresta-deep py-28 text-areia md:py-36">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow text-cobre-soft">{t("inclui.eyebrow")}</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{t("inclui.title")}</h2>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUI.map(({ icon: Icon, key }) => (
              <div key={key}>
                <Icon className="h-7 w-7 text-cobre-soft" />
                <div className="mt-5 font-display text-xl">{incluiCopy[key].label}</div>
                <p className="mt-2 text-sm leading-relaxed text-areia/70">{incluiCopy[key].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPEDIÇÕES */}
      <section className="bg-background py-28 md:py-36">
        <div className="container-tight">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <div className="eyebrow">{t("expedicoes.eyebrow")}</div>
              <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{t("expedicoes.title")}</h2>
            </div>
            <Link to="/expedicoes" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-foreground hover:text-cobre">
              {t("expedicoes.verTodas")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {expedicoes.map((e) => <ExpedicaoCard key={e.id} expedicao={e} />)}
          </div>
        </div>
      </section>

      {/* PRÓXIMAS DATAS */}
      <section className="bg-secondary/40 py-28 md:py-36">
        <div className="container-tight">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">{t("datas.eyebrow")}</div>
              <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{t("datas.title")}</h2>
            </div>
            <Link to="/datas" className="inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-cobre">
              {t("datas.verTodas")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 space-y-3">
            {proximasDatas.map((d) => <DataCard key={d.id} data={d} />)}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS — 3 shorts cinematográficos */}
      <DepoimentosShorts />

      {/* NA MÍDIA — autoridade discreta */}
      <NaMidia variant="compact" />


      {/* COMO FUNCIONA — bloco terroso, separação visual sofisticada */}
      <section className="relative bg-[color:var(--areia-warm)] py-28 md:py-36">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-carvao/15 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,var(--carvao)_1px,transparent_0)] [background-size:22px_22px]" />
        <div className="container-tight relative">
          <div className="max-w-2xl">
            <div className="eyebrow text-couro">{t("passos.eyebrow")}</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl text-carvao">{t("passos.title")}</h2>
          </div>
          <div className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {passos.map((p, i) => (
              <div key={p.n} className="relative">
                {i > 0 && (
                  <span aria-hidden className="absolute -left-5 top-1 hidden h-10 w-px bg-carvao/15 lg:block" />
                )}
                <div className="font-display text-[2.75rem] leading-none text-cobre">{p.n}</div>
                <div className="mt-5 font-display text-xl text-carvao">{p.t}</div>
                <p className="mt-3 text-sm leading-relaxed text-carvao/70">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-carvao/15 to-transparent" />
      </section>

      {/* FAQ — fundo claro, contraste editorial */}
      <section className="bg-background py-28 md:py-36">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">{t("faq.eyebrow")}</div>
            <h2 className="mt-5 font-display text-4xl text-balance md:text-5xl">{t("faq.title")}</h2>
            <span aria-hidden className="mt-7 block h-px w-16 bg-cobre" />
            <Link to="/contato" className="mt-6 inline-flex items-center gap-2 text-sm uppercase tracking-widest hover:text-cobre">
              {t("faq.verTodas")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="md:col-span-8">
            <div className="divide-y divide-border border-y border-border">
              {faq.map((f) => (
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

      {/* CTA FINAL — uma imagem cinematográfica forte */}
      <section className="relative isolate overflow-hidden bg-floresta-deep py-36 text-areia md:py-48">
        <img src={ctaFinal} alt="" aria-hidden loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-carvao via-floresta-deep/85 to-floresta-deep/50" />
        <div className="container-tight relative text-center">
          <div className="eyebrow text-cobre-soft">{t("ctaFinal.eyebrow")}</div>
          <h2 className="mx-auto mt-7 max-w-3xl font-display text-5xl text-balance leading-[1.02] md:text-7xl">
            {t("ctaFinal.title")}
          </h2>
          <Link to="/expedicoes" className="mt-12 inline-flex items-center gap-3 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft">
            {t("ctaFinal.cta")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
