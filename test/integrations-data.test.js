import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

import { integrationCategories } from '../src/integrationsData.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(repoRoot, 'public')
const distDir = path.join(repoRoot, 'dist')

const CINCYMLS_LOGO = '/images/integrations/cincymls.png'

/*
 * sha256 of the CincyMLS artwork exactly as Frank supplied it on 2026-09-04.
 * Pinning the digest, not just the path, is what catches a silent re-encode,
 * a resize, a recolour, or somebody swapping in a lookalike they found online.
 */
const CINCYMLS_LOGO_SHA256 =
  '550e8671bd3be15cd95628bf78bd7006dfb19374d24e16daee2cb9b0e1ebd902'

/* The supplied file's real pixel dimensions, read straight out of the PNG
 * IHDR chunk. The card frame relies on 595:336 being wider than it is tall. */
const CINCYMLS_LOGO_WIDTH = 595
const CINCYMLS_LOGO_HEIGHT = 336

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/* Minimal PNG header reader: bytes 16..24 of a PNG are the IHDR width and
 * height as big-endian uint32s. Avoids adding an image dependency to a repo
 * whose test command is a bare `node --test`. */
function pngSize(file) {
  const buf = readFileSync(file)
  assert.equal(
    buf.subarray(0, 8).toString('latin1'),
    '\x89PNG\r\n\x1a\n',
    `${file} is not a PNG`,
  )
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const MLS_CATEGORY = 'Multiple Listing Service (MLS)'

function mlsItems() {
  const cat = integrationCategories.find((c) => c.name === MLS_CATEGORY)
  assert.ok(cat, `category "${MLS_CATEGORY}" is missing`)
  return cat.items
}

function allItems() {
  return integrationCategories.flatMap((c) => c.items)
}

/*
 * The exact organizations Brian Schoedel asked for on 2026-09-01 in the
 * "Homezai website Integrations" email. Ohio is one established integration
 * (the brand plus its formal description), Florida is the renamed
 * Bonita-Estero board, and Alabama is two separate organizations.
 */
const REQUIRED_MLS = [
  { name: 'CincyMLS', desc: 'MLS of Greater Cincinnati', logo: CINCYMLS_LOGO },
  {
    name: 'Coconut Coast Organization of REALTORS®',
    desc: 'Formerly Bonita-Estero REALTORS®',
    logo: '/images/integrations/coconut-coast-organization-of-realtors.png',
  },
  {
    name: 'Baldwin County Association of REALTORS®',
    desc: 'Baldwin County, Alabama',
    logo: '/images/integrations/baldwin-county-association-of-realtors.png',
  },
  {
    name: 'Gulf Coast MLS - Mobile Area Association of REALTORS®',
    desc: 'Mobile area, Alabama',
    logo: '/images/integrations/gulf-coast-mls-mobile-area-association-of-realtors.jpg',
  },
]

test('the MLS category lists exactly the four requested organizations, in order', () => {
  assert.deepEqual(
    mlsItems().map((i) => i.name),
    REQUIRED_MLS.map((i) => i.name),
  )
})

test('each requested MLS card carries its expected description and logo binding', () => {
  const byName = new Map(mlsItems().map((i) => [i.name, i]))
  for (const expected of REQUIRED_MLS) {
    const actual = byName.get(expected.name)
    assert.ok(actual, `missing MLS card "${expected.name}"`)
    assert.equal(actual.desc, expected.desc, `wrong description for "${expected.name}"`)
    assert.equal(
      actual.logo ?? null,
      expected.logo,
      `wrong logo binding for "${expected.name}"`,
    )
  }
})

test('Cincinnati is one card, not a duplicate pair', () => {
  const cincinnatiish = mlsItems().filter((i) =>
    /cincy|cincinnati/i.test(`${i.name} ${i.desc}`),
  )
  assert.equal(
    cincinnatiish.length,
    1,
    `expected a single Cincinnati card, got ${JSON.stringify(cincinnatiish.map((i) => i.name))}`,
  )
})

test('Baldwin County and Gulf Coast stay two distinct cards', () => {
  const alabama = mlsItems().filter((i) => /baldwin|gulf coast/i.test(i.name))
  assert.equal(alabama.length, 2)
  assert.notEqual(alabama[0].name, alabama[1].name)
})

test('the stale Florida naming never comes back anywhere in the page data', () => {
  // "SWFL" and "Southwest Florida MLS" were never real names and must not
  // appear at all, in a card name or a description.
  const haystack = allItems().map((i) => `${i.name} ${i.desc}`).join('\n')
  for (const stale of [/SWFL/i, /Southwest Florida MLS/i]) {
    assert.equal(stale.test(haystack), false, `stale label ${stale} is present in the data`)
  }

  // Bonita-Estero is a real former name, so it is allowed to survive only as a
  // "Formerly ..." historical note. It must never be a card's own name, and
  // must never stand alone as a description the way the old SWFL card had it.
  for (const item of allItems()) {
    assert.equal(
      /bonita/i.test(item.name),
      false,
      `"${item.name}" still uses the retired Bonita-Estero name as its own name`,
    )
    if (/bonita/i.test(item.desc)) {
      assert.match(
        item.desc,
        /^Formerly /,
        `"${item.name}" mentions Bonita-Estero without marking it as a former name (got: ${item.desc})`,
      )
    }
  }
})

test('every referenced logo is a committed local asset that exists on disk', () => {
  const withLogos = allItems().filter((i) => i.logo)
  assert.ok(withLogos.length >= 4, 'expected at least the four supplied partner logos')
  for (const item of withLogos) {
    assert.ok(
      item.logo.startsWith('/images/integrations/'),
      `"${item.name}" logo must be served from our own /images/integrations/ directory, got ${item.logo}`,
    )
    assert.equal(
      /^https?:|googleusercontent|mail\.google/i.test(item.logo),
      false,
      `"${item.name}" logo must not hotlink a third party`,
    )
    const onDisk = path.join(publicDir, item.logo.replace(/^\//, ''))
    assert.ok(existsSync(onDisk), `logo file missing from public/: ${onDisk}`)
  }
})

/*
 * Frank supplied the CincyMLS artwork on 2026-09-04, after the first
 * Integrations delivery had already shipped Cincinnati as a text wordmark
 * because no logo existed yet. These four tests are the guard against that
 * temporary treatment coming back, against the file quietly disappearing,
 * against a mistyped path, and against the artwork being re-encoded into
 * something that is no longer the file he sent.
 */
test('the CincyMLS card is bound to our own committed logo, not a wordmark', () => {
  const cincy = mlsItems().find((i) => i.name === 'CincyMLS')
  assert.ok(cincy, 'the CincyMLS card is missing')
  assert.equal(cincy.desc, 'MLS of Greater Cincinnati')
  assert.equal(
    cincy.logo,
    CINCYMLS_LOGO,
    'CincyMLS must render the supplied logo; a null or renamed logo drops the card back to the text wordmark',
  )
  assert.ok(
    cincy.logoAlt && cincy.logoAlt.trim().length > 0,
    'CincyMLS needs alt text so the logo is announced to a screen reader',
  )
  assert.match(cincy.logoAlt, /cincymls/i, `unhelpful CincyMLS alt text: ${cincy.logoAlt}`)
})

test('the committed CincyMLS file is Frank\'s exact supplied artwork', () => {
  const onDisk = path.join(publicDir, CINCYMLS_LOGO.replace(/^\//, ''))
  assert.ok(existsSync(onDisk), `missing committed asset: ${onDisk}`)
  assert.ok(statSync(onDisk).size > 0, `committed asset is empty: ${onDisk}`)
  assert.equal(
    sha256(onDisk),
    CINCYMLS_LOGO_SHA256,
    'the committed CincyMLS PNG is not byte-identical to the artwork Frank supplied',
  )
})

test('the CincyMLS artwork keeps its supplied 595x336 proportions', () => {
  const onDisk = path.join(publicDir, CINCYMLS_LOGO.replace(/^\//, ''))
  assert.deepEqual(pngSize(onDisk), {
    width: CINCYMLS_LOGO_WIDTH,
    height: CINCYMLS_LOGO_HEIGHT,
  })
})

test('a production build carries every referenced logo, byte for byte', (t) => {
  if (!existsSync(distDir)) {
    t.skip('no dist/ present: run `npm run build` first. CI always builds before this runs.')
    return
  }
  const withLogos = allItems().filter((i) => i.logo)
  assert.ok(withLogos.length >= 4, 'expected at least the four supplied partner logos')
  assert.ok(
    withLogos.some((i) => i.logo === CINCYMLS_LOGO),
    'the CincyMLS logo is not referenced at all, so the build cannot contain it',
  )
  for (const item of withLogos) {
    const relative = item.logo.replace(/^\//, '')
    const built = path.join(distDir, relative)
    const source = path.join(publicDir, relative)
    assert.ok(existsSync(built), `the build omitted "${item.name}" logo: ${built}`)
    assert.ok(statSync(built).size > 0, `the built "${item.name}" logo is empty: ${built}`)
    assert.equal(
      sha256(built),
      sha256(source),
      `the built "${item.name}" logo differs from the committed source file`,
    )
  }
})

test('every card has a non-empty name and description and no duplicate names', () => {
  const names = allItems().map((i) => i.name)
  assert.equal(new Set(names).size, names.length, 'duplicate integration names present')
  for (const item of allItems()) {
    assert.ok(item.name && item.name.trim().length > 0)
    assert.ok(item.desc && item.desc.trim().length > 0, `"${item.name}" has no description`)
  }
})
