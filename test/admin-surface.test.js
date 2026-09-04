import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const configPath = join(root, 'public/admin/config.yml')
const indexPath = join(root, 'public/admin/index.html')

/**
 * The editor page is served from the public site, so anyone can read every byte of it.
 * That is fine, and these tests are what keep it fine: the page must be inert, it must
 * carry no credential, and the boundary it relies on must be GitHub's rather than its
 * own rendering.
 */

describe('the editor surface exists', () => {
  test('the admin entry point is committed', () => {
    assert.ok(existsSync(indexPath), 'public/admin/index.html is missing')
    assert.ok(existsSync(configPath), 'public/admin/config.yml is missing')
  })
})

describe('the editor page carries no secret', () => {
  const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''
  const config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : ''

  for (const [label, pattern] of [
    ['a GitHub classic token', /gh[pousr]_[A-Za-z0-9]{16,}/],
    ['a GitHub fine grained token', /github_pat_[A-Za-z0-9_]{20,}/],
    ['an AWS access key id', /AKIA[0-9A-Z]{16}/],
    ['a private key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
    ['a bearer literal', /Authorization:\s*(Bearer|token)\s+\S/i],
    ['a client secret assignment', /client_secret\s*[:=]\s*['"]?\S/i],
  ]) {
    test(`${label} does not appear in the admin page or config`, () => {
      assert.doesNotMatch(html, pattern)
      assert.doesNotMatch(config, pattern)
    })
  }
})

describe('the editor is pointed at the private content repository', () => {
  const config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : ''

  test('the backend is github', () => {
    assert.match(config, /^\s*name:\s*github\s*$/m)
  })

  test('the content repository is not the public site repository', () => {
    const repo = config.match(/^\s*repo:\s*(\S+)\s*$/m)
    assert.ok(repo, 'no repo configured')
    assert.notEqual(
      repo[1],
      'frankhli843/homezai_landing_page',
      'drafts would be world readable if the CMS wrote to the public site repository',
    )
    assert.match(repo[1], /^[\w.-]+\/[\w.-]+$/)
  })

  test('posts and media are written inside the content repository, not into the site', () => {
    assert.match(config, /^\s*folder:\s*content\/posts\s*$/m)
    assert.match(config, /^\s*media_folder:\s*content\/media\s*$/m)
  })

  test('the public media path is where the site actually serves published images from', () => {
    assert.match(config, /^\s*public_folder:\s*\/blog-media\s*$/m)
  })
})

describe('the editor never implies a capability the system does not have', () => {
  const config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : ''
  const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''

  /*
   * The rule is that the editor must not offer a capability the pipeline does not have.
   * Saying plainly that publishing is immediate is the opposite of that, and is wanted,
   * so the check is aimed at fields and labels rather than at the word appearing at all.
   */
  test('no field and no control offers scheduling, because publishing is immediate', () => {
    for (const [, value] of config.matchAll(/^\s*(?:-\s*)?(?:name|label|label_singular):\s*(.+)$/gm)) {
      assert.doesNotMatch(value, /schedul/i, `a field or label offers scheduling: ${value}`)
    }
    assert.doesNotMatch(html, /schedul/i)
  })

  test('the config states plainly that publishing is immediate', () => {
    assert.match(config, /publishing is immediate/i)
  })

  test('status is a select offering exactly draft and published', () => {
    assert.match(config, /name:\s*status/)
    assert.match(config, /^\s*(?:-\s*)?value:\s*draft\s*$/m)
    assert.match(config, /^\s*(?:-\s*)?value:\s*published\s*$/m)
    const values = [...config.matchAll(/^\s*(?:-\s*)?value:\s*(\w+)\s*$/gm)].map((m) => m[1])
    assert.deepEqual([...new Set(values)].sort(), ['draft', 'published'])
  })

  test('alt text is a field in the editor, not merely validated later', () => {
    assert.match(config, /name:\s*heroImageAlt/)
  })

  test('the editor cannot write anywhere outside the two content directories', () => {
    for (const folder of [...config.matchAll(/^\s*(?:folder|media_folder):\s*(\S+)\s*$/gm)].map((m) => m[1])) {
      assert.match(folder, /^content\//, `${folder} is outside the content directories`)
      assert.doesNotMatch(folder, /\.\./)
    }
  })
})

describe('the admin page is excluded from public discovery', () => {
  test('the admin page asks not to be indexed', () => {
    const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''
    assert.match(html, /<meta\s+name="robots"\s+content="noindex, ?nofollow">/)
  })

  test('nothing on the public site links to the editor', () => {
    const app = readFileSync(join(root, 'src/App.jsx'), 'utf8')
    assert.doesNotMatch(app, /["'`]\/admin/)
  })
})

/*
 * An editor must not offer a control the pipeline will refuse. Every one of these was
 * a real defect found by opening the deployed editor and using it: the picker opened
 * on stock photo providers, and then on "Enter URL", both of which produce an image
 * the publish step rejects, so the publisher only learns it was never allowed at the
 * moment they try to go live.
 */
describe('the editor offers no control the publish step will refuse', () => {
  const config = existsSync(configPath) ? readFileSync(configPath, 'utf8') : ''

  test('no stock photo provider is offered, because only uploaded images publish', () => {
    assert.match(config, /^\s*stock_assets:\s*$/m)
    assert.match(config, /^\s*providers:\s*\[\]\s*$/m)
    // Comments are stripped first. The file explains in prose why these providers are
    // not offered, and that sentence is worth keeping; a provider actually configured
    // is the thing being refused here.
    const settings = config.replace(/^\s*#.*$/gm, '')
    assert.doesNotMatch(settings, /unsplash|pexels|pixabay/i)
  })

  test('the hero image field does not offer a typed in web address', () => {
    const hero = config.slice(config.indexOf('- name: heroImage'))
    const field = hero.slice(0, hero.indexOf('- name: heroImageAlt'))
    assert.match(field, /^\s*choose_url:\s*false\s*$/m, 'the hero picker still offers Enter URL')
  })
})

/*
 * The Preview pane. Sveltia's default is a labelled dump of every field, which is a
 * view of the form rather than of the article, so it is replaced. These checks are
 * about the wiring only; what the preview draws is covered by admin-preview.test.js.
 */
describe('the editor previews the article a reader would see', () => {
  const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : ''
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

  test('the editor page loads the preview', () => {
    assert.match(html, /<script src="\/admin\/preview\.js" type="module"><\/script>/)
  })

  test('the preview is built before the site build copies public/', () => {
    assert.ok(pkg.scripts['build:admin'], 'there is no build:admin step')
    const chain = pkg.scripts.build
    assert.ok(chain.includes('build:admin'), 'the build chain never builds the preview')
    assert.ok(
      chain.indexOf('build:admin') < chain.indexOf('vite build &&'),
      'the preview is built after public/ has already been copied, so it would not ship',
    )
  })

  test('the built preview is never committed, so it cannot disagree with its source', () => {
    const ignored = readFileSync(join(root, '.gitignore'), 'utf8')
    assert.match(ignored, /^public\/admin\/preview\.js$/m)
  })

  test('the preview source is present to build from', () => {
    assert.ok(existsSync(join(root, 'src/admin/preview.js')))
    assert.ok(existsSync(join(root, 'src/admin/previewTemplate.js')))
    assert.ok(existsSync(join(root, 'vite.admin.config.js')))
  })
})
