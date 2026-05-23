import heroCavalgada from "@/assets/hero-cavalgada.jpg";
import canastra from "@/assets/expedicao-canastra.jpg";
import cipo from "@/assets/expedicao-cipo.jpg";
import chapada from "@/assets/expedicao-chapada.jpg";
import aerea from "@/assets/expedicao-aerea.jpg";
import cavaloCloseup from "@/assets/cavalo-closeup.jpg";
import acampamento from "@/assets/acampamento.jpg";

export const IMAGES: Record<string, string> = {
  "hero-cavalgada": heroCavalgada,
  "expedicao-canastra": canastra,
  "expedicao-cipo": cipo,
  "expedicao-chapada": chapada,
  "expedicao-aerea": aerea,
  "cavalo-closeup": cavaloCloseup,
  acampamento,
};

export const SLUG_IMAGE: Record<string, string> = {
  "serra-da-canastra": canastra,
  "mantiqueira-refugio": cipo,
  "berco-do-marchador": chapada,
  "jericoacoara": aerea,
  "peru-vale-do-colca": chapada,
  "patagonia-gaucha": aerea,
};

export function getExpedicaoImage(slug: string): string {
  return SLUG_IMAGE[slug] ?? heroCavalgada;
}

export function getImageByKey(key: string): string {
  return IMAGES[key] ?? heroCavalgada;
}

export { heroCavalgada };
