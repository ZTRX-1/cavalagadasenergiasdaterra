import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "@/router";
import "@/i18n";
import "@/styles.css";

// Recarrega automaticamente quando um chunk JS antigo desaparece após um novo deploy.
// Sem isto, navegar entre rotas com um build antigo em cache cai na tela de erro.
const CHUNK_RELOAD_KEY = "__chunk_reload_ts";
function handleChunkError(reason: unknown) {
  const msg = String((reason as { message?: string })?.message ?? reason ?? "");
  const isChunkErr =
    /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\d]+ failed|Loading CSS chunk|error loading dynamically imported module/i.test(
      msg,
    );
  if (!isChunkErr) return;
  const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? "0");
  if (Date.now() - last < 10_000) return; // evita loop de reload
  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();
}
window.addEventListener("vite:preloadError", (e) => {
  e.preventDefault();
  handleChunkError((e as unknown as { payload?: unknown }).payload);
});
window.addEventListener("error", (e) => handleChunkError(e.error ?? e.message));
window.addEventListener("unhandledrejection", (e) => handleChunkError(e.reason));

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
