import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logoCavalgadas from "@/assets/logo-cavalgadas.jpg";

/**
 * Preloader cinematográfico premium.
 * Mostra o logo da Cavalgadas Energias da Terra com fade suave
 * enquanto o conteúdo inicial carrega. Some após o primeiro paint.
 */
export function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Marca como pronto assim que o load completar (ou após 900ms como fallback)
    const finish = () => {
      setVisible(false);
      // remove do DOM após o fade
      window.setTimeout(() => setHidden(true), 700);
    };

    if (document.readyState === "complete") {
      window.setTimeout(finish, 350);
    } else {
      window.addEventListener("load", finish, { once: true });
      const fallback = window.setTimeout(finish, 1600);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(fallback);
      };
    }
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-carvao transition-opacity duration-700 ease-out",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* halo sutil de fundo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.cobre/15),transparent_60%)]" />

      <div className="relative flex flex-col items-center gap-7">
        <div className="relative">
          <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-cobre/15" style={{ animationDuration: "2.4s" }} />
          <span className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-1 ring-cobre/40 md:h-24 md:w-24">
            <img src={logoCavalgadas} alt="" className="h-full w-full object-cover" />
          </span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-display text-xl tracking-tight text-areia md:text-2xl">Cavalgadas</span>
          <span className="font-eyebrow text-[0.58rem] uppercase tracking-[0.34em] text-cobre-soft">
            Energias da Terra
          </span>
        </div>
        <span className="mt-2 block h-px w-16 overflow-hidden bg-areia/10">
          <span className="block h-full w-1/2 animate-[loaderbar_1.4s_ease-in-out_infinite] bg-cobre" />
        </span>
      </div>

      <style>{`
        @keyframes loaderbar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </div>
  );
}
