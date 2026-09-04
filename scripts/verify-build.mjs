#!/usr/bin/env node
/*
 * Assert things about the bytes that will actually be uploaded.
 *
 * The unit tests prove that the head builder emits an og:image and that the collection
 * drops drafts. They cannot prove that the file GitHub Pages will serve contains any of
 * it, because that depends on the prerenderer, on the template and on the order the
 * build runs its steps. That gap is exactly where a crawler visible regression would
 * live, so this runs against dist after a real build.
 *
 * It is also the draft leak check of last resort: whatever went wrong upstream, no
 * unpublished slug may appear anywhere in the uploaded tree.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { STATIC_ROUTES, routeManifest } from '../src/content/routes.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

const failures = []
const check = (condition, message) => {
  if (!condition) failures.push(message)
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

const { posts, redirects } = await import(pathToFileURL(join(root, 'src/generated/content.js')).href)

// 1. Every route that must answer 200 has a file. This is the first byte 404 fix, and
//    it is the one thing that cannot be checked without looking at the output tree.
for (const entry of routeManifest({ posts, redirects })) {
  check(existsSync(join(dist, entry.outputFile)), `missing route file for ${entry.path}: dist/${entry.outputFile}`)
}
check(existsSync(join(dist, '404.html')), 'dist/404.html is missing, so an unknown URL would have no page')
check(existsSync(join(dist, 'sitemap.xml')), 'dist/sitemap.xml is missing')
check(existsSync(join(dist, 'robots.txt')), 'dist/robots.txt is missing')

// 2. Crawler visible metadata is in the bytes, on a real page, not applied after mount.
for (const route of [...STATIC_ROUTES, ...posts.map((p) => `/blog/${p.slug}/`)]) {
  const file = join(dist, route === '/' ? 'index.html' : `${route.replace(/^\/|\/$/g, '')}/index.html`)
  if (!existsSync(file)) continue
  const html = readFileSync(file, 'utf8')
  for (const [label, pattern] of [
    ['a title', /<title>[^<]{5,}<\/title>/],
    ['a description', /<meta name="description" content="[^"]{20,}">/],
    ['a canonical', /<link rel="canonical" href="https:\/\/homezai\.com\//],
    ['an absolute og:image', /<meta property="og:image" content="https:\/\/homezai\.com\//],
    ['an og:url', /<meta property="og:url" content="https:\/\/homezai\.com\//],
    ['a twitter card', /<meta name="twitter:card" content="summary_large_image">/],
  ]) {
    check(pattern.test(html), `${route} has no ${label} in the served bytes`)
  }
  check(!/<title>[^<]*<\/title>[\s\S]*<title>/.test(html), `${route} emits more than one title`)
}

// 3. Articles carry structured data and the rendered body, so the page is readable
//    before the bundle arrives rather than being an empty shell.
for (const post of posts) {
  const html = readFileSync(join(dist, `blog/${post.slug}/index.html`), 'utf8')
  check(/"@type":\s*"BlogPosting"/.test(html), `/blog/${post.slug}/ has no BlogPosting structured data`)
  check(html.includes(post.title), `/blog/${post.slug}/ does not contain its own headline`)
  check(
    html.includes('<div id="root"><') && html.length > 4000,
    `/blog/${post.slug}/ looks like an empty shell rather than prerendered markup`,
  )
  check(
    new RegExp(`<loc>https://homezai\\.com/blog/${post.slug}/</loc>`).test(
      readFileSync(join(dist, 'sitemap.xml'), 'utf8'),
    ),
    `/blog/${post.slug}/ is missing from the sitemap`,
  )
}

// 4. The editor is present, served from this origin, and excluded from crawling.
check(existsSync(join(dist, 'admin/index.html')), 'the editor entry point was not built')
check(
  existsSync(join(dist, 'admin/sveltia-cms.js')),
  'the editor bundle was not vendored, so /admin/ would load nothing',
)
const robots = readFileSync(join(dist, 'robots.txt'), 'utf8')
check(/^Disallow: \/admin\/$/m.test(robots), 'robots.txt does not disallow the editor')
check(
  !readFileSync(join(dist, 'sitemap.xml'), 'utf8').includes('/admin'),
  'the sitemap advertises the editor',
)
check(
  /<meta name="robots" content="noindex, ?nofollow">/.test(readFileSync(join(dist, 'admin/index.html'), 'utf8')),
  'the editor page does not ask to be left out of the index',
)

// 5. Nothing unpublished is anywhere in the tree. The generated module only ever holds
//    published posts, so any content file in dist that no published post accounts for
//    is a leak, whatever produced it.
const publishedSlugs = new Set(posts.map((p) => p.slug))
const blogDir = join(dist, 'blog')
if (existsSync(blogDir)) {
  for (const name of readdirSync(blogDir)) {
    if (name === 'index.html') continue
    const isRedirect = redirects.some((r) => r.from === `/blog/${name}/`)
    check(
      publishedSlugs.has(name) || isRedirect,
      `dist/blog/${name} is neither a published article nor a declared redirect`,
    )
  }
}

// 6. No credential may be uploaded. This is cheap and it is the failure that would be
//    worst, so it runs over the whole tree rather than over a chosen file.
const secretShapes = [
  [/gh[pousr]_[A-Za-z0-9]{16,}/, 'a GitHub token'],
  [/github_pat_[A-Za-z0-9_]{20,}/, 'a GitHub fine grained token'],
  [/AKIA[0-9A-Z]{16}/, 'an AWS access key id'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
]
for (const file of walk(dist)) {
  if (!/\.(html|js|json|yml|yaml|txt|xml|css|map)$/.test(file)) continue
  if (file.endsWith('sveltia-cms.js') || file.endsWith('.map')) continue
  const contents = readFileSync(file, 'utf8')
  for (const [pattern, label] of secretShapes) {
    check(!pattern.test(contents), `${relative(dist, file)} appears to contain ${label}`)
  }
}

if (failures.length > 0) {
  console.error(`\nverify-build: ${failures.length} problem(s) with the built output\n`)
  for (const failure of failures) console.error(`  - ${failure}`)
  console.error('')
  process.exit(1)
}

console.log(
  `verify-build: ok. ${STATIC_ROUTES.length} static route file(s), ${posts.length} article(s), ${redirects.length} redirect(s), sitemap, robots and a real 404 all present with crawler visible metadata.`,
)
