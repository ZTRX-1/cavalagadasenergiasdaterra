import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Ao trocar de pathname, força scroll suave para o topo.
 * Complementa o scrollRestoration nativo do TanStack para casos onde
 * só muda search/hash mas o usuário espera ir ao topo.
 */
export function ScrollToTop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Pequeno timeout para depois do paint
    const id = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
