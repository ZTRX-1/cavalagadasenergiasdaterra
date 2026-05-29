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

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[color:var(--admin-cinza-3)]">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-[11px] text-[color:var(--admin-cinza-3)]">{hint}</span> : null}
    </label>
  );
}
