import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, MessageCircle } from "lucide-react";
import { getExpedicaoBySlug } from "@/lib/expedicoes.functions";
import { getExpedicaoImage, getExpedicaoGaleria } from "@/lib/expedicao-images";
import { GaleriaEditorial } from "@/components/galeria-editorial";
import { VideoCinematic } from "@/components/video-cinematic";
import { getPublicExpedicaoSlug } from "@/lib/expedicao-slugs";
import { formatDateRange, formatPrice, formatPriceWithBRL } from "@/lib/format";
import { DataCard } from "@/components/data-card";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";


const qo = (slug: string) =>
  queryOptions({
    queryKey: ["expedicao", slug],
    queryFn: () => getExpedicaoBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/expedicoes/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")}, Cavalgadas Energias da Terra` },
      { name: "description", content: "Detalhes da expedição: roteiro, itens inclusos, requisitos e próximas datas." },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(qo(params.slug));
    if (!data) throw notFound();
    return data;
  },
  component: DetalhesExpedicao,
});

function DetalhesExpedicao() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(slug));
  if (!data) return null;
  const { expedicao, datas } = data;
  const publicSlug = getPublicExpedicaoSlug(expedicao.slug);
  const heroImg = getExpedicaoImage(expedicao.slug);
  const galeria = getExpedicaoGaleria(expedicao.slug);
  const whatsappMsg = `Olá! Gostaria de reservar minha vaga na expedição "${expedicao.nome}".`;
  const whatsappUrl = buildContactWhatsappUrl(whatsappMsg);


  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[80svh] text-areia">
        <img src={heroImg} alt={expedicao.nome} className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/50 to-carvao/30" />
        <div className="container-tight relative flex min-h-[80svh] flex-col justify-end pb-16 pt-32 md:pb-20 md:pt-40">
          <div className="flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.22em] text-areia/80">
            <span>{expedicao.duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{expedicao.nivel}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>A partir de {formatPriceWithBRL(expedicao.preco, expedicao.moeda)} <span className="text-areia/60">por pessoa em acomodação dupla</span></span>
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-5xl text-balance md:text-7xl">{expedicao.nome}</h1>
          <p className="mt-5 max-w-2xl text-lg text-areia/85 text-pretty">{expedicao.descricao_curta}</p>
          {datas.length > 0 && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-cobre px-7 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft"
            >
              <MessageCircle className="h-4 w-4" /> Reservar Agora
            </a>
          )}
        </div>
      </section>

      {/* Vídeo cinematográfico — destaque Serra da Canastra */}
      {expedicao.slug === "serra-da-canastra" && (
        <section className="bg-carvao py-16 md:py-20">
          <div className="container-tight">
            <VideoCinematic
              youtubeId="nPoJeABD5ko"
              poster={heroImg}
              eyebrow="Serra da Canastra · filme da expedição"
              title="Expedições a cavalo na Serra da Canastra. Memórias para a vida toda."
              subtitle="Toque para assistir com som"
            />
          </div>
        </section>
      )}




      {/* Descrição + Inclui */}
      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="eyebrow">A experiência</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">Sobre a expedição</h2>
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-foreground/80 text-pretty">{expedicao.descricao_longa}</p>

            {expedicao.requisitos?.length > 0 && (
              <div className="mt-12">
                <div className="eyebrow">Informações importantes</div>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {expedicao.requisitos.map((r) => (
                    <li key={r} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-cobre" />{r}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
          <aside className="md:col-span-5 space-y-6">
            <div className="rounded-sm border border-border bg-card p-8 shadow-card">
              <div className="eyebrow">O que está incluso</div>
              <ul className="mt-5 space-y-3 text-sm text-foreground/85">
                {expedicao.inclui.map((i) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />{i}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-sm border border-border bg-card p-8 shadow-card">
              <div className="eyebrow">Condições de pagamento</div>
              <div className="mt-4 font-display text-3xl text-cobre">
                A partir de {formatPriceWithBRL(expedicao.preco, expedicao.moeda)}
              </div>
              <ul className="mt-5 space-y-3 text-sm text-foreground/85">
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />À vista no Pix/transferência</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Cartão de crédito em até 6x sem juros, via link de pagamento seguro</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Parcelamento via Pix (consulte nossa equipe para conhecer as opções)</li>
              </ul>
              <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                Valores por pessoa em acomodação dupla.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Roteiro */}
      {expedicao.roteiro?.length > 0 && (
        <section className="bg-secondary/40 py-24 md:py-32">
          <div className="container-tight">
            <div className="max-w-2xl">
              <div className="eyebrow">Roteiro resumido</div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">Como cada dia se desenrola</h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2">
              {expedicao.roteiro.map((d) => (
                <div key={d.dia + d.titulo} className="bg-background p-7">
                  <div className="font-display text-2xl text-cobre">{d.dia}</div>
                  <div className="mt-2 font-display text-xl">{d.titulo}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Galeria */}
      {galeria.length > 0 && (
        <section className="bg-background py-24 md:py-32">
          <div className="container-tight">
            <div className="max-w-2xl">
              <div className="eyebrow">Galeria</div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">A expedição em imagens</h2>
              <p className="mt-4 text-foreground/70 text-pretty">
                Cenas reais das nossas expedições, registradas em campo.
              </p>
            </div>
            <div className="mt-14">
              <GaleriaEditorial fotos={galeria} alt={`Galeria ${expedicao.nome}`} />
            </div>
          </div>
        </section>
      )}


      {/* Próximas datas */}
      <section className="bg-secondary/40 py-24 md:py-32">
        <div className="container-tight">
          <div className="eyebrow">Próximas datas</div>
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Escolha seu período</h2>
          {datas.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Em breve novas datas. Fale conosco para reservar antecipadamente.</p>
          ) : (
            <div className="mt-10 space-y-3">
              {datas.map((d) => (
                <DataCard key={d.id} data={{ ...d, expedicao_nome: expedicao.nome, expedicao_slug: publicSlug }} variant="reservar" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-floresta-deep py-20 text-areia md:py-28">
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-balance md:text-5xl">Pronto para reservar sua vaga?</h2>
          <p className="mx-auto mt-4 max-w-xl text-areia/75">Fale com nossa equipe pelo WhatsApp para alinhar detalhes e confirmar sua vaga.</p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft"
          >
            <MessageCircle className="h-4 w-4" /> Reservar Agora
          </a>
        </div>
      </section>

    </>
  );
}
