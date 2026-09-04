/*
 * The route manifest.
 *
 * GitHub Pages is a file server. A URL exists if and only if a file exists at that
 * path, which is exactly why every deep route on this site answered HTTP 404 on the
 * first byte: there was one index.html at the root and nothing anywhere else, so the
 * host fell through to 404.html and the router repainted the page afterwards. A person
 * saw the right page; a crawler saw a 404.
 *
 * The fix is this list. Every entry becomes its own directory index, which the host
 * serves with HTTP 200, and the no trailing slash form gets a 301 to it for free.
 */

/** Every non article route the application can render. */
export const STATIC_ROUTES = Object.freeze([
  '/',
  '/blog/',
  '/pricing/',
  '/integrations/',
  '/contact/',
  '/terms/',
  '/privacy/',
  '/accessibility/',
  '/dpa/',
])

/**
 * URLs that still have to answer, but are not pages any more. The support page was
 * folded into the home page, and a link to it exists in the wild, so it is emitted as
 * a redirect document rather than left to fall through to the 404.
 */
export const PERMANENT_REDIRECTS = Object.freeze([{ from: '/support/', to: '/' }])

/** Routes that exist but should never be advertised in the sitemap. */
export const UNLISTED_ROUTES = Object.freeze(['/support/'])

/** The file a canonical path is written to, relative to the build output directory. */
export function outputFileForPath(path) {
  if (path === '/') return 'index.html'
  const trimmed = path.replace(/^\/+/, '').replace(/\/+$/, '')
  return `${trimmed}/index.html`
}

/**
 * Every page the build emits.
 *
 * Only published posts are ever passed in, so a draft cannot acquire a route by any
 * path through this function.
 */
export function routeManifest({ posts = [], redirects = [] } = {}) {
  const entries = []

  for (const path of STATIC_ROUTES) {
    entries.push({ path, outputFile: outputFileForPath(path), kind: 'page' })
  }

  for (const post of posts) {
    const path = `/blog/${post.slug}/`
    entries.push({ path, outputFile: outputFileForPath(path), kind: 'post', slug: post.slug, post })
  }

  for (const redirect of [...PERMANENT_REDIRECTS, ...redirects]) {
    entries.push({
      path: redirect.from,
      outputFile: outputFileForPath(redirect.from),
      kind: 'redirect',
      target: redirect.to,
    })
  }

  return entries
}
