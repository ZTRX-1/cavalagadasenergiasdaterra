import { Info } from "lucide-react";

/**
 * Bloco explicativo no topo de cada página do painel.
 * Pensado para usuárias leigas: explica em 2-3 linhas o que é a seção
 * e como usá-la no dia a dia.
 */
export function AdminPageIntro({
  children,
  tom = "info",
}: {
  children: React.ReactNode;
  tom?: "info" | "alerta";
}) {
  const cor =
    tom === "alerta"
      ? "border-amber-400/30 bg-amber-400/5 text-amber-100"
      : "border-[color:var(--admin-borda)] bg-[color:var(--admin-petroleo-soft)]/30 text-[color:var(--admin-cinza-2)]";
  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 md:px-5 md:py-4 ${cor}`}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--admin-dourado)]/80" strokeWidth={1.6} />
      <div className="text-[13px] leading-relaxed md:text-sm">{children}</div>
    </div>
  );
}
