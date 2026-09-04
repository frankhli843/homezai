#!/usr/bin/env node
/*
 * Write one HTML file per route.
 *
 * This is the whole fix for the first byte 404. GitHub Pages is a file server, so
 * before this the site had exactly one index.html at the root and the host answered
 * every deep link with 404.html; a person saw the right page because a script
 * repainted it, and a crawler saw HTTP 404. Emitting /blog/<slug>/index.html makes the
 * host answer 200 with the article already in the bytes, and it 301s the no trailing
 * slash form to it at no cost.
 *
 * Verified against real GitHub Pages behaviour before it was built: a directory index
 * on another Pages site returns 200, and the bare path 301s to the slashed form.
 *
 * The head is written here rather than by React, because a social crawler reads the
 * response and never mounts the application.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { routeManifest } from '../src/content/routes.js'
import { metaForRoute, renderHead, escapeAttribute, SITE_ORIGIN } from '../src/content/seo.js'
import { buildSitemap, buildRobots } from '../src/content/sitemap.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrEntry = join(root, 'dist-ssr/entry-server.js')

function fail(message) {
  console.error(`\nprerender: ${message}\n`)
  process.exit(1)
}

/** Insert the generated head just before </head>, replacing what the template shipped. */
function composeHead(template, headHtml) {
  const stripped = template
    .replace(/\n?\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\n?\s*<meta name="description"[^>]*>/, '')
  return stripped.replace('</head>', `  ${headHtml}\n  </head>`)
}

/**
 * A previous slug becomes a real page rather than a dead URL: 200 with a canonical
 * pointing at the new address, a robots noindex so only one URL is indexed, and a meta
 * refresh so a reader lands on the article. GitHub Pages cannot issue a 301 of its own,
 * and this is the honest static equivalent.
 */
function redirectDocument(from, to) {
  const target = escapeAttribute(SITE_ORIGIN + to)
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Moved</title>
    <meta name="robots" content="noindex, follow">
    <link rel="canonical" href="${target}">
    <meta http-equiv="refresh" content="0; url=${target}">
  </head>
  <body>
    <p>This article has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`
}

async function main() {
  if (!existsSync(ssrEntry)) fail('dist-ssr/entry-server.js is missing; run the ssr build first')
  const template = readFileSync(join(dist, 'index.html'), 'utf8')
  const { render } = await import(pathToFileURL(ssrEntry).href)

  const { posts, redirects } = await import(pathToFileURL(join(root, 'src/generated/content.js')).href)

  const manifest = routeManifest({ posts, redirects })
  let written = 0

  for (const entry of manifest) {
    const outputPath = join(dist, entry.outputFile)
    mkdirSync(dirname(outputPath), { recursive: true })

    if (entry.kind === 'redirect') {
      writeFileSync(outputPath, redirectDocument(entry.path, entry.target), 'utf8')
      written += 1
      continue
    }

    const meta = metaForRoute(entry.path, entry.post ? { post: entry.post } : {})
    let html
    try {
      html = render(entry.path).html
    } catch (cause) {
      fail(`${entry.path} could not be rendered: ${cause.stack || cause}`)
    }

    const document = composeHead(template, renderHead(meta)).replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`,
    )
    writeFileSync(outputPath, document, 'utf8')
    written += 1
  }

  // The not found document. GitHub Pages serves this with HTTP 404, which is now the
  // truthful answer, because every URL that does exist has a file of its own.
  const notFoundMeta = metaForRoute('/404/', {})
  writeFileSync(
    join(dist, '404.html'),
    composeHead(template, renderHead(notFoundMeta)).replace(
      '<div id="root"></div>',
      `<div id="root">${render('/this-route-does-not-exist').html}</div>`,
    ),
    'utf8',
  )

  writeFileSync(join(dist, 'sitemap.xml'), buildSitemap({ posts }), 'utf8')
  writeFileSync(join(dist, 'robots.txt'), buildRobots(), 'utf8')

  console.log(
    `prerender: ${written} route file(s), plus 404.html, sitemap.xml and robots.txt for ${posts.length} published article(s)`,
  )
}

main().catch((error) => fail(error.stack || String(error)))
