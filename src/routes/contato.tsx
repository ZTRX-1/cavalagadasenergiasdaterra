import { createFileRoute } from "@tanstack/react-router";
import { Instagram, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import cavaloCloseup from "@/assets/cavalo-closeup.jpg";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — Cavalgadas Energias da Terra" },
      { name: "description", content: "Fale conosco, conheça nossa história e tire suas dúvidas sobre as expedições." },
    ],
  }),
  component: ContatoPage,
});


function ContatoPage() {
  const { t } = useTranslation();
  return (
    <>
      <section className="bg-background pb-20 pt-32 md:pb-28 md:pt-40">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="eyebrow">{t("contato.eyebrow")}</div>
            <h1 className="mt-4 font-display text-5xl text-balance md:text-7xl">{t("contato.title")}</h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground text-pretty ">
              {t("contato.intro")}
            </p>
            <div className="mt-10 space-y-4">
              <a href={buildContactWhatsappUrl()} target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-cobre">
                <WhatsAppIcon className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">{t("contato.whatsappLabel")}</div>
                  <div className="text-sm text-muted-foreground">+55 11 94162-6907</div>
                </div>
              </a>
              <a href="https://instagram.com/cavalgadasenergiasdaterra" target="_blank" rel="noreferrer" className="flex items-center gap-4 rounded-sm border border-border bg-card p-5 transition-colors hover:border-cobre">
                <Instagram className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">{t("contato.instagramLabel")}</div>
                  <div className="text-sm text-muted-foreground">@cavalgadasenergiasdaterra</div>
                </div>
              </a>
              <div className="flex items-center gap-4 rounded-sm border border-border bg-card p-5">
                <MapPin className="h-6 w-6 text-cobre" />
                <div>
                  <div className="font-display text-lg">{t("contato.baseLabel")}</div>
                  <div className="text-sm text-muted-foreground">{t("contato.baseValor")}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:col-span-5">
            <img src={cavaloCloseup} alt="Cavalo de uma das nossas expedições" className="aspect-[4/5] w-full rounded-sm object-cover" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="bg-floresta-deep py-24 text-areia md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow text-cobre-soft">{t("contato.quemSomosEyebrow")}</div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">{t("contato.quemSomosTitle")}</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-lg leading-relaxed text-areia/85 text-pretty ">
            <p>
              A Cavalgadas Energias da Terra foi criada por quem vive o universo equestre todos os dias. Somos criadores de cavalos, anfitriões e especialistas em expedições a cavalo.
            </p>
            <p>
              Cada roteiro é cuidadosamente planejado para unir natureza, cultura, gastronomia e hospitalidade em experiências autênticas e memoráveis.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background py-24 md:py-32">
        <div className="container-tight grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="eyebrow">{t("contato.diferencialEyebrow")}</div>
            <h2 className="mt-4 font-display text-4xl text-balance md:text-5xl">{t("contato.diferencialTitle")}</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-lg leading-relaxed text-foreground/80 text-pretty ">
            <p>
              Criamos experiências equestres para pequenos grupos, acompanhando pessoalmente cada etapa da jornada e cuidando de cada detalhe para que nossos clientes possam simplesmente viver o momento.
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
    </>
  );
}
