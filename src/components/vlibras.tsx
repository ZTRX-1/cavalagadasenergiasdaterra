import { useEffect } from "react";

/**
 * VLibras — tradutor oficial PT → Libras (Governo Federal).
 * Injeta o widget oficial e oculta o botão flutuante padrão.
 * Quem dispara a abertura é o nosso painel de acessibilidade
 * (botão "Ativar"), mantendo a identidade premium do site.
 */
export function VLibras() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("vlibras-script")) return;

    // Container oficial — precisa de class="enabled" para inicializar
    if (!document.querySelector("[vw]")) {
      const wrapper = document.createElement("div");
      wrapper.setAttribute("vw", "");
      wrapper.className = "enabled";
      wrapper.innerHTML = `
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      `;
      document.body.appendChild(wrapper);
    }

    // CSS — oculta o botão padrão e eleva o player acima dos FABs
    if (!document.getElementById("vlibras-style")) {
      const style = document.createElement("style");
      style.id = "vlibras-style";
      style.textContent = `
        /* Oculta o botão padrão mas mantém clicável via JS */
        [vw][vw] [vw-access-button] {
          position: fixed !important;
          left: -9999px !important;
          top: -9999px !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        [vw][vw] { z-index: 80 !important; }
        [vw][vw] [vw-plugin-wrapper],
        [vw][vw] .vw-plugin-top-wrapper,
        div[vw-plugin-wrapper] { z-index: 80 !important; }
        div[vw-plugin-wrapper] iframe { z-index: 80 !important; }
      `;
      document.head.appendChild(style);
    }

    const script = document.createElement("script");
    script.id = "vlibras-script";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      const w = window as unknown as {
        VLibras?: { Widget: new (url: string) => unknown };
      };
      if (w.VLibras) {
        try {
          new w.VLibras.Widget("https://vlibras.gov.br/app");
        } catch (err) {
          console.warn("[VLibras] init failed", err);
        }
      }
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
