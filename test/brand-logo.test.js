import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

import {
  HOMEZAI_WORDMARK,
  HOMEZAI_WORDMARK_ALT,
  HOMEZAI_WORDMARK_HEIGHT,
  HOMEZAI_WORDMARK_WIDTH,
} from '../src/brand.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(repoRoot, 'public')
const appSource = readFileSync(path.join(repoRoot, 'src', 'App.jsx'), 'utf8')
const cssSource = readFileSync(path.join(repoRoot, 'src', 'App.css'), 'utf8')

/*
 * SHA-256 of the artwork Frank supplied in the Discord thread on 2026-09-03,
 * preserved at
 * workspace/artifacts/homezai/2026-09-03-landing-page-logo/replacement-logo.png.
 * The committed asset is a byte for byte copy, so this digest is the proof that
 * the published mark is Frank's file and not a redraw, a re-encode or the
 * retired logo restored under the new name.
 */
const SUPPLIED_SHA256 =
  'f1b4d81b591e7f166618bfad5663c990b1b45b9d9874fec81fda5d8c2e978bd0'

/** The mark this change retires. Nothing in src/ may reference it again. */
const RETIRED_LOGO = 'homezai-logo.png'

/**
 * Reads a PNG IHDR directly so intrinsic size is proven from the committed
 * bytes rather than from a constant that could drift away from the file.
 */
function readPngSize(file) {
  const buf = readFileSync(file)
  assert.equal(
    buf.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `${file} is not a PNG`,
  )
  assert.equal(buf.subarray(12, 16).toString('ascii'), 'IHDR', `${file} has no IHDR`)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

/** Every <img> tag in App.jsx, as raw source strings. */
function imgTags() {
  return appSource.match(/<img[^>]*\/>/g) ?? []
}

/** The <img> tags that render the Homezai wordmark. */
function wordmarkTags() {
  return imgTags().filter((tag) => /HOMEZAI_WORDMARK\b/.test(tag))
}

test('the canonical wordmark is a local, non-hotlinked site asset', () => {
  assert.ok(
    HOMEZAI_WORDMARK.startsWith('/images/'),
    `wordmark must be served from our own /images/ directory, got ${HOMEZAI_WORDMARK}`,
  )
  assert.ok(
    !/^https?:|discord|cdn\.|googleusercontent|mail\.google/i.test(HOMEZAI_WORDMARK),
    `wordmark must not hotlink an external host, got ${HOMEZAI_WORDMARK}`,
  )
  assert.ok(
    !HOMEZAI_WORDMARK.includes(RETIRED_LOGO),
    'wordmark must not point back at the retired logo asset',
  )
  assert.ok(existsSync(path.join(publicDir, HOMEZAI_WORDMARK.replace(/^\//, ''))),
    `wordmark file missing from public/: ${HOMEZAI_WORDMARK}`)
})

test('the committed wordmark is Frank supplied artwork, byte for byte', () => {
  const file = path.join(publicDir, HOMEZAI_WORDMARK.replace(/^\//, ''))
  const digest = createHash('sha256').update(readFileSync(file)).digest('hex')
  assert.equal(
    digest,
    SUPPLIED_SHA256,
    'committed wordmark does not match the supplied source checksum, so the art was replaced, re-encoded or reverted',
  )
})

test('the wordmark keeps its intrinsic 4:1 lockup and declares it to the browser', () => {
  const file = path.join(publicDir, HOMEZAI_WORDMARK.replace(/^\//, ''))
  const { width, height } = readPngSize(file)
  assert.equal(width, HOMEZAI_WORDMARK_WIDTH, 'declared width drifted from the file')
  assert.equal(height, HOMEZAI_WORDMARK_HEIGHT, 'declared height drifted from the file')
  assert.equal(width / height, 4, 'the wordmark must stay an exact 4:1 lockup')
})

test('the accessible name is the brand, never a file name', () => {
  assert.equal(HOMEZAI_WORDMARK_ALT, 'Homezai')
  assert.ok(
    !/\.(png|jpe?g|svg|webp)$/i.test(HOMEZAI_WORDMARK_ALT),
    'alt text must not expose an image file name',
  )
  assert.ok(!HOMEZAI_WORDMARK_ALT.includes('/'), 'alt text must not expose a path')
})

test('no source file references the retired logo asset', () => {
  for (const [name, source] of [['App.jsx', appSource], ['App.css', cssSource]]) {
    assert.ok(
      !source.includes(RETIRED_LOGO),
      `${name} still references the retired ${RETIRED_LOGO}`,
    )
  }
})

test('both shared shell placements render the one canonical wordmark', () => {
  assert.ok(
    /from '\.\/brand\.js'/.test(appSource),
    'App.jsx must import the canonical mark from brand.js rather than hardcoding a path',
  )
  assert.equal(
    wordmarkTags().length,
    2,
    'expected exactly two wordmark placements, the shared header and the shared footer',
  )
  assert.ok(
    !/images\/homezai-wordmark\.png/.test(appSource),
    'App.jsx must not hardcode the wordmark path, it must use the brand.js constant',
  )
})

test('every wordmark placement declares its box so the header cannot shift', () => {
  const tags = wordmarkTags()
  // Guard the loop below from passing on an empty list.
  assert.equal(tags.length, 2, 'expected two wordmark placements to inspect')
  for (const tag of tags) {
    assert.ok(
      /width=\{HOMEZAI_WORDMARK_WIDTH\}/.test(tag) &&
        /height=\{HOMEZAI_WORDMARK_HEIGHT\}/.test(tag),
      `wordmark <img> must declare intrinsic width and height to avoid layout shift: ${tag}`,
    )
    assert.ok(
      /alt=\{HOMEZAI_WORDMARK_ALT\}/.test(tag),
      `wordmark <img> must use the canonical accessible name: ${tag}`,
    )
  }
})

test('the opaque wordmark is never recoloured by the old inverting filter', () => {
  const tags = wordmarkTags()
  assert.equal(tags.length, 2, 'expected two wordmark placements to inspect')
  for (const tag of tags) {
    assert.ok(
      !/logo-img-light/.test(tag),
      `logo-img-light applies brightness(0) invert(1), which flattens the opaque wordmark into a solid block: ${tag}`,
    )
  }
  assert.ok(
    !/\.logo-img-light\b/.test(cssSource),
    'the inverting logo filter is dead once the transparent logo is retired and must not linger',
  )
})

test('each wordmark placement stays a working link to the home page', () => {
  /*
   * The mark is the site home link in both the header and the footer. This
   * pins the anchor that wraps each placement, so losing the link, or pointing
   * it somewhere other than the home route, fails here.
   */
  const homeLinkedMarks = appSource.match(
    /<Link\s+to="\/"[^>]*>\s*(?:<span[^>]*>\s*)?<img[^>]*HOMEZAI_WORDMARK[^>]*\/>/g,
  ) ?? []
  assert.equal(
    homeLinkedMarks.length,
    2,
    'both the header and the footer wordmark must be wrapped in a <Link to="/"> home link',
  )
})

test('the header logo link meets the 44px interactive target floor', () => {
  /*
   * The navbar is 72px tall, so there is room for a compliant target without
   * changing the header height. The rendered box is verified in a real browser
   * as well, this guards the rule from being deleted from the stylesheet.
   */
  const rule = cssSource.match(/\.navbar\s+\.nav-logo\s*\{[^}]*\}/)
  assert.ok(rule, '.navbar .nav-logo must declare an explicit interactive target')
  const min = rule[0].match(/min-height:\s*(\d+)px/)
  assert.ok(min, '.navbar .nav-logo must set a min-height')
  assert.ok(
    Number(min[1]) >= 44,
    `header logo link target must be at least 44px, got ${min[1]}px`,
  )
})
