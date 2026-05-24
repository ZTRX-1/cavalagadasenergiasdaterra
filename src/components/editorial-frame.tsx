import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt?: string;
  variant?: "portrait" | "landscape" | "organic";
  accent?: "cobre" | "floresta" | "couro";
  side?: "left" | "right";
  className?: string;
  priority?: boolean;
}

/**
 * Moldura editorial premium para imagens.
 * - portrait: 4/5 com offset de cor atrás
 * - landscape: 21/9 com borda interna sutil
 * - organic: bordas levemente assimétricas
 */
export function EditorialFrame({
  src,
  alt = "",
  variant = "portrait",
  accent = "cobre",
  side = "left",
  className,
  priority = false,
}: Props) {
  const accentClass = {
    cobre: "bg-cobre/30",
    floresta: "bg-floresta-deep/40",
    couro: "bg-couro/30",
  }[accent];

  const aspect =
    variant === "portrait"
      ? "aspect-[4/5]"
      : variant === "landscape"
      ? "aspect-[21/9]"
      : "aspect-[5/6]";

  const radius =
    variant === "organic"
      ? "rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-sm rounded-bl-sm"
      : "rounded-sm";

  return (
    <figure className={cn("relative", className)}>
      {/* offset accent block */}
      <span
        aria-hidden
        className={cn(
          "absolute hidden md:block",
          accentClass,
          radius,
          side === "left"
            ? "-left-5 -bottom-5 right-8 top-8"
            : "-right-5 -bottom-5 left-8 top-8",
        )}
      />
      <div
        className={cn(
          "relative overflow-hidden shadow-elegant ring-1 ring-carvao/10",
          aspect,
          radius,
        )}
      >
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* grão editorial muito sutil */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "3px 3px",
          }}
        />
        {/* vinheta cinematográfica leve */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.18) 100%)",
          }}
        />
      </div>
    </figure>
  );
}
