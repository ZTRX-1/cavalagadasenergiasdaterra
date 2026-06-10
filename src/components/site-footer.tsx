import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Instagram, Mail, Phone } from "lucide-react";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import logoCanastra from "@/assets/logo-canastra.jpg";
import logoElas from "@/assets/logo-elas-na-sela.jpg";

const INSTAGRAMS = [
  { handle: "@cavalgadasenergiasdaterra", url: "https://instagram.com/cavalgadasenergiasdaterra" },
  { handle: "@elasnasela", url: "https://instagram.com/elasnasela" },
  { handle: "@canastraacavalo", url: "https://instagram.com/canastraacavalo" },
];

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="bg-carvao text-areia">
      <div className="container-tight py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-4">
              <img src={logoCavalgadas} alt="Cavalgadas Energias da Terra" loading="lazy" className="h-14 w-14 rounded-full object-cover ring-1 ring-cobre/40" />
              <div>
                <div className="font-display text-2xl leading-none">Cavalgadas</div>
                <div className="font-eyebrow mt-1 text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">Energias da Terra</div>
              </div>
            </div>
            <p className="mt-6 max-w-md leading-relaxed text-areia/85 text-pretty font-sans font-light">
              {t("footer.tagline")}
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link to="/marcas/canastra-a-cavalo"><img src={logoCanastra} alt="Canastra a Cavalo" loading="lazy" className="h-12 w-12 rounded-full object-cover ring-1 ring-areia/20 transition-all hover:ring-cobre" /></Link>
              <Link to="/marcas/elas-na-sela"><img src={logoElas} alt="Elas na Sela" loading="lazy" className="h-12 w-12 rounded-full object-cover ring-1 ring-areia/20 transition-all hover:ring-cobre" /></Link>
              <span className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/60">{t("footer.marcas")}</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="eyebrow text-cobre-soft">{t("footer.navegue")}</div>
            <ul className="mt-5 space-y-3 text-[0.95rem]">
              <li><Link to="/" className="text-areia/85 hover:text-cobre">{t("nav.home")}</Link></li>
              <li><Link to="/expedicoes" className="text-areia/85 hover:text-cobre">{t("nav.expedicoes")}</Link></li>
              <li><Link to="/datas" className="text-areia/85 hover:text-cobre">{t("nav.datas")}</Link></li>
              <li><Link to="/quem-somos" className="text-areia/85 hover:text-cobre">{t("nav.quemSomos")}</Link></li>
              <li><Link to="/contato" className="text-areia/85 hover:text-cobre">{t("nav.contato")}</Link></li>
            </ul>
          </div>


          <div className="md:col-span-4">
            <div className="eyebrow text-cobre-soft">{t("footer.contato")}</div>
            <ul className="mt-5 space-y-3 text-[0.95rem] text-areia/85">
              <li>
                <a href={buildContactWhatsappUrl()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cobre">
                  <Phone className="h-4 w-4 text-cobre-soft" /> <span>(11) 94162-6907</span>
                </a>
              </li>
              <li>
                <a href="mailto:contato@cavalgadasenergiasdaterra.com.br" className="inline-flex items-center gap-2 hover:text-cobre">
                  <Mail className="h-4 w-4 text-cobre-soft" /> <span>contato@cavalgadasenergiasdaterra.com.br</span>
                </a>
              </li>
              <li className="pt-2">
                <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/60 mb-2">Instagram</div>
                <ul className="space-y-2">
                  {INSTAGRAMS.map((i) => (
                    <li key={i.handle}>
                      <a href={i.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cobre">
                        <Instagram className="h-4 w-4 text-cobre-soft" /> <span>{i.handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="text-areia/65 pt-1">
                <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/60 mb-1">Base de Operações</div>
                Serra da Mantiqueira — Maria da Fé, MG
              </li>

            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-areia/10 pt-8 text-xs text-areia/65 md:flex-row md:items-center">
          <div className="space-y-1">
            <div>© 2025–Presente | Cavalgadas Energias da Terra. {t("footer.rights")}</div>
            <div className="text-areia/55">CNPJ 60.252.479/0001-85</div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/privacidade" className="text-areia/70 hover:text-cobre">Privacidade</Link>
            <Link to="/termos" className="text-areia/70 hover:text-cobre">Termos de Uso</Link>
            <Link to="/regras" className="text-areia/70 hover:text-cobre">Regras</Link>
            <Link to="/admin/login" className="text-areia/70 hover:text-cobre border-l border-areia/20 pl-5">Área Restrita</Link>
          </div>
          <div className="text-areia/55">
            {t("footer.feitoPor")}{" "}
            <a href="https://vexxoncompany.com/" target="_blank" rel="noreferrer" className="text-areia/80 hover:text-cobre">
              Vexxon Company
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
