import { SVGProps } from "react";

/**
 * Glifo de acessibilidade moderno e universal — figura humana
 * estilizada com braços abertos dentro de um círculo fino.
 * Transmite inclusão digital sem o símbolo institucional antigo
 * de cadeira de rodas.
 */
export function AccessibilityGlyph({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {/* Anel externo sutil */}
      <circle cx="12" cy="12" r="10" opacity="0.45" />
      {/* Cabeça */}
      <circle cx="12" cy="6.7" r="1.35" fill="currentColor" stroke="none" />
      {/* Braços abertos (universal access) */}
      <path d="M5.5 10.2c2.1.7 4.3 1 6.5 1s4.4-.3 6.5-1" />
      {/* Tronco + pernas em V */}
      <path d="M12 11.2v3.2" />
      <path d="M12 14.4l-2.4 4.6" />
      <path d="M12 14.4l2.4 4.6" />
    </svg>
  );
}
