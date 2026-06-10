import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpeditionMetaCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  className?: string;
}

export function ExpeditionMetaCard({ icon: Icon, label, value, className }: ExpeditionMetaCardProps) {
  return (
    <div className={cn("rounded-sm border border-border bg-card p-6 shadow-card transition-all hover:border-cobre/30", className)}>
      <div className="flex items-center gap-2 text-cobre">
        <Icon className="h-4 w-4" strokeWidth={1.6} />
        <span className="font-eyebrow text-[0.65rem] uppercase tracking-[0.22em] !mt-0 leading-none font-medium">{label}</span>
      </div>
      <p className="mt-2.5 font-sans text-[1rem] leading-relaxed text-foreground/90 font-light">
        {value}
      </p>
    </div>
  );
}
