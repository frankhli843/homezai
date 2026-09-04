/*
 * sitemap.xml and robots.txt.
 *
 * Both were HTTP 404 on the live site before this change, so a search engine had no
 * declared surface at all. Only published articles appear here, because the function
 * is only ever handed the published collection; a previous slug is deliberately left
 * out so that the canonical URL is the single one that is advertised.
 */

import { SITE_ORIGIN, absoluteUrl } from './seo.js'
import { STATIC_ROUTES, UNLISTED_ROUTES } from './routes.js'

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** The date part of an ISO instant, which is the granularity a sitemap wants. */
function lastmodOf(post) {
  const value = post.updatedAt || post.publishedAt
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export function buildSitemap({ posts = [] } = {}) {
  const urls = []

  for (const route of STATIC_ROUTES) {
    if (UNLISTED_ROUTES.includes(route)) continue
    urls.push({
      loc: absoluteUrl(route),
      priority: route === '/' ? '1.0' : '0.7',
      changefreq: route === '/blog/' ? 'weekly' : 'monthly',
    })
  }

  for (const post of posts) {
    urls.push({
      loc: absoluteUrl(`/blog/${post.slug}/`),
      lastmod: lastmodOf(post),
      priority: '0.8',
      changefreq: 'monthly',
    })
  }

  const body = urls
    .map((url) => {
      const parts = [`    <loc>${escapeXml(url.loc)}</loc>`]
      if (url.lastmod) parts.push(`    <lastmod>${url.lastmod}</lastmod>`)
      if (url.changefreq) parts.push(`    <changefreq>${url.changefreq}</changefreq>`)
      if (url.priority) parts.push(`    <priority>${url.priority}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

export function buildRobots() {
  return `User-agent: *
Allow: /
Disallow: /admin/

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`
}
