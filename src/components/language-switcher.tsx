import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGS = ["pt", "en", "es"] as const;
type Lang = (typeof LANGS)[number];

interface Props {
  className?: string;
  align?: "header" | "drawer";
}

export function LanguageSwitcher({ className, align = "header" }: Props) {
  const { i18n } = useTranslation();
  const current = (LANGS.includes(i18n.language as Lang) ? i18n.language : "pt") as Lang;

  const change = (lng: Lang) => {
    if (lng !== current) i18n.changeLanguage(lng);
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
      {LANGS.map((lng, i) => (
        <span key={lng} className="inline-flex items-center gap-2">
          {i > 0 && <span className="opacity-40">·</span>}
          <button
            type="button"
            onClick={() => change(lng)}
            className={cn(
              "transition-colors hover:text-cobre-soft",
              current === lng &&
                (align === "header" ? "text-cobre-soft" : "text-cobre"),
            )}
            aria-current={current === lng ? "true" : undefined}
            aria-label={`Switch language to ${lng.toUpperCase()}`}
          >
            {lng.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
