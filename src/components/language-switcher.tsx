import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" }
] as const;

type Lang = (typeof LANGS)[number]["code"];

interface Props {
  className?: string;
  align?: "header" | "drawer";
}

export function LanguageSwitcher({ className, align = "header" }: Props) {
  const { i18n } = useTranslation();
  const currentCode = i18n.language.split("-")[0] as Lang;
  const current = (LANGS.some(l => l.code === currentCode) ? currentCode : "pt") as Lang;

  const change = (lng: Lang) => {
    if (lng !== current) i18n.changeLanguage(lng);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {LANGS.map((lng) => (
        <button
          key={lng.code}
          type="button"
          onClick={() => change(lng.code)}
          className={cn(
            "text-base transition-all hover:scale-110 grayscale-[0.3] hover:grayscale-0",
            current === lng.code ? "grayscale-0 scale-105 opacity-100" : "opacity-40"
          )}
          aria-current={current === lng.code ? "true" : undefined}
          aria-label={`Switch language to ${lng.label}`}
        >
          {lng.flag}
        </button>
      ))}
    </div>
  );
}
