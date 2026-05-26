import { useEffect, useState } from "react";
import { Accessibility, X, Type, Contrast, Hand, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

type Prefs = {
  fontScale: number; // 1 | 1.15 | 1.3
  highContrast: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "cet:a11y-prefs";
const DEFAULTS: Prefs = { fontScale: 1, highContrast: false, reduceMotion: false };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  root.style.setProperty("--a11y-font-scale", String(p.fontScale));
  root.classList.toggle("a11y-high-contrast", p.highContrast);
  root.classList.toggle("a11y-reduce-motion", p.reduceMotion);
}

function triggerVLibras() {
  const btn = document.querySelector("[vw-access-button]") as HTMLElement | null;
  if (btn) btn.click();
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  // Hidratação das prefs salvas
  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyPrefs(p);
  }, []);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignora
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const fontOptions = [
    { value: 1, label: "A" },
    { value: 1.15, label: "A+" },
    { value: 1.3, label: "A++" },
  ];

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar opções de acessibilidade" : "Abrir opções de acessibilidade"}
        aria-expanded={open}
        aria-controls="a11y-panel"
        className={cn(
          "fixed z-40 inline-flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-cobre via-couro to-cobre-soft text-areia",
          "ring-1 ring-areia/30 shadow-elegant",
          "transition-transform duration-300 hover:scale-105 hover:ring-areia/60",
          "bottom-24 right-5 h-12 w-12 md:bottom-28 md:right-8 md:h-14 md:w-14",
        )}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-cobre/30 opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-90" aria-hidden />
        <Accessibility className="relative h-6 w-6 md:h-7 md:w-7" aria-hidden />
      </button>

      {/* Painel */}
      <div
        id="a11y-panel"
        role="dialog"
        aria-modal="false"
        aria-label="Opções de acessibilidade"
        className={cn(
          "fixed z-40 origin-bottom-right transition-all duration-300",
          "bottom-40 right-5 w-[19rem] md:bottom-44 md:right-8 md:w-[21rem]",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0",
        )}
      >
        <div className="overflow-hidden rounded-sm border border-cobre/30 bg-carvao text-areia shadow-elegant">
          <div className="flex items-center justify-between border-b border-areia/10 bg-floresta-deep px-5 py-4">
            <div>
              <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">
                Acessibilidade
              </div>
              <div className="mt-1 font-display text-lg leading-none">Sua experiência, seu jeito</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar painel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-areia/20 text-areia transition-colors hover:border-cobre hover:text-cobre-soft"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-5 px-5 py-5">
            {/* Tamanho da fonte */}
            <div>
              <div className="mb-2 flex items-center gap-2 font-eyebrow text-[0.65rem] uppercase tracking-[0.24em] text-areia/70">
                <Type className="h-3.5 w-3.5 text-cobre-soft" aria-hidden />
                Tamanho do texto
              </div>
              <div role="radiogroup" aria-label="Tamanho do texto" className="grid grid-cols-3 gap-2">
                {fontOptions.map((opt) => {
                  const active = prefs.fontScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setPrefs((p) => ({ ...p, fontScale: opt.value }))}
                      className={cn(
                        "rounded-sm border px-3 py-2 font-display transition-colors",
                        active
                          ? "border-cobre bg-cobre/15 text-areia"
                          : "border-areia/15 text-areia/80 hover:border-cobre/50 hover:text-areia",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alto contraste */}
            <ToggleRow
              icon={<Contrast className="h-3.5 w-3.5 text-cobre-soft" aria-hidden />}
              label="Alto contraste"
              checked={prefs.highContrast}
              onChange={(v) => setPrefs((p) => ({ ...p, highContrast: v }))}
            />

            {/* Reduzir animações */}
            <ToggleRow
              icon={<Pause className="h-3.5 w-3.5 text-cobre-soft" aria-hidden />}
              label="Reduzir animações"
              checked={prefs.reduceMotion}
              onChange={(v) => setPrefs((p) => ({ ...p, reduceMotion: v }))}
            />

            {/* VLibras */}
            <button
              type="button"
              onClick={() => {
                triggerVLibras();
                setOpen(false);
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-sm border border-cobre/30 bg-cobre/10 px-4 py-3 text-left transition-colors hover:border-cobre hover:bg-cobre/20"
            >
              <span className="flex items-center gap-3">
                <Hand className="h-4 w-4 text-cobre-soft" aria-hidden />
                <span>
                  <span className="block font-display text-base leading-none">VLibras</span>
                  <span className="mt-1 block font-eyebrow text-[0.6rem] uppercase tracking-[0.22em] text-areia/60">
                    Tradutor para Libras
                  </span>
                </span>
              </span>
              <span className="font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-cobre-soft transition-transform group-hover:translate-x-1">
                Ativar →
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrefs(DEFAULTS);
              }}
              className="w-full pt-1 text-center font-eyebrow text-[0.6rem] uppercase tracking-[0.22em] text-areia/50 transition-colors hover:text-cobre-soft"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-sm border border-areia/10 bg-carvao px-3 py-3 text-left transition-colors hover:border-cobre/50"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-display text-sm text-areia">{label}</span>
      </span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-cobre" : "bg-areia/15",
        )}
      >
        <span
          className={cn(
            "absolute h-4 w-4 rounded-full bg-areia shadow transition-transform",
            checked ? "translate-x-[1.15rem]" : "translate-x-[0.15rem]",
          )}
        />
      </span>
    </button>
  );
}
