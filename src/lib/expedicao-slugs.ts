const PUBLIC_SLUG_BY_CANONICAL: Record<string, string> = {
  "berco-do-marchador": "cruzilia",
  "peru-vale-do-colca": "peru",
};

const CANONICAL_SLUG_BY_PUBLIC: Record<string, string> = Object.fromEntries(
  Object.entries(PUBLIC_SLUG_BY_CANONICAL).map(([canonical, publicSlug]) => [publicSlug, canonical]),
);

export function getPublicExpedicaoSlug(slug: string): string {
  return PUBLIC_SLUG_BY_CANONICAL[slug] ?? slug;
}

export function getCanonicalExpedicaoSlug(slug: string): string {
  return CANONICAL_SLUG_BY_PUBLIC[slug] ?? slug;
}