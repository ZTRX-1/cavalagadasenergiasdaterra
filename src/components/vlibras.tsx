import { useEffect } from "react";

/**
 * VLibras — tradutor gratuito de Português → Libras (Governo Federal).
 * Carrega o script oficial e injeta o widget no body.
 * Posicionamento ajustado para não conflitar com o botão flutuante de WhatsApp.
 */
export function VLibras() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("vlibras-script")) return;

    // Cria o container do widget
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

    const script = document.createElement("script");
    script.id = "vlibras-script";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      const w = window as unknown as { VLibras?: { Widget: new (url: string) => unknown } };
      if (w.VLibras) {
        new w.VLibras.Widget("https://vlibras.gov.br/app");
      }
    };
    document.body.appendChild(script);
  }, []);

  return null;
}
