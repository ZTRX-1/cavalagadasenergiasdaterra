import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Plane, MapPin, Info, Car, UserPlus, GlassWater, Bus, Hotel, Clock, Users, BedSingle, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { getExpedicaoBySlug } from "@/lib/expedicoes.functions";
import { getExpedicaoImage, getExpedicaoGaleria, getExpedicaoNarrativa } from "@/lib/expedicao-images";
import { CarrosselNarrativo } from "@/components/carrossel-narrativo";
import { GaleriaEditorial } from "@/components/galeria-editorial";
import { VideoCinematic } from "@/components/video-cinematic";
import { getPublicExpedicaoSlug } from "@/lib/expedicao-slugs";
import { formatDateRange } from "@/lib/format";
import { DataCard } from "@/components/data-card";
import { ExpeditionMetaCard } from "@/components/expedicao-meta-card";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import canastraVideoPoster from "@/assets/fotos/canastra/video-poster.jpg";

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
  const { t } = useTranslation();
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(qo(slug));
  if (!data) return null;
  const { expedicao, datas, assets, capa_url } = data;
  const publicSlug = getPublicExpedicaoSlug(expedicao.slug);
  const heroImg = getExpedicaoImage(expedicao.slug, { capaUrl: capa_url, assets }).replace('/public/uploads/', '/uploads/');
  const galeria = getExpedicaoGaleria(expedicao.slug, assets).map(url => url.replace('/public/uploads/', '/uploads/'));
  const narrativa = getExpedicaoNarrativa(expedicao.slug, assets).map(item => ({ ...item, src: item.src.replace('/public/uploads/', '/uploads/') }));
  const whatsappMsg = `Olá! Gostaria de reservar minha vaga na expedição "${expedicao.nome}".`;
  const whatsappUrl = buildContactWhatsappUrl(whatsappMsg);
  const isJeri = expedicao.slug === "jericoacoara";
  const isElas = expedicao.marca === "elas-na-sela";

  const isMantiqueira4 = expedicao.slug === "mantiqueira-4-dias";
  const isMantiqueira5 = expedicao.slug === "mantiqueira-5-dias";

  // Helper para extrair informações dos requisitos
  const findInRequisitos = (keywords: string[]) => {
    return expedicao.requisitos?.find((r: string) => 
      keywords.some(kw => r.toLowerCase().includes(kw.toLowerCase()))
    );
  };

  const idadeMin = findInRequisitos(["idade mínima", "idade recomendada"]);
  const bebidas = findInRequisitos(["bebidas não incluídas", "bebidas à parte"]);
  const pousada = findInRequisitos(["pousada não incluída", "hospedagem não inclusa"]);
  const deslocamento = findInRequisitos(["deslocamento", "shuttle", "transfer"]);
  const acomodacao = findInRequisitos(["acomodação"]);
  const participantes = findInRequisitos(["participantes"]);
  const nivel = findInRequisitos(["nível de equitação"]);
  const modalidade = findInRequisitos(["modalidade"]);
  const duracao = findInRequisitos(["duração"]);



  return (
    <>
      {/* HERO */}
      <section className="relative text-areia min-h-[78svh] md:min-h-[62svh] lg:min-h-[64svh]">
        <img src={heroImg} alt={expedicao.nome} className={`absolute inset-0 h-full w-full object-cover ${isJeri ? "object-[center_28%]" : ""}`} fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-carvao via-carvao/50 to-carvao/30" />
        <div className="container-tight relative flex flex-col justify-end pb-14 pt-32 min-h-[78svh] md:min-h-[62svh] lg:min-h-[64svh]">
          {isElas && (
            <div className="mb-6 inline-flex w-fit items-center gap-2.5 rounded-full border border-areia/25 bg-carvao/40 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="h-1 w-1 rounded-full bg-cobre-soft" />
              <span className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/85">
                {t("expedicoes.badgeElas")}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia/80">
            <span>{expedicao.duracao}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{expedicao.nivel}</span>
            <span className="h-1 w-1 rounded-full bg-cobre" />
            <span>{expedicao.mensagem_comercial_publica || t("expedicoes.consulteValores")}</span>
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
              <WhatsAppIcon className="h-4 w-4" /> {t("common.reservarAgora")}
            </a>
          )}
        </div>
      </section>

      {/* Carrossel editorial */}
      {narrativa.length > 0 && (
        <section className="bg-background py-16 md:py-20">
          <div className="container-tight mb-10 max-w-2xl md:mb-14">
            <div className="eyebrow">{t("expedicoes.experienciaEyebrow")}</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-balance">
              {t("expedicoes.experienciaTitle")}
            </h2>
            <p className="mt-4 text-foreground/70 text-pretty ">
              {t("expedicoes.experienciaIntro")}
            </p>
          </div>
          <CarrosselNarrativo cenas={narrativa} alt={expedicao.nome} />
        </section>
      )}

      {/* Vídeo cinematográfico */}
      {expedicao.slug === "serra-da-canastra" && (
        <section className="bg-carvao py-16 md:py-20">
          <div className="container-tight">
            <VideoCinematic
              youtubeId="nPoJeABD5ko"
              poster={canastraVideoPoster}
              eyebrow="Serra da Canastra · filme da expedição"
              title="Expedições a cavalo na Serra da Canastra. Memórias para a vida toda."
              subtitle="Toque para assistir com som"
            />
          </div>
        </section>
      )}

      {/* Descrição + Inclui */}
      <section className={`bg-background py-20 md:py-24`}>
        <div className="container-tight grid gap-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="eyebrow">A experiência</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">Sobre a expedição</h2>
            <div className="mt-6 text-[1.1rem] leading-relaxed text-foreground/80 text-pretty space-y-4">
              {expedicao.descricao_longa.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? <p key={idx}>{paragraph.replace(/\\n/g, '')}</p> : null
              ))}
            </div>

            {expedicao.requisitos?.length > 0 && (
              <div className="mt-12">
                <div className="eyebrow">{t("expedicoes.requisitos")}</div>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80 ">
                  {expedicao.requisitos.map((r: string) => (
                    <li key={r} className="flex items-start gap-2"><span className="mt-2 h-1 w-1 rounded-full bg-cobre" />{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <aside className="md:col-span-5 space-y-6">
            <div className="rounded-sm border border-border bg-card p-8 shadow-card">
              <div className="eyebrow">{t("expedicoes.inclui")}</div>
              <ul className="mt-5 space-y-3 text-sm text-foreground/85 ">
                {expedicao.inclui?.map((i: string) => (
                  <li key={i} className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />{i}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-sm border border-border bg-card p-8 shadow-card">
              <div className="eyebrow">Formas de pagamento</div>
              <div className="mt-4 font-display text-3xl text-cobre">
                {expedicao.mensagem_comercial_publica || t("expedicoes.consulteValores")}
              </div>
              <ul className="mt-6 space-y-4 text-sm text-foreground/85 ">
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Pix à vista (transferência)</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Cartão à vista</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Cartão parcelado (juros por conta do cliente)</li>
                <li className="flex items-start gap-3"><Check className="mt-0.5 h-4 w-4 shrink-0 text-cobre" />Pix parcelado mediante consulta</li>
              </ul>
              <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
                {t("expedicoes.entreEmContato")}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Roteiro */}
      {expedicao.roteiro?.length > 0 && (
        <section className={`bg-secondary/40 py-20 md:py-24`}>
          <div className="container-tight">
            <div className="max-w-2xl">
              <div className="eyebrow">{t("expedicoes.roteiro")}</div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">Como cada dia se desenrola</h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-2">
              {expedicao.roteiro.map((d: any) => (
                <div key={d.dia + d.titulo} className="bg-background p-7">
                  <div className="font-display text-2xl text-cobre">{d.dia}</div>
                  <div className="mt-2 font-display text-xl">{d.titulo}</div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground ">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bloco "A Experiência" */}
      {expedicao.observacoes && (
        <section className="bg-background py-20 md:py-24 border-t border-border">
          <div className="container-tight">
            <div className="eyebrow">A Experiência</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl text-balance">
              Uma jornada pela história
            </h2>
            <div className="mt-10 max-w-3xl space-y-4">
              {expedicao.observacoes.split('\n').map((paragraph, idx) => (
                paragraph.trim() ? (
                  <p key={idx} className="text-[1.15rem] leading-relaxed text-foreground/80 text-pretty font-display">
                    {paragraph.replace(/\\n/g, '')}
                  </p>
                ) : null
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Logística */}
      <section className="bg-background py-20 md:py-24">
        <div className="container-tight">
          <div className="max-w-2xl">
            <div className="eyebrow">{t("expedicoes.logistica.titulo")}</div>
            <h2 className="mt-4 font-display text-3xl md:text-4xl">
              Informações importantes
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {expedicao.como_chegar_referencia && (
              <ExpeditionMetaCard
                icon={MapPin}
                label="Cidade de Referência"
                value={expedicao.como_chegar_referencia}
              />
            )}
            {nivel && (
              <ExpeditionMetaCard
                icon={Compass}
                label="Nível de equitação"
                value={nivel.replace(/Nível de equitação: /i, "").trim()}
              />
            )}
            {acomodacao && (
              <ExpeditionMetaCard
                icon={BedSingle}
                label="Acomodação"
                value={acomodacao.replace(/[🛏️]|Acomodação: /g, "").trim()}
              />
            )}
            <ExpeditionMetaCard
              icon={Users}
              label="Participantes"
              value={participantes?.replace(/[👥]|Participantes: /g, "").trim() || "Máximo 10 pessoas"}
            />
            {idadeMin && (
              <ExpeditionMetaCard
                icon={UserPlus}
                label="Idade mínima recomendada"
                value={idadeMin.replace(/[👧👦]|Idade mínima recomendada: /g, "").trim()}
              />
            )}
            {bebidas && (
              <ExpeditionMetaCard
                icon={GlassWater}
                label={t("expedicoes.logistica.bebidas")}
                value="Não incluídas"
              />
            )}
            {deslocamento && (
              <ExpeditionMetaCard
                icon={Bus}
                label={t("expedicoes.logistica.deslocamento")}
                value="Não incluso"
              />
            )}
            {pousada && (
              <ExpeditionMetaCard
                icon={Hotel}
                label={t("expedicoes.logistica.pousada")}
                value="Não incluída"
              />
            )}
          </div>

          <div className="mt-20 border-t border-border pt-20">
            <div className="max-w-2xl">
              <div className="eyebrow">Logística</div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">
                Como Chegar
              </h2>
              <p className="mt-4 text-foreground/70">
                Planeje sua viagem com tranquilidade até o ponto de encontro da expedição.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {expedicao.como_chegar_aeroporto && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cobre">
                    <Plane className="h-5 w-5" />
                    <h3 className="font-display text-xl">Aeroportos mais utilizados</h3>
                  </div>
                  <ul className="space-y-2 text-foreground/80">
                    {expedicao.como_chegar_aeroporto.split('\n').map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="mt-2 h-1 w-1 rounded-full bg-cobre/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expedicao.como_chegar_conteudo && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-cobre">
                    <Bus className="h-5 w-5" />
                    <h3 className="font-display text-xl">Rodoviárias próximas</h3>
                  </div>
                  <div className="whitespace-pre-line text-foreground/80 leading-relaxed">
                    {expedicao.como_chegar_conteudo.replace(/\\n/g, '\n')}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cobre">
                  <Car className="h-5 w-5" />
                  <h3 className="font-display text-xl">Locação de veículos</h3>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  Todos os aeroportos acima possuem locadoras. Recomendamos veículo próprio ou alugado para maior conforto e flexibilidade durante a viagem.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {expedicao.como_chegar_distancias && (
                <div className="rounded-sm border border-border bg-card p-8">
                  <div className="flex items-center gap-2 text-cobre mb-6">
                    <MapPin className="h-5 w-5" />
                    <h3 className="font-display text-xl">Distâncias das principais capitais</h3>
                  </div>
                  <ul className="space-y-3">
                    {expedicao.como_chegar_distancias.split('\n').map((item, idx) => (
                      <li key={idx} className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0">
                        <span className="text-foreground/70">{item.split('—')[0]?.trim()}</span>
                        <span className="font-display text-cobre">{item.split('—')[1]?.trim()}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {expedicao.como_chegar_observacoes && (
                <div className="rounded-sm border border-cobre/20 bg-cobre/5 p-8">
                  <div className="flex items-center gap-2 text-cobre mb-4">
                    <Info className="h-5 w-5" />
                    <h3 className="font-display text-xl">Destino</h3>
                  </div>
                  <p className="whitespace-pre-line text-foreground/90 font-display text-lg leading-relaxed">
                    {expedicao.como_chegar_observacoes.replace(/\\n/g, '\n')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Galeria */}
      {galeria.length > 0 && narrativa.length === 0 && (
        <section className="bg-background py-24 md:py-32">
          <div className="container-tight">
            <div className="max-w-2xl">
              <div className="eyebrow">Galeria</div>
              <h2 className="mt-4 font-display text-3xl md:text-4xl">A expedição em imagens</h2>
              <p className="mt-4 text-foreground/70 text-pretty ">
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
      <section className={`bg-secondary/40 py-20 md:py-24`}>
        <div className="container-tight">
          <div className="eyebrow">{t("expedicoes.proximasDatas")}</div>
          <h2 className="mt-4 font-display text-3xl md:text-4xl">Escolha seu período</h2>
          {datas.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Em breve novas datas. Fale conosco para reservar antecipadamente.</p>
          ) : (
            <div className="mt-10 space-y-3">
              {datas.map((d: any) => (
                <DataCard key={d.id} data={{ ...d, expedicao_nome: expedicao.nome, expedicao_slug: publicSlug }} variant="reservar" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sugestão de Percurso Alternativo (Mantiqueira) */}
      {(isMantiqueira4 || isMantiqueira5) && (
        <section className="bg-background py-16 md:py-20 border-t border-border">
          <div className="container-tight flex flex-col items-center text-center">
            <div className="eyebrow">Outras opções de percurso</div>
            <h2 className="mt-4 font-display text-2xl md:text-3xl max-w-xl">
              {isMantiqueira4 
                ? "Deseja uma experiência mais completa? Conheça nosso percurso de 5 dias na Mantiqueira."
                : "Pouco tempo disponível? Conheça nossa versão compacta de 4 dias na Mantiqueira."
              }
            </h2>
            <Link
              to="/expedicoes/$slug"
              params={{ slug: isMantiqueira4 ? "mantiqueira-5-dias" : "mantiqueira-4-dias" }}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-cobre px-7 py-3 text-sm uppercase tracking-widest text-cobre transition-colors hover:bg-cobre hover:text-areia"
            >
              {isMantiqueira4 ? "Ver percurso de 5 dias" : "Ver percurso de 4 dias"}
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={`bg-floresta-deep py-20 text-areia md:py-24`}>
        <div className="container-tight text-center">
          <h2 className="font-display text-3xl text-balance md:text-5xl">
            {expedicao.slug === "rota-dos-tropeiros-da-canastra" 
              ? "Pronto para percorrer os caminhos dos antigos tropeiros?" 
              : t("expedicoes.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-areia/75 ">
            {expedicao.slug === "rota-dos-tropeiros-da-canastra"
              ? "Uma travessia exclusiva pela Serra da Canastra.\nMáximo de 10 participantes por edição."
              : t("expedicoes.ctaSubtitle")}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobre px-8 py-4 text-sm uppercase tracking-widest text-areia transition-colors hover:bg-cobre-soft"
          >
            <WhatsAppIcon className="h-4 w-4" /> {t("common.reservarAgora")}
          </a>
        </div>
      </section>
    </>
  );
}
