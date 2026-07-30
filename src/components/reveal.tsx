import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "left" | "right" | "scale" | "fade" | "blur";

/**
 * Revela o conteúdo com um movimento discreto quando entra na viewport.
 * Respeita prefers-reduced-motion e o painel de acessibilidade (html.a11y-reduce-motion).
 */
export function Reveal({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className,
  once = true,
  amount = 0.15,
}: {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** atraso em ms */
  delay?: number;
  className?: string;
  once?: boolean;
  amount?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.classList.contains("a11y-reduce-motion"));

    if (reduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [once, amount]);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", `reveal-${variant}`, visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

/**
 * Aplica o reveal em cada filho direto com atraso progressivo.
 */
export function RevealStagger({
  children,
  className,
  step = 90,
  initialDelay = 0,
  variant = "up",
  as,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
  initialDelay?: number;
  variant?: RevealVariant;
  as?: ElementType;
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <Reveal key={i} as={as} variant={variant} delay={initialDelay + i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
