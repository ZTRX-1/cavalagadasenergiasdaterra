import { Link } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { WHATSAPP_NUMBER, buildContactWhatsappUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="bg-carvao text-areia">
      <div className="container-tight py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-cobre/50">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-cobre" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 17c2-1 3-3 3-5 0-2 1-3 3-3l2-1 2 2 3-1c2 0 3 1 4 3-1 1-2 3-2 5" />
                  <path d="M6 17l-1 3M11 17l-1 3M14 17l1 3M19 17l1 3" />
                  <path d="M9 8l-1-2M11 7V5" />
                </svg>
              </span>
              <div>
                <div className="font-display text-2xl leading-none">Cavalgadas</div>
                <div className="font-eyebrow mt-1 text-[0.6rem] uppercase tracking-[0.32em] text-cobre">Energias da Terra</div>
              </div>
            </div>
            <p className="mt-6 max-w-md leading-relaxed text-areia/70 text-pretty">
              Produzimos expedições a cavalo pelo Brasil profundo. Pequenos grupos,
              guias locais, hospedagens cuidadas — uma forma antiga de prestar
              atenção ao mundo.
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
