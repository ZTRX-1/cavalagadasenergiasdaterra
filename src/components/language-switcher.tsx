import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = [
  { code: "pt", icon: "/uploads/br1.png" },
  { code: "en", icon: "/uploads/en.png" },
  { code: "es", icon: "/uploads/es.png" },
] as const;

type LangCode = (typeof LANGS)[number]["code"];

interface Props {
  className?: string;
  align?: "header" | "drawer";
}

export function LanguageSwitcher({ className, align = "header" }: Props) {
  const { i18n } = useTranslation();
  const current = (LANGS.some(l => l.code === i18n.language) ? i18n.language : "pt") as LangCode;

  const change = (code: LangCode) => {
    if (code !== current) i18n.changeLanguage(code);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 font-eyebrow text-[0.7rem] uppercase tracking-[0.22em]",
        align === "header" ? "text-areia/55" : "text-foreground/60",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {LANGS.map((lang, i) => (
        <span key={lang.code} className="inline-flex items-center gap-2">
          {i > 0 && <span className="opacity-40">·</span>}
          <button
            type="button"
            onClick={() => change(lang.code)}
            className={cn(
              "group relative transition-all duration-300",
              current === lang.code ? "opacity-100 scale-125" : "opacity-40 hover:opacity-100 grayscale hover:grayscale-0",
            )}
            aria-current={current === lang.code ? "true" : undefined}
            aria-label={`Switch language to ${lang.code.toUpperCase()}`}
          >
            <img 
              src={lang.icon} 
              alt={lang.code.toUpperCase()} 
              className={cn(
                "w-10 h-10 object-contain rounded-full border-[1px] transition-all",
                current === lang.code 
                  ? (align === "header" ? "border-areia/40" : "border-cobre/40") 
                  : "border-transparent"
              )}
            />
          </button>
        </span>
      ))}
    </div>
  );
}
