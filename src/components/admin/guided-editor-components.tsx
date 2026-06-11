import { useId, useState } from "react";
import { Check, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Seção guiada com explicação de onde aparece no site.
 */
export function GuidedSection({
  id,
  titulo,
  explicacao,
  children,
  actions,
  className,
}: {
  id: string;
  titulo: string;
  explicacao: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("admin-card scroll-mt-24 p-6 md:p-8 lg:p-10 transition-all", className)}>
      <header className="mb-8 border-b border-[color:var(--admin-borda)] pb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-2xl text-[color:var(--admin-cinza-1)] uppercase tracking-wide md:text-3xl">
              {titulo}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--admin-cinza-3)] max-w-2xl">
              {explicacao}
            </p>
          </div>
          {actions ? <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">{actions}</div> : null}
        </div>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

/**
 * Campo guiado com "Aparece em" destacado.
 */
export function GuidedField({
  label,
  hint,
  ondeAparece,
  children,
  className,
}: {
  label: string;
  hint?: string;
  ondeAparece: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("block space-y-2", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[color:var(--admin-cinza-3)]">
          {label}
        </label>
        <div className="flex items-center gap-1.5 rounded-full bg-[color:var(--admin-dourado)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[color:var(--admin-dourado-glow)]">
          <span className="h-1 w-1 rounded-full bg-[color:var(--admin-dourado-glow)]" />
          Aparece em: {ondeAparece}
        </div>
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-[color:var(--admin-cinza-3)] italic">{hint}</p> : null}
    </div>
  );
}

/**
 * Editor de lista simples (Incluso, Pagamento etc)
 */
export function ListEditor({
  items,
  onChange,
  placeholder = "Adicionar item...",
  label = "Item",
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  label?: string;
}) {
  const [newValue, setNewValue] = useState("");

  const add = () => {
    if (!newValue.trim()) return;
    onChange([...items, newValue.trim()]);
    setNewValue("");
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const move = (idx: number, dir: "up" | "down") => {
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          className="admin-input flex-1"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="admin-btn-primary px-4">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="group flex items-center gap-2 rounded-md border border-[color:var(--admin-borda)] bg-[color:var(--admin-carvao-deep)]/40 px-3 py-2 transition-colors hover:border-[color:var(--admin-borda-strong)]">
            <span className="text-xs text-[color:var(--admin-cinza-3)] w-4">{idx + 1}</span>
            <input
              className="flex-1 bg-transparent text-sm text-[color:var(--admin-cinza-1)] outline-none"
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[idx] = e.target.value;
                onChange(next);
              }}
            />
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => move(idx, "up")} disabled={idx === 0} className="p-1 hover:text-[color:var(--admin-dourado-glow)] disabled:opacity-30">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(idx, "down")} disabled={idx === items.length - 1} className="p-1 hover:text-[color:var(--admin-dourado-glow)] disabled:opacity-30">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => remove(idx)} className="ml-1 p-1 text-rose-400/70 hover:text-rose-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
