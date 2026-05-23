import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { WHATSAPP_NUMBER, buildContactWhatsappUrl } from "@/lib/whatsapp";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";
import logoCanastra from "@/assets/logo-canastra.jpg";
import logoElas from "@/assets/logo-elas-na-sela.jpg";

export function SiteFooter() {
  return (
    <footer className="bg-carvao text-areia">
      <div className="container-tight py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-4">
              <img src={logoCavalgadas} alt="Cavalgadas Energias da Terra" className="h-14 w-14 rounded-full object-cover ring-1 ring-cobre/40" />
              <div>
                <div className="font-display text-2xl leading-none">Cavalgadas</div>
                <div className="font-eyebrow mt-1 text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">Energias da Terra</div>
              </div>
            </div>
            <p className="mt-6 max-w-md leading-relaxed text-areia/75 text-pretty">
              Expedições imersivas a cavalo pelo Brasil e pelo mundo. Pequenos grupos, guias locais, hospedagens cuidadas — uma forma antiga de prestar atenção ao mundo.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <img src={logoCanastra} alt="Canastra a Cavalo" className="h-12 w-12 rounded-full object-cover ring-1 ring-areia/20" />
              <img src={logoElas} alt="Elas na Sela" className="h-12 w-12 rounded-full object-cover ring-1 ring-areia/20" />
              <span className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-areia/55">Selo de marcas</span>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="eyebrow text-cobre">Navegue</div>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/" className="hover:text-cobre">Início</Link></li>
              <li><Link to="/expedicoes" className="hover:text-cobre">Expedições</Link></li>
              <li><Link to="/datas" className="hover:text-cobre">Próximas datas</Link></li>
              <li><Link to="/contato" className="hover:text-cobre">Contato &amp; FAQ</Link></li>
              <li><Link to="/minha-reserva" className="hover:text-cobre">Minha reserva</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <div className="eyebrow text-cobre">Contato</div>
            <ul className="mt-4 space-y-3 text-sm text-areia/80">
              <li>
                <a href={buildContactWhatsappUrl()} target="_blank" rel="noreferrer" className="hover:text-cobre">
                  WhatsApp +55 11 94162-6907
                </a>
              </li>
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-cobre">
                  <Instagram className="h-4 w-4" /> @cavalgadasenergiadaterra
                </a>
              </li>
              <li className="text-areia/60">Minas Gerais · Brasil</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-areia/10 pt-8 text-xs text-areia/50 md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Cavalgadas Energias da Terra. Todos os direitos reservados.</span>
          <span className="font-mono">{`+${WHATSAPP_NUMBER.slice(0,2)} ${WHATSAPP_NUMBER.slice(2,4)} ${WHATSAPP_NUMBER.slice(4,9)}-${WHATSAPP_NUMBER.slice(9)}`}</span>
        </div>
      </div>
    </footer>
  );
}
