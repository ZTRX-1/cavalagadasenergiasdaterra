import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";

const NAV = [
  { to: "/expedicoes", label: "Expedições" },
  { to: "/datas", label: "Próximas Datas" },
  { to: "/contato", label: "Quem Somos · FAQ" },
  { to: "/minha-reserva", label: "Minha Reserva" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Fecha drawer ao trocar de rota
  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-shadow duration-300",
          "bg-background/92 backdrop-blur-md border-b border-border/60",
          scrolled && "shadow-header",
        )}
      >
        <div className="container-tight flex h-16 items-center justify-between md:h-20">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="Cavalgadas Energias da Terra — início"
          >
            {/* Marca tipográfica refinada — pronta para receber logo oficial */}
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cobre/40 bg-floresta-deep/5 transition-colors group-hover:border-cobre md:h-11 md:w-11">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-cobre md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 17c2-1 3-3 3-5 0-2 1-3 3-3l2-1 2 2 3-1c2 0 3 1 4 3-1 1-2 3-2 5" />
                <path d="M6 17l-1 3M11 17l-1 3M14 17l1 3M19 17l1 3" />
                <path d="M9 8l-1-2M11 7V5" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.05rem] tracking-tight text-foreground md:text-xl">
                Cavalgadas
              </span>
              <span className="mt-0.5 font-eyebrow text-[0.55rem] uppercase tracking-[0.32em] text-cobre">
                Energias da Terra
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-foreground/80 transition-colors hover:text-cobre"
                activeProps={{ className: "text-cobre" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/expedicoes"
              className="hidden rounded-full bg-cobre px-5 py-2.5 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia transition-colors hover:bg-couro lg:inline-flex"
            >
              Reservar
            </Link>

            {/* Mobile toggle */}
            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-cobre hover:text-cobre lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — slide do topo, full-bleed */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        {/* overlay */}
        <button
          tabIndex={-1}
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className={cn(
            "absolute inset-0 bg-carvao/60 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
        {/* painel */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 bg-background border-b border-border shadow-elegant transition-transform duration-500 ease-out",
            open ? "translate-y-0" : "-translate-y-full",
          )}
        >
          <div className="h-16 md:h-20" />
          <nav className="container-tight flex flex-col gap-1 pb-8 pt-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-border/50 py-4 font-display text-2xl text-foreground transition-colors hover:text-cobre"
                activeProps={{ className: "text-cobre" }}
              >
                <span>{item.label}</span>
                <span className="font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-cobre">→</span>
              </Link>
            ))}

            <Link
              to="/expedicoes"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-cobre px-6 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-areia"
            >
              Fazer pré-reserva
            </Link>
            <a
              href={buildContactWhatsappUrl()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-foreground hover:border-cobre hover:text-cobre"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
