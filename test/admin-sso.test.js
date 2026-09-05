import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(root, 'public/admin/config.yml')
const indexPath = join(root, 'public/admin/index.html')

const config = readFileSync(configPath, 'utf8')
const html = readFileSync(indexPath, 'utf8')

const loadConfig = async () => {
  // js-yaml here is the old CommonJS build, so it has no ES default export.
  const module = await import('js-yaml')
  const yaml = module.default ?? module
  return yaml.load(config)
}

/*
 * These fail against the architecture that shipped in Task 11, which is the point.
 * That editor asked each publisher for a fine-grained GitHub personal access token
 * and then talked to api.github.com with it. Every assertion below is a statement
 * that it no longer does either of those things.
 */

describe('the paste-a-token sign in is gone, not merely discouraged', () => {
  test('the only sign in method offered is the Homezai relay', async () => {
    const parsed = await loadConfig()
    assert.deepEqual(parsed.backend.auth_methods, ['oauth'])
  })

  test('nothing in the editor page or config mentions a personal access token', () => {
    // The whole friction this task removes. A leftover instruction would be a
    // person still being asked for a credential that no longer does anything.
    const settings = config.replace(/^\s*#.*$/gm, '')
    assert.doesNotMatch(settings, /personal access token/i)
    assert.doesNotMatch(html, /personal access token/i)
    assert.doesNotMatch(html, /paste/i)
  })
})

describe('the editor talks to Homezai and not to GitHub', () => {
  test('the REST root is the Homezai broker', async () => {
    const parsed = await loadConfig()
    const root = new URL(parsed.backend.api_root)
    assert.equal(root.protocol, 'https:')
    assert.equal(root.hostname, 'api.dev.homezyai.com')
    assert.ok(root.pathname.startsWith('/api/v1/blog-editor/gh'))
  })

  test('the GraphQL root is the Homezai broker', async () => {
    const parsed = await loadConfig()
    const root = new URL(parsed.backend.graphql_api_root)
    assert.equal(root.hostname, 'api.dev.homezyai.com')
    assert.ok(root.pathname.startsWith('/api/v1/blog-editor/gh'))
  })

  test('neither root points at api.github.com', async () => {
    const parsed = await loadConfig()
    for (const key of ['api_root', 'graphql_api_root', 'base_url']) {
      assert.doesNotMatch(
        String(parsed.backend[key]),
        /api\.github\.com|(^|\/\/)github\.com/,
        `backend.${key} still points at GitHub`,
      )
    }
  })

  /*
   * The editor computes these two URLs from the roots above. Its rules were read out
   * of the deployed bundle: it appends "/api/v3" to any REST root that does not
   * already end in it, and it requires the GraphQL root to end in "/graphql". Writing
   * the roots in their final form means the editor changes nothing, which is the only
   * version of this that can be checked from here.
   */
  test('the configured roots are already in the form the editor will use', async () => {
    const parsed = await loadConfig()

    const restRoot = (value) => {
      const root = value.replace(/\/+$/, '')
      if (root === 'https://api.github.com' || root.endsWith('/api/v3')) return root
      if (root.endsWith('/api')) return `${root}/v3`
      return `${root}/api/v3`
    }
    const graphqlRoot = (value) => {
      const root = value.replace(/\/+$/, '')
      if (root === 'https://api.github.com') return `${root}/graphql`
      if (root.endsWith('/graphql')) return root
      if (root.endsWith('/api/v3')) return root.replace('/api/v3', '/graphql')
      if (root.endsWith('/api')) return `${root}/graphql`
      return `${root}/api/graphql`
    }

    assert.equal(restRoot(parsed.backend.api_root), parsed.backend.api_root)
    assert.equal(
      graphqlRoot(parsed.backend.graphql_api_root),
      parsed.backend.graphql_api_root,
    )
  })
})

describe('sign in goes through the Homezai application', () => {
  test('the relay lives on the origin that holds the Homezai session', async () => {
    const parsed = await loadConfig()
    assert.equal(parsed.backend.base_url, 'https://app.homezai.com')
    assert.equal(parsed.backend.auth_endpoint, 'api/blog-editor/authorize')
  })

  test('the site domain is stated rather than left to the browser', async () => {
    const parsed = await loadConfig()
    assert.equal(parsed.backend.site_domain, 'homezai.com')
  })
})

describe('the page still holds no credential and decides nothing', () => {
  test('no credential-shaped literal appears', () => {
    for (const pattern of [
      /gh[pousr]_[A-Za-z0-9]{16,}/,
      /github_pat_[A-Za-z0-9_]{20,}/,
      /hzbe1\.[A-Za-z0-9_-]{8,}/,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /client_secret\s*[:=]\s*['"]?\S/i,
    ]) {
      assert.doesNotMatch(html, pattern)
      assert.doesNotMatch(config, pattern)
    }
  })

  /*
   * The one that matters. The access check in this page is a rendering decision and
   * must never become the boundary, so it must not be the kind of check that could
   * be mistaken for one: no role name, no email test, no domain suffix test, and
   * nothing read out of storage.
   */
  test('the page contains no client-side authorization rule', () => {
    const script = html.slice(html.indexOf('<script type="module">'))
    for (const forbidden of [
      /isAdmin/,
      /is_homezai_admin/,
      /@homezai\.com['"]/,
      /endsWith\(\s*['"]@/,
      /localStorage/,
      /sessionStorage/,
      /role\s*===/,
    ]) {
      assert.doesNotMatch(script, forbidden, `the page decides for itself: ${forbidden}`)
    }
  })

  test('the page says out loud that its check is not the boundary', () => {
    assert.match(html, /RENDERING\s*\n?\s*decision/i)
  })
})

describe('the four states a person can be in are distinct', () => {
  const script = html.slice(html.indexOf('<script type="module">'))

  test('signed out, unauthorized and unavailable are separate outcomes', () => {
    for (const state of ['signed_out', 'not_authorized', 'unavailable', 'ok']) {
      assert.match(script, new RegExp(`'${state}'`), `${state} is not handled`)
    }
  })

  test('being refused does not tell a signed-in administrator to sign in again', () => {
    // Anchored on the STATES table rather than on the first mention of the word,
    // because the comment above it names the state in order to explain it.
    const start = script.indexOf('not_authorized: {')
    assert.ok(start !== -1, 'there is no not_authorized state')
    const block = script.slice(start, script.indexOf('unavailable: {'))
    // The copy is a concatenation of source lines, so match the phrases rather
    // than a sentence that only exists once the strings are joined.
    assert.match(block, /limited to Homezai/)
    assert.match(block, /administrators/)
    assert.match(block, /check your access/)
    assert.doesNotMatch(block, /sign in again/i)
    assert.doesNotMatch(block, /Sign in with/i)
  })

  test('an outage says it is us, and is not reported as a refusal', () => {
    const start = script.indexOf('unavailable: {')
    assert.ok(start !== -1, 'there is no unavailable state')
    const block = script.slice(start, start + 600)
    assert.match(block, /not with your account/i)
    assert.doesNotMatch(block, /administrator/i)
  })

  test('a failed probe becomes unavailable and never becomes ok', () => {
    const start = script.indexOf('} catch {')
    const block = script.slice(start, start + 400)
    assert.match(block, /return 'unavailable'/)
    assert.doesNotMatch(block, /return 'ok'/)
  })

  test('there is no fallback to public access or a token prompt', () => {
    // Comments are stripped first: the page states the rule in prose, and a
    // whole-file grep would either trip on that sentence or be loosened until it
    // could not fail at all.
    const code = script
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    for (const forbidden of [/prompt\(/, /accessToken/, /access_token/, /window\.token/]) {
      assert.doesNotMatch(code, forbidden, `the page handles a credential: ${forbidden}`)
    }
  })
})

describe('the sign in button does not say GitHub to a Homezai administrator', () => {
  test('the label is corrected', () => {
    assert.match(html, /Sign in with Homezai/)
  })

  test('the correction is described as cosmetic, so nobody later relies on it', () => {
    assert.match(html, /cosmetic and nothing depends on it/i)
  })
})
