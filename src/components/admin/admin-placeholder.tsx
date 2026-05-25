import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

export function AdminPlaceholder({
  titulo,
  descricao,
  icon: Icon = Construction,
}: {
  titulo: string;
  descricao: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="admin-card flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-xl bg-[color:var(--admin-carvao-deep)]/70 text-[color:var(--admin-dourado)] ring-1 ring-[color:var(--admin-borda)]">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 font-display text-[28px] text-[color:var(--admin-cinza-1)]">{titulo}</h2>
        <p className="mt-3 max-w-md text-[13px] leading-relaxed text-[color:var(--admin-cinza-3)]">
          {descricao}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--admin-borda)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[color:var(--admin-cinza-2)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--admin-dourado)] shadow-[0_0_8px_var(--admin-dourado-glow)]" />
          em construção · etapa 2
        </span>
      </div>
    </div>
  );
}

// Re-export para uso direto como rota
export const Route = createFileRoute("/admin/_authenticated/_placeholder")({
  component: () => null,
});
