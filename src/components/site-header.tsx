import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/expedicoes", label: "Expedições" },
  { to: "/datas", label: "Próximas Datas" },
  { to: "/contato", label: "Contato" },
  { to: "/minha-reserva", label: "Minha Reserva" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled || open
          ? "bg-background/95 backdrop-blur-md border-b border-border/60"
          : "bg-transparent",
      )}
    >
      <div className="container-tight flex h-16 items-center justify-between md:h-20">
        <Link
          to="/"
          className={cn(
            "font-display text-lg tracking-tight transition-colors md:text-xl",
            scrolled || open ? "text-foreground" : "text-areia",
          )}
          onClick={() => setOpen(false)}
        >
          <span className="block leading-none">Cavalgadas</span>
          <span className="block text-[0.62rem] font-sans uppercase tracking-[0.32em] text-cobre">
            Energias da Terra
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "text-sm font-medium tracking-wide transition-colors hover:text-cobre",
                scrolled ? "text-foreground" : "text-areia/90",
              )}
              activeProps={{ className: "text-cobre" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
            scrolled || open
              ? "border-border text-foreground"
              : "border-areia/30 text-areia",
          )}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "md:hidden overflow-hidden bg-background transition-[max-height,opacity] duration-500",
          open ? "max-h-[80vh] opacity-100 border-t border-border" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container-tight flex flex-col gap-1 py-6">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="font-display text-2xl py-3 border-b border-border/40 text-foreground hover:text-cobre transition-colors"
              activeProps={{ className: "text-cobre" }}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/expedicoes"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-cobre px-6 py-3 text-sm font-medium uppercase tracking-widest text-areia"
          >
            Ver Expedições
          </Link>
        </nav>
      </div>
    </header>
  );
}
