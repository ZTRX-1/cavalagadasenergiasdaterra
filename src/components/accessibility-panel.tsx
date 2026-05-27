import { useEffect, useRef, useState } from "react";
import {
  X,
  Type,
  Contrast,
  Hand,
  Pause,
  Volume2,
  VolumeX,
  MousePointer2,
} from "lucide-react";
import { AccessibilityGlyph } from "@/components/icons/accessibility-glyph";
import { cn } from "@/lib/utils";

type Prefs = {
  fontScale: number; // 1 | 1.15 | 1.3
  highContrast: boolean;
  reduceMotion: boolean;
  hoverRead: boolean;
};

const STORAGE_KEY = "cet:a11y-prefs";
const DEFAULTS: Prefs = {
  fontScale: 1,
  highContrast: false,
  reduceMotion: false,
  hoverRead: false,
};

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

function triggerVLibras(retries = 8) {
  const btn = document.querySelector("[vw-access-button]") as HTMLElement | null;
  if (btn) {
    btn.click();
    return;
  }
  if (retries > 0) {
    window.setTimeout(() => triggerVLibras(retries - 1), 350);
  }
}

// ============ Narração / TTS nativa do navegador ============
function pickPtVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /pt[-_]BR/i.test(v.lang)) ||
    voices.find((v) => /^pt/i.test(v.lang)) ||
    voices[0] ||
    null
  );
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/\s+/g, " ").trim().slice(0, 4500);
  if (!clean) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "pt-BR";
  utter.rate = 1;
  utter.pitch = 1;
  const v = pickPtVoice();
  if (v) utter.voice = v;
  window.speechSynthesis.speak(utter);
}

function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getMainText(): string {
  const main = document.getElementById("main-content");
  if (!main) return document.body.innerText || "";
  return main.innerText || "";
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [speaking, setSpeaking] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hoverHandlerRef = useRef<((e: Event) => void) | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  // Hidratação das prefs salvas
  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    applyPrefs(p);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        /* noop */
      };
    }
  }, []);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignora
    }
  }, [prefs]);

  // ESC fecha + trava scroll do body quando aberto (bottom sheet no mobile)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (window.matchMedia("(max-width: 767px)").matches) {
      document.body.style.overflow = "hidden";
    }
    // foco para o título do painel
    const t = window.setTimeout(() => titleRef.current?.focus(), 80);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  // Retorna foco ao FAB ao fechar
  useEffect(() => {
    if (!open) {
      // pequeno delay para evitar foco durante animação inicial
      const t = window.setTimeout(() => fabRef.current?.focus({ preventScroll: true }), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Monitora estado de fala
  useEffect(() => {
    const id = window.setInterval(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        setSpeaking(window.speechSynthesis.speaking);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  // Modo "ler ao passar o mouse / focar"
  useEffect(() => {
    if (!prefs.hoverRead) {
      if (hoverHandlerRef.current) {
        document.removeEventListener("mouseover", hoverHandlerRef.current, true);
        document.removeEventListener("focusin", hoverHandlerRef.current, true);
        hoverHandlerRef.current = null;
      }
      return;
    }

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("#a11y-panel") || target.closest("[data-a11y-fab]")) return;
      const text =
        target.getAttribute("aria-label") ||
        target.getAttribute("alt") ||
        (target as HTMLElement).innerText ||
        "";
      const clean = text.replace(/\s+/g, " ").trim();
      if (clean.length < 2 || clean.length > 600) return;
      speak(clean);
    };

    hoverHandlerRef.current = handler;
    document.addEventListener("mouseover", handler, true);
    document.addEventListener("focusin", handler, true);
    return () => {
      document.removeEventListener("mouseover", handler, true);
      document.removeEventListener("focusin", handler, true);
    };
  }, [prefs.hoverRead]);

  useEffect(() => () => stopSpeaking(), []);

  // anúncio aria-live
  const announce = (msg: string) => {
    setAnnouncement("");
    window.setTimeout(() => setAnnouncement(msg), 30);
  };

  const setFontScale = (value: number, label: string) => {
    setPrefs((p) => ({ ...p, fontScale: value }));
    announce(`Tamanho do texto: ${label}`);
  };

  const togglePref = (key: keyof Prefs, label: string) => {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] } as Prefs;
      announce(`${label}: ${next[key] ? "ativado" : "desativado"}`);
      return next;
    });
  };

  const fontOptions = [
    { value: 1, label: "Normal" },
    { value: 1.15, label: "Maior" },
    { value: 1.3, label: "Grande" },
  ];

  return (
    <>
      {/* Botão flutuante */}
      <button
        ref={fabRef}
        type="button"
        data-a11y-fab
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar opções de acessibilidade" : "Abrir opções de acessibilidade"}
        aria-expanded={open}
        aria-controls="a11y-panel"
        style={{
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
          right: "max(1.25rem, env(safe-area-inset-right))",
        }}
        className={cn(
          "group fixed z-[70] inline-flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-cobre via-couro to-cobre-soft text-areia",
          "ring-2 ring-areia/40 shadow-elegant",
          "transition-transform duration-300 hover:scale-105 hover:ring-areia/70",
          "h-14 w-14 md:h-14 md:w-14",
          open && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto",
        )}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-cobre/40 opacity-70 blur-md transition-opacity duration-500 group-hover:opacity-100 motion-safe:animate-pulse"
          aria-hidden
        />
        <AccessibilityGlyph className="relative h-7 w-7" />
      </button>

      {/* Backdrop (apenas mobile) */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-[65] bg-carvao/70 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Painel: bottom sheet no mobile, card flutuante no desktop */}
      <div
        id="a11y-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-panel-title"
        className={cn(
          "fixed z-[70] transition-all duration-300",
          // mobile: bottom sheet
          "inset-x-0 bottom-0 origin-bottom",
          // desktop: card flutuante
          "md:inset-x-auto md:bottom-28 md:right-8 md:w-[22rem] md:origin-bottom-right",
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-6 md:translate-y-2 md:scale-95 opacity-0",
        )}
      >
        <div
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          className={cn(
            "overflow-hidden border border-cobre/30 bg-carvao text-areia shadow-elegant",
            "rounded-t-2xl md:rounded-sm",
          )}
        >
          {/* drag handle visual (mobile) */}
          <div className="flex justify-center pt-2 md:hidden" aria-hidden>
            <span className="h-1.5 w-12 rounded-full bg-areia/25" />
          </div>

          <div className="flex items-center justify-between border-b border-areia/10 bg-floresta-deep px-5 py-4">
            <div>
              <div className="font-eyebrow text-[0.6rem] uppercase tracking-[0.32em] text-cobre-soft">
                Acessibilidade
              </div>
              <h2
                ref={titleRef}
                tabIndex={-1}
                id="a11y-panel-title"
                className="mt-1 font-display text-lg leading-tight outline-none"
              >
                Sua experiência, seu jeito
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar painel de acessibilidade"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-areia/20 text-areia transition-colors hover:border-cobre hover:text-cobre-soft"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div
            className={cn(
              "space-y-6 px-5 py-5 overflow-y-auto",
              "max-h-[75dvh] md:max-h-[min(70vh,40rem)]",
            )}
          >
            {/* Narração */}
            <section aria-labelledby="a11y-sec-narracao" className="space-y-3">
              <h3
                id="a11y-sec-narracao"
                className="flex items-center gap-2 font-eyebrow text-[0.7rem] uppercase tracking-[0.24em] text-areia/70"
              >
                <Volume2 className="h-4 w-4 text-cobre-soft" aria-hidden />
                Narração
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    speak(getMainText());
                    announce("Leitura da página iniciada");
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-cobre/40 bg-cobre/15 px-3 py-3 font-display text-base text-areia transition-colors hover:border-cobre hover:bg-cobre/25"
                >
                  <Volume2 className="h-5 w-5" aria-hidden /> Ler página
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    announce("Leitura interrompida");
                  }}
                  disabled={!speaking}
                  className={cn(
                    "inline-flex min-h-12 items-center justify-center gap-2 rounded-md border px-3 py-3 font-display text-base transition-colors",
                    speaking
                      ? "border-areia/30 text-areia hover:border-cobre hover:text-cobre-soft"
                      : "border-areia/10 text-areia/40",
                  )}
                >
                  <VolumeX className="h-5 w-5" aria-hidden /> Parar
                </button>
              </div>

              <ToggleRow
                icon={<MousePointer2 className="h-4 w-4 text-cobre-soft" aria-hidden />}
                label="Ler ao tocar ou focar"
                checked={prefs.hoverRead}
                onChange={() => togglePref("hoverRead", "Ler ao tocar ou focar")}
              />
            </section>

            {/* Leitura */}
            <section aria-labelledby="a11y-sec-leitura" className="space-y-3">
              <h3
                id="a11y-sec-leitura"
                className="flex items-center gap-2 font-eyebrow text-[0.7rem] uppercase tracking-[0.24em] text-areia/70"
              >
                <Type className="h-4 w-4 text-cobre-soft" aria-hidden />
                Leitura
              </h3>

              <div role="radiogroup" aria-label="Tamanho do texto" className="grid grid-cols-3 gap-2">
                {fontOptions.map((opt) => {
                  const active = prefs.fontScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFontScale(opt.value, opt.label)}
                      className={cn(
                        "min-h-12 rounded-md border px-2 py-2 font-display text-sm transition-colors",
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

              <ToggleRow
                icon={<Contrast className="h-4 w-4 text-cobre-soft" aria-hidden />}
                label="Alto contraste"
                checked={prefs.highContrast}
                onChange={() => togglePref("highContrast", "Alto contraste")}
              />
            </section>

            {/* Movimento e Libras */}
            <section aria-labelledby="a11y-sec-movimento" className="space-y-3">
              <h3
                id="a11y-sec-movimento"
                className="flex items-center gap-2 font-eyebrow text-[0.7rem] uppercase tracking-[0.24em] text-areia/70"
              >
                <Pause className="h-4 w-4 text-cobre-soft" aria-hidden />
                Movimento e Libras
              </h3>

              <ToggleRow
                icon={<Pause className="h-4 w-4 text-cobre-soft" aria-hidden />}
                label="Reduzir animações"
                checked={prefs.reduceMotion}
                onChange={() => togglePref("reduceMotion", "Reduzir animações")}
              />

              <button
                type="button"
                onClick={() => {
                  triggerVLibras();
                  announce("VLibras ativado");
                  setOpen(false);
                }}
                className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-cobre/30 bg-cobre/10 px-4 py-3 text-left transition-colors hover:border-cobre hover:bg-cobre/20"
              >
                <span className="flex items-center gap-3">
                  <Hand className="h-5 w-5 text-cobre-soft" aria-hidden />
                  <span>
                    <span className="block font-display text-base leading-tight">VLibras</span>
                    <span className="mt-0.5 block font-eyebrow text-[0.6rem] uppercase tracking-[0.22em] text-areia/60">
                      Tradutor para Libras
                    </span>
                  </span>
                </span>
                <span className="font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-cobre-soft transition-transform group-hover:translate-x-1">
                  Ativar →
                </span>
              </button>
            </section>

            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                setPrefs(DEFAULTS);
                announce("Preferências restauradas ao padrão");
              }}
              className="min-h-12 w-full pt-1 text-center font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] text-areia/60 transition-colors hover:text-cobre-soft"
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>

      {/* Região de anúncios para leitores de tela */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
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
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-md border border-areia/10 bg-carvao px-4 py-3 text-left transition-colors hover:border-cobre/50"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span className="font-display text-base text-areia">{label}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-cobre" : "bg-areia/15",
        )}
      >
        <span
          className={cn(
            "absolute h-5 w-5 rounded-full bg-areia shadow transition-transform",
            checked ? "translate-x-[1.4rem]" : "translate-x-[0.15rem]",
          )}
        />
      </span>
    </button>
  );
}
