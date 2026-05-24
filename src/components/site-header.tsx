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
    { to: "/quem-somos", label: t("nav.quemSomos") },
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
        <div className="mx-auto flex h-16 max-w-[110rem] items-center justify-between gap-10 px-5 md:h-[5.5rem] md:px-10 xl:gap-16 xl:px-16 2xl:px-20">
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-3.5"
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

          <nav className="hidden flex-1 items-center justify-center gap-8 xl:flex xl:gap-10 2xl:gap-14">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-eyebrow text-[0.82rem] uppercase tracking-[0.22em] text-areia/85 transition-colors hover:text-cobre-soft whitespace-nowrap antialiased"
                activeProps={{ className: "text-cobre-soft" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-6 xl:gap-8">
            <LanguageSwitcher className="hidden md:inline-flex" />
            <Link
              to="/expedicoes"
              className="hidden rounded-full bg-cobre px-10 py-4 font-eyebrow text-[0.78rem] uppercase tracking-[0.24em] text-areia shadow-elegant transition-colors hover:bg-couro xl:inline-flex whitespace-nowrap"
            >
              {t("nav.reservar")}
            </Link>

            <button
              type="button"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-areia/30 bg-carvao text-areia transition-colors hover:border-cobre hover:text-cobre-soft xl:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

      </header>

      <div
        className={cn(
          "fixed inset-0 z-40 xl:hidden",
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
          <div className="h-16 md:h-[5.5rem]" />
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
