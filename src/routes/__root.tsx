import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageLoader } from "@/components/page-loader";
import { ScrollToTop } from "@/components/scroll-to-top";
import { CookieConsent } from "@/components/cookie-consent";
import { VLibras } from "@/components/vlibras";
import { AccessibilityPanel } from "@/components/accessibility-panel";

import heroOg from "@/assets/founders/ligia-rio.jpg";

import { Toaster } from "@/components/ui/sonner";

import "@/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow">404</div>
        <h1 className="mt-4 font-display text-4xl">Trilha não encontrada</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          O caminho que você procura não existe. Que tal voltar e escolher uma de nossas expedições?
        </p>
        <a href="/" className="mt-8 inline-flex items-center justify-center rounded-full bg-floresta-deep px-6 py-3 text-sm uppercase tracking-widest text-areia">
          Voltar ao início
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="eyebrow">Algo deu errado</div>
        <h1 className="mt-4 font-display text-3xl">Esta página não carregou</h1>
        <p className="mt-3 text-sm text-muted-foreground">Tente novamente ou volte ao início.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-full bg-floresta-deep px-6 py-3 text-sm uppercase tracking-widest text-areia"
          >Tentar novamente</button>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-border bg-background px-6 py-3 text-sm uppercase tracking-widest text-foreground">Ir ao início</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cavalgadas Energias da Terra — Expedições a cavalo premium" },
      { name: "description", content: "Expedições a cavalo cuidadosamente desenhadas para quem busca natureza com profundidade e aventura com requinte." },
      { name: "author", content: "Cavalgadas Energias da Terra" },
      { property: "og:title", content: "Cavalgadas Energias da Terra — Expedições a cavalo premium" },
      { property: "og:description", content: "Expedições a cavalo cuidadosamente desenhadas para quem busca natureza com profundidade e aventura com requinte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Cavalgadas Energias da Terra — Expedições a cavalo premium" },
      { name: "twitter:description", content: "Expedições a cavalo cuidadosamente desenhadas para quem busca natureza com profundidade e aventura com requinte." },
      { property: "og:image", content: heroOg },
      { name: "twitter:image", content: heroOg },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {!isAdmin && (
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-cobre focus:px-5 focus:py-3 focus:font-eyebrow focus:text-[0.7rem] focus:uppercase focus:tracking-[0.22em] focus:text-areia focus:shadow-elegant"
        >
          Pular para o conteúdo principal
        </a>
      )}
      {!isAdmin && <PageLoader />}
      <ScrollToTop />
      {!isAdmin && <SiteHeader />}
      <main id="main-content" tabIndex={-1} className="min-h-screen focus:outline-none">
        <Outlet />
      </main>
      {!isAdmin && <SiteFooter />}
      {!isAdmin && <CookieConsent />}
      {!isAdmin && <VLibras />}
      
      {!isAdmin && <AccessibilityPanel />}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
