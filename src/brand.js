/*
 * Canonical Homezai brand marks for the public marketing site.
 *
 * Every visible Homezai logo on this site must come from here so there is one
 * place to change and one place to test. Paths are site-relative and are joined
 * with import.meta.env.BASE_URL at render time, the same convention
 * integrationsData.js uses, so the asset is always served from homezai.com
 * itself and never hotlinked from an upload host.
 *
 * homezai-wordmark.png is Frank's supplied artwork committed byte for byte:
 * 1600x400 RGB, an exact 4:1 lockup of the circular connected-home icon and the
 * lowercase homezai name in a cyan to blue gradient on an opaque white
 * background. Because the background is opaque, this mark belongs on a light
 * surface. Do not recolour it with a CSS filter. brightness(0) invert(1), which
 * the previous transparent logo used on the dark footer, would flatten the whole
 * rectangle into a solid white block.
 */

/** Site-relative path to the canonical Homezai wordmark. */
export const HOMEZAI_WORDMARK = '/images/homezai-wordmark.png'

/**
 * Intrinsic pixel size of the supplied artwork. Rendered as width and height
 * attributes so the browser reserves the correct 4:1 box before the image
 * decodes, which keeps the header out of cumulative layout shift.
 */
export const HOMEZAI_WORDMARK_WIDTH = 1600
export const HOMEZAI_WORDMARK_HEIGHT = 400

/**
 * Accessible name for the mark. It is the brand name on purpose. It is never
 * the file name, and no logo may sit next to visible "Homezai" text that would
 * make a screen reader announce the brand twice.
 */
export const HOMEZAI_WORDMARK_ALT = 'Homezai'
