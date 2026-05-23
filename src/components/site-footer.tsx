import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { WHATSAPP_NUMBER, buildContactWhatsappUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="bg-carvao text-areia">
      <div className="container-tight py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="font-display text-2xl">Cavalgadas</div>
            <div className="eyebrow mt-1">Energias da Terra</div>
            <p className="mt-6 max-w-md text-areia/70 text-pretty leading-relaxed">
              Expedições a cavalo cuidadosamente desenhadas para quem busca
              natureza com profundidade, silêncio com sofisticação e aventura
              com requinte.
            </p>
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
