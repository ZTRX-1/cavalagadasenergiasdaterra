import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "pt", label: "Português", img: "/uploads/br.png" },
  { code: "en", label: "English", img: "/uploads/en.png" },
  { code: "es", label: "Español", img: "/uploads/es.png" }
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
            "w-6 h-6 rounded-full overflow-hidden transition-all hover:scale-110 grayscale-[0.3] hover:grayscale-0",
            current === lng.code ? "grayscale-0 scale-105 opacity-100 ring-1 ring-primary/20" : "opacity-40"
          )}
          aria-current={current === lng.code ? "true" : undefined}
          aria-label={`Switch language to ${lng.label}`}
        >
          <img 
            src={lng.img} 
            alt={lng.label} 
            className="w-full h-full object-cover"
          />
        </button>
      ))}
    </div>
  );
}
