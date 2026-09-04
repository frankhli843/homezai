import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { STATIC_ROUTES, routeManifest } from '../src/content/routes.js'
import { buildSitemap, buildRobots } from '../src/content/sitemap.js'

/**
 * The live site returns HTTP 404 on the first byte for every deep route because
 * GitHub Pages has no file to serve there. The fix is to emit one directory index per
 * route, so the route manifest is the thing that decides whether a URL exists at all.
 */

const posts = [
  {
    slug: 'first-post',
    title: 'First post',
    excerpt: 'x',
    publishedAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
  {
    slug: 'second-post',
    title: 'Second post',
    excerpt: 'y',
    publishedAt: '2026-09-03T00:00:00.000Z',
    updatedAt: '2026-09-03T00:00:00.000Z',
  },
]

describe('the route manifest covers every reachable url', () => {
  test('every route the router declares is prerendered, so none can 404 on first byte', () => {
    for (const route of ['/', '/pricing/', '/integrations/', '/contact/', '/terms/', '/privacy/', '/accessibility/', '/dpa/']) {
      assert.ok(STATIC_ROUTES.includes(route), `${route} missing from STATIC_ROUTES`)
    }
  })

  test('the blog index is a prerendered route', () => {
    assert.ok(STATIC_ROUTES.includes('/blog/'))
  })

  test('every published post gets its own route', () => {
    const manifest = routeManifest({ posts, redirects: [] })
    const paths = manifest.map((r) => r.path)
    assert.ok(paths.includes('/blog/first-post/'))
    assert.ok(paths.includes('/blog/second-post/'))
  })

  test('every manifest entry writes to a directory index file, which is what makes it 200', () => {
    for (const entry of routeManifest({ posts, redirects: [] })) {
      assert.match(entry.outputFile, /index\.html$/, `${entry.path} does not write an index.html`)
      assert.doesNotMatch(entry.outputFile, /^\//, 'output paths must be relative to dist')
    }
  })

  test('the home route writes the root index and does not nest itself', () => {
    const home = routeManifest({ posts: [], redirects: [] }).find((r) => r.path === '/')
    assert.equal(home.outputFile, 'index.html')
  })

  test('a redirect becomes its own emitted page rather than a dead url', () => {
    const manifest = routeManifest({
      posts,
      redirects: [{ from: '/blog/old-name/', to: '/blog/first-post/' }],
    })
    const redirect = manifest.find((r) => r.path === '/blog/old-name/')
    assert.ok(redirect, 'the previous slug is not emitted')
    assert.equal(redirect.kind, 'redirect')
    assert.equal(redirect.target, '/blog/first-post/')
  })

  test('no draft slug can appear in the manifest, because only published posts are passed in', () => {
    const manifest = routeManifest({ posts: [], redirects: [] })
    assert.equal(manifest.filter((r) => r.path.startsWith('/blog/') && r.path !== '/blog/').length, 0)
  })

  test('the admin surface is never prerendered as an application route', () => {
    assert.ok(!STATIC_ROUTES.includes('/admin/'))
    assert.equal(routeManifest({ posts, redirects: [] }).some((r) => r.path === '/admin/'), false)
  })
})

describe('the sitemap lists published content and nothing else', () => {
  const xml = buildSitemap({ posts, redirects: [{ from: '/blog/old-name/', to: '/blog/first-post/' }] })

  test('it is well formed and declares the sitemap namespace', () => {
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/)
    assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/)
    assert.match(xml, /<\/urlset>\s*$/)
  })

  test('every url is absolute and https on the business domain', () => {
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    assert.ok(locs.length > 0)
    for (const loc of locs) assert.match(loc, /^https:\/\/homezai\.com\//)
  })

  test('the blog index and each published article are listed', () => {
    assert.match(xml, /<loc>https:\/\/homezai\.com\/blog\/<\/loc>/)
    assert.match(xml, /<loc>https:\/\/homezai\.com\/blog\/first-post\/<\/loc>/)
    assert.match(xml, /<loc>https:\/\/homezai\.com\/blog\/second-post\/<\/loc>/)
  })

  test('an article carries its last modified date', () => {
    assert.match(xml, /<lastmod>2026-09-02<\/lastmod>/)
  })

  test('a redirected previous slug is not listed, because only the canonical url is', () => {
    assert.doesNotMatch(xml, /old-name/)
  })

  test('the admin surface is not listed', () => {
    assert.doesNotMatch(xml, /\/admin/)
  })

  test('a site with zero published posts still emits a valid sitemap of the static pages', () => {
    const empty = buildSitemap({ posts: [], redirects: [] })
    assert.match(empty, /<urlset/)
    assert.match(empty, /<loc>https:\/\/homezai\.com\/<\/loc>/)
    assert.match(empty, /<loc>https:\/\/homezai\.com\/blog\/<\/loc>/)
    assert.doesNotMatch(empty, /\/blog\/[a-z]/)
  })

  test('a draft title or slug can never appear, because buildSitemap only sees published posts', () => {
    assert.doesNotMatch(xml, /draft/i)
  })
})

describe('robots.txt', () => {
  const robots = buildRobots()

  test('it points crawlers at the sitemap with an absolute url', () => {
    assert.match(robots, /^Sitemap: https:\/\/homezai\.com\/sitemap\.xml$/m)
  })

  test('the public site is crawlable', () => {
    assert.match(robots, /^User-agent: \*$/m)
    assert.match(robots, /^Allow: \/$/m)
  })

  test('the editor surface is disallowed', () => {
    assert.match(robots, /^Disallow: \/admin\/$/m)
  })
})
