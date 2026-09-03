import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

import { integrationCategories } from '../src/integrationsData.js'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = path.join(repoRoot, 'public')

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
  { name: 'CincyMLS', desc: 'MLS of Greater Cincinnati', logo: null },
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
  assert.ok(withLogos.length >= 3, 'expected at least the three supplied partner logos')
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

test('every card has a non-empty name and description and no duplicate names', () => {
  const names = allItems().map((i) => i.name)
  assert.equal(new Set(names).size, names.length, 'duplicate integration names present')
  for (const item of allItems()) {
    assert.ok(item.name && item.name.trim().length > 0)
    assert.ok(item.desc && item.desc.trim().length > 0, `"${item.name}" has no description`)
  }
})
