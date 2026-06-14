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
    <div className="mb-6 sm:mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[color:var(--admin-dourado)]/80">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-2xl sm:text-3xl md:text-[36px] text-[color:var(--admin-cinza-1)] leading-tight break-words">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-[color:var(--admin-cinza-2)]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 [&>button]:min-h-[40px] [&>a]:min-h-[40px]">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
