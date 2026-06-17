const PUBLIC_SLUG_BY_CANONICAL: Record<string, string> = {
  "berco-do-marchador": "cruzilia",
  "peru-vale-do-colca": "peru",
  "mantiqueira-5-dias": "mantiqueira-5-dias",
  "mantiqueira-4-dias": "mantiqueira-4-dias",
};

// Slugs antigos -> novos slugs canônicos (para redirecionar links salvos/compartilhados).
const LEGACY_SLUG_REDIRECTS: Record<string, string> = {
  "serra-da-canastra": "entre-redeas-e-cachoeiras",
};

export function resolveLegacyExpedicaoSlug(slug: string): string {
  return LEGACY_SLUG_REDIRECTS[slug] ?? slug;
}

const CANONICAL_SLUG_BY_PUBLIC: Record<string, string> = Object.fromEntries(
  Object.entries(PUBLIC_SLUG_BY_CANONICAL).map(([canonical, publicSlug]) => [publicSlug, canonical]),
);

export function getPublicExpedicaoSlug(slug: string): string {
  return PUBLIC_SLUG_BY_CANONICAL[slug] ?? slug;
}

export function getCanonicalExpedicaoSlug(slug: string): string {
  return CANONICAL_SLUG_BY_PUBLIC[slug] ?? slug;
}