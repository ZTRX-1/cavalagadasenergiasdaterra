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
    <section className="admin-card p-6 md:p-7">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-[color:var(--admin-cinza-1)]">{titulo}</h2>
          {descricao ? (
            <p className="mt-1 text-xs text-[color:var(--admin-cinza-3)]">{descricao}</p>
          ) : null}
        </div>
        {actions}
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
