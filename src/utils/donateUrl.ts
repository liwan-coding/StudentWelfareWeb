export type DonateKind = 'campaign' | 'program'

/** Short public paths: /c/:slug for campaigns, /p/:slug for programs */
const PATH_PREFIX: Record<DonateKind, string> = { campaign: 'c', program: 'p' }

/**
 * Public donate link for a campaign or program: `/c/xkqmd` or `/p/pzrta`.
 * Falls back to the legacy `?campaign_id=` form when the API did not return a slug;
 * the Donate page redirects that form to the slug URL.
 */
export function donateUrl(kind: DonateKind, item: { id: number; slug?: string }): string {
  return item.slug ? `/${PATH_PREFIX[kind]}/${item.slug}` : `/donate?${kind}_id=${item.id}`
}

/** True for the donate checkout pages (/donate, /c/:slug, /p/:slug) but not for /donate/return */
export function isDonateCheckoutPath(path: string): boolean {
  return path === '/donate' || path.startsWith('/c/') || path.startsWith('/p/')
}
