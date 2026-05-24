import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "cet.cookie.consent.v1";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem(KEY)) setShow(true);
      } catch {
        setShow(true);
      }
    }, 900);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const accept = (val: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, val);
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-4 md:px-6 md:pb-6 animate-in slide-in-from-bottom-4 fade-in duration-500"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5 rounded-sm border border-cobre/30 bg-carvao/95 px-5 py-5 text-areia shadow-elegant backdrop-blur-md md:flex-row md:items-center md:gap-6 md:px-7">
        {/* silhueta cavalo */}
        <svg
          aria-hidden
          viewBox="0 0 64 64"
          className="hidden h-12 w-12 shrink-0 text-cobre-soft md:block"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 50c4-2 7-6 8-11 1-7 5-12 12-13 4-1 7 1 9 4 2 3 5 4 9 4l8-4-2 6c-1 3-3 5-6 6l-3 1-1 7c0 3-2 5-5 5h-3l-2-5h-7l-2 5h-3c-3 0-5-2-5-5z" />
          <path d="M44 30c1-2 3-3 5-3" />
          <circle cx="48" cy="29" r="0.8" fill="currentColor" />
        </svg>

        <div className="flex-1 text-sm leading-relaxed text-areia/85">
          <div className="font-eyebrow text-[0.62rem] uppercase tracking-[0.3em] text-cobre-soft">
            Cookies & privacidade
          </div>
          <p className="mt-2 text-pretty">
            Usamos cookies essenciais para o funcionamento do site e análises anônimas para
            entender como você navega. Saiba mais na nossa{" "}
            <Link to="/privacidade" className="text-cobre-soft underline-offset-4 hover:underline">
              política de privacidade
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => accept("essential")}
            className="rounded-full border border-areia/30 px-4 py-2.5 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em] text-areia transition-colors hover:border-cobre hover:text-cobre-soft"
          >
            Apenas essenciais
          </button>
          <button
            type="button"
            onClick={() => accept("all")}
            className="rounded-full bg-cobre px-5 py-2.5 font-eyebrow text-[0.62rem] uppercase tracking-[0.22em] text-areia transition-colors hover:bg-cobre-soft"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
}
