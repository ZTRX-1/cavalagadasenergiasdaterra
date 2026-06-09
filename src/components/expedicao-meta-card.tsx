import { LucideIcon } from "lucide-react";

interface ExpeditionMetaCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function ExpeditionMetaCard({ icon: Icon, label, value }: ExpeditionMetaCardProps) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-cobre/30">
      <div className="flex items-center gap-2 text-cobre">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
        <span className="font-eyebrow text-[0.62rem] uppercase tracking-[0.22em] !mt-0 leading-none">{label}</span>
      </div>
      <p className="mt-3 font-display text-xl leading-snug text-foreground">
        {value}
      </p>
    </div>
  );
}
