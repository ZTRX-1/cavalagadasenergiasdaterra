import type { LucideIcon } from "lucide-react";

export function AdminEmpty({
  icon: Icon,
  titulo,
  descricao,
  acao,
}: {
  icon: LucideIcon;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="admin-card flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--admin-petroleo)] ring-1 ring-[color:var(--admin-borda-strong)]">
        <Icon className="h-6 w-6 text-[color:var(--admin-dourado)]" strokeWidth={1.4} />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display text-2xl text-[color:var(--admin-cinza-1)]">{titulo}</h3>
        {descricao ? <p className="text-sm text-[color:var(--admin-cinza-2)]">{descricao}</p> : null}
      </div>
      {acao}
    </div>
  );
}
