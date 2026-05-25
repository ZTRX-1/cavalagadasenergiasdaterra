import heroCavalgada from "@/assets/hero-cavalgada.jpg";
import canastraHero from "@/assets/expedicao-canastra.jpg";
import cipo from "@/assets/expedicao-cipo.jpg";
import chapada from "@/assets/expedicao-chapada.jpg";
import aerea from "@/assets/expedicao-aerea.jpg";
import cavaloCloseup from "@/assets/cavalo-closeup.jpg";
import acampamento from "@/assets/acampamento.jpg";

// ============================================================
// FOTOS REAIS — Curadoria por destino
// ============================================================

// CANASTRA — 38 fotos disponíveis
import can01 from "@/assets/fotos/canastra/01.jpg";
import can02 from "@/assets/fotos/canastra/02.jpg";
import can03 from "@/assets/fotos/canastra/03.jpg";
import can04 from "@/assets/fotos/canastra/04.jpg";
import can05 from "@/assets/fotos/canastra/05.jpg";
import can07 from "@/assets/fotos/canastra/07.jpg";
import can09 from "@/assets/fotos/canastra/09.jpg";
import can10 from "@/assets/fotos/canastra/10.jpg";
import can12 from "@/assets/fotos/canastra/12.jpg";
import can13 from "@/assets/fotos/canastra/13.jpg";
import can14 from "@/assets/fotos/canastra/14.jpg";
import can15 from "@/assets/fotos/canastra/15.jpg";
import can16 from "@/assets/fotos/canastra/16.jpg";
import can18 from "@/assets/fotos/canastra/18.jpg";
import can19 from "@/assets/fotos/canastra/19.jpg";
import can20 from "@/assets/fotos/canastra/20.jpg";
import can21 from "@/assets/fotos/canastra/21.jpg";
import can22 from "@/assets/fotos/canastra/22.jpg";
import can23 from "@/assets/fotos/canastra/23.jpg";
import can24 from "@/assets/fotos/canastra/24.jpg";
import can25 from "@/assets/fotos/canastra/25.jpg";
import can26 from "@/assets/fotos/canastra/26.jpg";
import can27 from "@/assets/fotos/canastra/27.jpg";
import can28 from "@/assets/fotos/canastra/28.jpg";
import can29 from "@/assets/fotos/canastra/29.jpg";
import can30 from "@/assets/fotos/canastra/30.jpg";
import can37 from "@/assets/fotos/canastra/37.jpg";

// MANTIQUEIRA — 34 fotos disponíveis
import man01 from "@/assets/fotos/mantiqueira/01.jpg";
import man02 from "@/assets/fotos/mantiqueira/02.jpg";
import man03 from "@/assets/fotos/mantiqueira/03.jpg";
import man04 from "@/assets/fotos/mantiqueira/04.jpg";
import man06 from "@/assets/fotos/mantiqueira/06.jpg";
import man07 from "@/assets/fotos/mantiqueira/07.jpg";
import man09 from "@/assets/fotos/mantiqueira/09.jpg";
import man13 from "@/assets/fotos/mantiqueira/13.jpg";
import man16 from "@/assets/fotos/mantiqueira/16.jpg";
import man19 from "@/assets/fotos/mantiqueira/19.jpg";
import man21 from "@/assets/fotos/mantiqueira/21.jpg";
import man27 from "@/assets/fotos/mantiqueira/27.jpg";
import man28 from "@/assets/fotos/mantiqueira/28.jpg";
import man34 from "@/assets/fotos/mantiqueira/34.jpg";

// PERU — 12 fotos disponíveis
import peru01 from "@/assets/fotos/peru/01.jpg";
import peru03 from "@/assets/fotos/peru/03.jpg";
import peru04 from "@/assets/fotos/peru/04.jpg";
import peru05 from "@/assets/fotos/peru/05.jpg";
import peru06 from "@/assets/fotos/peru/06.jpg";
import peru07 from "@/assets/fotos/peru/07.jpg";
import peru08 from "@/assets/fotos/peru/08.jpg";
import peru09 from "@/assets/fotos/peru/09.jpg";
import peru10 from "@/assets/fotos/peru/10.jpg";
import peru11 from "@/assets/fotos/peru/11.jpg";
import peru12 from "@/assets/fotos/peru/12.jpg";

// PATAGONIA — 3 fotos
import pat01 from "@/assets/fotos/patagonia/01.jpg";
import pat02 from "@/assets/fotos/patagonia/02.jpg";
import pat03 from "@/assets/fotos/patagonia/03.jpg";

// EQUIPE
import equipeMangalarga from "@/assets/fotos/equipe/equipe-mangalarga.jpg";

// ELAS NA SELA — fotos curadas exclusivamente femininas
import elas01 from "@/assets/fotos/elas-na-sela/01.jpg";
import elas02 from "@/assets/fotos/elas-na-sela/02.jpg";
import elas03 from "@/assets/fotos/elas-na-sela/03.jpg";
import elas04 from "@/assets/fotos/elas-na-sela/04.jpg";
import elas05 from "@/assets/fotos/elas-na-sela/05.jpg";
import elas06 from "@/assets/fotos/elas-na-sela/06.jpg";

// ============================================================
// MAPA DE CHAVES (compat com strings vindas do banco)
// ============================================================
export const IMAGES: Record<string, string> = {
  "hero-cavalgada": heroCavalgada,
  "expedicao-canastra": canastraHero,
  "expedicao-cipo": cipo,
  "expedicao-chapada": chapada,
  "expedicao-aerea": aerea,
  "cavalo-closeup": cavaloCloseup,
  acampamento,
};

// ============================================================
// HERO POR EXPEDIÇÃO — foto cinematográfica de capa
// ============================================================
export const SLUG_IMAGE: Record<string, string> = {
  "serra-da-canastra": can23,        // travessia no rio — foto do rio
  "mantiqueira-refugio": man27,      // tropa em movimento na serra
  "berco-do-marchador": chapada,     // placeholder — imagens reais de Cruzília virão
  "jericoacoara": can18,             // placeholder — imagens reais de Jeri virão
  "peru-vale-do-colca": peru09,      // grupo a cavalo no canyon do Colca
  "patagonia-gaucha": pat01,         // cavalo nas montanhas nevadas
  "caminho-de-santiago": man19,      // cavaleiros em trilha aberta
};

// ============================================================
// GALERIA EDITORIAL POR EXPEDIÇÃO, selecionadas e ordenadas
// ============================================================
export const SLUG_GALERIA: Record<string, string[]> = {
  "serra-da-canastra": [can23, can26, can37, can21, can15, can18, can22, can25, can13, can27, can28, can16, can05, can10],
  "mantiqueira-refugio": [man13, man01, man27, man19, man03, man21, man28, man07, man02, man04, man09, man16, man34, man06],
  "berco-do-marchador": [],
  "peru-vale-do-colca": [peru09, peru12, peru03, peru01, peru05, peru08, peru07, peru11, peru04, peru06, peru10],
  "patagonia-gaucha": [pat01, pat02, pat03],
  "jericoacoara": [],
  "caminho-de-santiago": [man13, man27, man19, man03, man21, man01],
};


// ============================================================
// COLEÇÕES TEMÁTICAS — curadas por força cinematográfica
// ============================================================
export const GALERIA_CAVALGADAS = [
  can26, man13, peru09, pat01, can37, man27, peru12, can18, can21, man19, peru03, can15,
];

export const GALERIA_ELAS_NA_SELA = [
  elas01, elas02, elas03, elas04, elas05, elas06,
];

export const GALERIA_CANASTRA_MARCA = [
  can26, can37, can21, can15, can18, can25, can22, can13, can27, can28, can16, can05,
];


export const FOTO_EQUIPE = equipeMangalarga;

// ============================================================
// API
// ============================================================
export function getExpedicaoImage(slug: string): string {
  return SLUG_IMAGE[slug] ?? heroCavalgada;
}

export function getExpedicaoGaleria(slug: string): string[] {
  return SLUG_GALERIA[slug] ?? [];
}

export function getImageByKey(key: string): string {
  return IMAGES[key] ?? heroCavalgada;
}

export { heroCavalgada };
