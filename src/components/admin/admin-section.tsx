import { useId } from "react";

export function AdminSection({
  titulo,
  descricao,
  children,
  actions,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="admin-card p-6 md:p-8 lg:p-9">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl text-[color:var(--admin-cinza-1)]">{titulo}</h2>
          {descricao ? (
            <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--admin-cinza-3)] md:text-xs">{descricao}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * Dispara um evento global indicando qual seção do preview deve ser realçada.
 * O componente <ExpedicaoPreview /> escuta esse evento e dá scroll + highlight.
 */
export function highlightPreview(target: string | null) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("admin-preview-highlight", { detail: target }));
}

export function AdminField({
  label,
  hint,
  ondeAparece,
  previewTarget,
  children,
}: {
  label: string;
  hint?: string;
  /** Texto curto: "Aparece no topo da página pública", "Card de listagem", etc. */
  ondeAparece?: string;
  /** Id da seção dentro do preview ao vivo a ser destacada quando o campo recebe foco. */
  previewTarget?: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const handleFocus = previewTarget ? () => highlightPreview(previewTarget) : undefined;
  const handleBlur = previewTarget ? () => highlightPreview(null) : undefined;

  return (
    <div
      className="block space-y-1.5"
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
      data-preview-target={previewTarget}
    >
      <label htmlFor={id} className="block">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--admin-cinza-3)]">
          {label}
        </span>
      </label>
      {ondeAparece ? (
        <span className="flex items-center gap-1.5 text-[10.5px] leading-snug text-[color:var(--admin-dourado-glow)]/80">
          <span className="inline-block h-1 w-1 rounded-full bg-[color:var(--admin-dourado-glow)]/70" />
          Aparece em: {ondeAparece}
        </span>
      ) : null}
      {children}
      {hint ? <span className="block text-[11px] text-[color:var(--admin-cinza-3)]">{hint}</span> : null}
    </div>
  );
}
