import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { buildContactWhatsappUrl } from "@/lib/whatsapp";
import { LanguageSwitcher } from "@/components/language-switcher";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  const NAV = [
    { to: "/", label: t("nav.home") },
    { to: "/expedicoes", label: t("nav.expedicoes") },
    { to: "/datas", label: t("nav.datas") },
    { to: "/contato", label: t("nav.contato") },
    { to: "/minha-reserva", label: t("nav.minhaReserva") },
  ] as const;

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

  useEffect(() => { setOpen(false); }, [path]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-shadow duration-300",
          "bg-carvao/95 backdrop-blur-md border-b border-areia/10",
          scrolled && "shadow-header",
        )}
      >
        <div className="container-tight flex h-16 items-center justify-between md:h-20">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="Cavalgadas Energias da Terra"
          >
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-carvao ring-1 ring-cobre/40 md:h-12 md:w-12">
              <img src={logoCavalgadas} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.05rem] tracking-tight text-areia md:text-xl">
                Cavalgadas
              </span>
              <span className="mt-0.5 font-eyebrow text-[0.55rem] uppercase tracking-[0.32em] text-cobre-soft">
                Energias da Terra
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 xl:gap-10 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-eyebrow text-[0.78rem] uppercase tracking-[0.2em] text-areia/85 transition-colors hover:text-cobre-soft whitespace-nowrap"
                activeProps={{ className: "text-cobre-soft" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link
              to="/expedicoes"
              className="hidden rounded-full bg-cobre px-5 py-2.5 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em] text-areia transition-colors hover:bg-couro lg:inline-flex"
            >
              {t("nav.reservar")}
            </Link>

            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-areia/30 bg-carvao text-areia transition-colors hover:border-cobre hover:text-cobre-soft lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          tabIndex={-1}
          onClick={() => setOpen(false)}
          aria-label="Fechar"
          className={cn(
            "absolute inset-0 bg-carvao/60 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        />
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
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="group flex items-center justify-between border-b border-border/50 py-4 font-display text-2xl text-foreground transition-colors hover:text-cobre"
                activeProps={{ className: "text-cobre" }}
              >
                <span>{item.label}</span>
                <span className="font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors group-hover:text-cobre">→</span>
              </Link>
            ))}

            <div className="mt-6 flex items-center justify-center border-t border-border/50 pt-6">
              <LanguageSwitcher align="drawer" />
            </div>

            <Link
              to="/expedicoes"
              onClick={() => setOpen(false)}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-cobre px-6 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-areia"
            >
              {t("nav.preReserva")}
            </Link>
            <a
              href={buildContactWhatsappUrl()}
              target="_blank"
              rel="noreferrer"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-4 font-eyebrow text-[0.72rem] uppercase tracking-[0.22em] text-foreground hover:border-cobre hover:text-cobre"
            >
              <MessageCircle className="h-4 w-4" /> {t("nav.whatsapp")}
            </a>
          </nav>
        </div>
      </div>
    </>
  );
}
