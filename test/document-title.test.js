import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import test from 'node:test'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appSource = readFileSync(path.join(repoRoot, 'src', 'App.jsx'), 'utf8')
const indexHtml = readFileSync(path.join(repoRoot, 'index.html'), 'utf8')

/*
 * This site is a single page app, so the browser tab is only ever correct
 * because a component assigns document.title on mount. That made a silent
 * failure possible: every subpage set its own title, nothing set it back, and
 * clicking the header wordmark home from /pricing left the tab reading "Plans
 * and Pricing" while the home page was on screen. Nothing in the suite could
 * see it, because a missing assignment looks exactly like a page that has no
 * opinion about its title.
 *
 * These tests are source level on purpose. The repository has no DOM test
 * environment and adding one would be a new dependency for a one line
 * behaviour, so the guard asserts the shape of the code that produces the
 * behaviour instead.
 */

/** The name of every component mounted by a <Route element={<X />} />. */
function routedComponents() {
  const names = []
  for (const m of appSource.matchAll(/<Route\s[^>]*element=\{<([A-Z][A-Za-z0-9]*)\s*\/>\}/g)) {
    names.push(m[1])
  }
  return names
}

/**
 * Source of one top level function declaration, found by brace matching from
 * its opening brace so a nested function or JSX block cannot end it early.
 */
function functionBody(name) {
  const start = appSource.indexOf(`function ${name}(`)
  assert.notEqual(start, -1, `App.jsx declares no function ${name}`)
  const open = appSource.indexOf('{', start)
  assert.notEqual(open, -1, `function ${name} has no body`)
  let depth = 0
  for (let i = open; i < appSource.length; i += 1) {
    const ch = appSource[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return appSource.slice(start, i + 1)
    }
  }
  throw new Error(`function ${name} is never closed`)
}

/** The literal title text index.html ships in its <title> element. */
function shippedTitle() {
  const m = indexHtml.match(/<title>([^<]+)<\/title>/)
  assert.ok(m, 'index.html has no <title> element')
  return m[1].trim()
}

test('index.html ships a non empty title for the app to capture', () => {
  // Without this the drift test below would pass on an empty string, which
  // would make it a check that can never fail.
  assert.ok(shippedTitle().length > 10, 'index.html <title> is missing or too short')
})

test('every routed page component sets the document title', () => {
  const routed = routedComponents()
  assert.ok(
    routed.length >= 8,
    `expected the router to mount at least 8 page components, found ${routed.length}`,
  )
  for (const name of routed) {
    assert.match(
      functionBody(name),
      /document\.title\s*=/,
      `${name} is mounted by a route but never sets document.title, so navigating ` +
        'to it leaves the previous page name in the browser tab',
    )
  }
})

test('the home page restores the title index.html shipped', () => {
  const home = functionBody('HomePage')
  assert.match(
    home,
    /document\.title\s*=\s*SITE_TITLE/,
    'HomePage must restore SITE_TITLE, otherwise clicking the header wordmark ' +
      'home from a subpage leaves that subpage name in the tab',
  )
  assert.match(
    home,
    /useEffect\(/,
    'HomePage must assign the title from an effect, not during render',
  )
})

test('the shipped title is captured once at module scope, not inside a component', () => {
  const declaration = appSource.indexOf('const SITE_TITLE')
  assert.notEqual(declaration, -1, 'App.jsx does not capture SITE_TITLE')
  const firstFunction = appSource.indexOf('\nfunction ')
  assert.notEqual(firstFunction, -1, 'App.jsx declares no functions')
  assert.ok(
    declaration < firstFunction,
    'SITE_TITLE must be read at module scope, before any page component has had ' +
      'a chance to overwrite document.title',
  )
})

test('the site title is captured, never copied, so it cannot drift', () => {
  assert.ok(
    !appSource.includes(shippedTitle()),
    'App.jsx repeats the index.html title as a literal. Capture document.title ' +
      'instead so index.html stays the single source of truth',
  )
})
