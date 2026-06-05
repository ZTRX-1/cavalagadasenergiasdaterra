export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[color:var(--admin-dourado)]/80">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-3xl md:text-[36px] text-[color:var(--admin-cinza-1)] leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--admin-cinza-2)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
