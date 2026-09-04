import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import {
  buildPreviewHtml,
  collectFields,
  formatPreviewDate,
  makeElementFactory,
  readField,
  resolveHeroSource,
  MEDIA_PREFIX,
} from '../src/admin/previewTemplate.js'
import { renderMarkdown } from '../src/content/markdown.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * The editor's Preview pane.
 *
 * Sveltia's default preview is a labelled dump of the form: Internal id, Web address,
 * Home page order, Previous web addresses. A publisher deciding whether an article is
 * ready cannot answer the only question that matters from that, which is what the
 * reader will see, so it is replaced with the article itself.
 *
 * A preview is only worth having if it cannot lie. These tests exist to pin the two
 * ways this one could: rendering the body with a different renderer than the published
 * page uses, and dressing it with a hand copied subset of the real stylesheet.
 */

function fields(overrides = {}) {
  return {
    title: 'How Homezai routes a showing',
    slug: 'how-homezai-routes-a-showing',
    excerpt: 'A short summary used on cards and as the description.',
    body: 'Some body copy.',
    author: 'Nina Fabbri',
    status: 'draft',
    publishedAt: '',
    updatedAt: '',
    heroSrc: 'blob:https://homezai.com/abc',
    heroAlt: 'A map of a routed sequence of visits',
    heroDecorative: false,
    featured: false,
    seoTitle: '',
    seoDescription: '',
    ...overrides,
  }
}

describe('the preview shows the article, not the form', () => {
  const html = buildPreviewHtml(fields())

  test('it renders the reader facing article structure', () => {
    for (const marker of [
      'class="blog-page"',
      'class="article"',
      'class="article-header"',
      'class="article-hero"',
      'class="article-body"',
      '<h1>',
    ]) {
      assert.ok(html.includes(marker), `the preview is missing ${marker}`)
    }
  })

  test('it uses the same element and class structure as the published article page', () => {
    const page = readFileSync(join(root, 'src/Blog.jsx'), 'utf8')
    for (const className of ['blog-page', 'article-header', 'article-container', 'article-eyebrow', 'article-meta', 'article-hero', 'article-body']) {
      assert.ok(
        page.includes(`"${className}"`),
        `the preview dresses itself as .${className}, which src/Blog.jsx no longer renders`,
      )
    }
  })

  test('none of the editor bookkeeping fields are shown as labelled values', () => {
    for (const label of ['Internal id', 'Home page order', 'Previous web addresses', 'Search title override']) {
      assert.ok(!html.includes(label), `the preview still dumps the field "${label}"`)
    }
  })
})

describe('the preview body is rendered by the site renderer, not a second one', () => {
  test('the body html is exactly what the published page would print', () => {
    const body = '## A heading\n\n- one\n- two\n\n> A quote\n\n[A link](https://example.com/)'
    const html = buildPreviewHtml(fields({ body }))
    assert.ok(html.includes(renderMarkdown(body)), 'the preview body differs from the published body')
  })

  test('pasted html is shown as inert text, exactly as the live page shows it', () => {
    const body = 'Before\n\n<script>alert(1)</script>\n\nAfter'
    const html = buildPreviewHtml(fields({ body }))
    assert.ok(!/<script>alert\(1\)<\/script>/.test(html), 'the preview would execute what the live page escapes')
    assert.ok(html.includes('&lt;script&gt;'), 'the preview does not show the escaped tag the reader would see')
  })

  test('the module imports the real renderer rather than defining its own', () => {
    const source = readFileSync(join(root, 'src/admin/previewTemplate.js'), 'utf8')
    assert.match(source, /from '\.\.\/content\/markdown\.js'/)
    assert.ok(!/new MarkdownIt|markdown-it/.test(source), 'the preview builds a second renderer of its own')
  })

  test('the preview is dressed with the real stylesheet, not a copy of it', () => {
    const source = readFileSync(join(root, 'src/admin/preview.js'), 'utf8')
    assert.match(source, /from '\.\.\/App\.css\?raw'/)
    assert.match(source, /registerPreviewStyle\(\s*styles/)
  })
})

describe('every value a person typed is escaped', () => {
  const attack = '"><img src=x onerror=alert(1)>'
  for (const field of ['title', 'author', 'heroAlt', 'seoTitle', 'seoDescription', 'slug']) {
    test(`${field} cannot break out of the markup`, () => {
      const html = buildPreviewHtml(fields({ [field]: attack, heroSrc: 'blob:x' }))
      assert.ok(!html.includes('onerror=alert(1)>'), `${field} escaped its context`)
      assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'))
    })
  }

  test('a hostile hero source cannot break out of the src attribute', () => {
    const html = buildPreviewHtml(fields({ heroSrc: '" onerror="alert(1)' }))
    assert.ok(!html.includes('onerror="alert(1)"'))
  })
})

describe('the preview tells the publisher what state the article is in', () => {
  test('a draft says plainly that nobody else can see it', () => {
    const html = buildPreviewHtml(fields({ status: 'draft' }))
    assert.match(html, /Draft/)
    assert.match(html, /Nobody outside this editor can see this/)
    assert.ok(html.includes('https://homezai.com/blog/how-homezai-routes-a-showing/'))
  })

  test('a published article says it is live, and at which address', () => {
    const html = buildPreviewHtml(fields({ status: 'published', publishedAt: '2026-09-04T12:00:00.000Z' }))
    assert.match(html, /Published/)
    assert.match(html, /This is live at/)
    assert.ok(!/Nobody outside this editor/.test(html))
  })

  test('a featured article says it is on the home page', () => {
    assert.match(buildPreviewHtml(fields({ featured: true })), /Selected for the home page/)
    assert.ok(!/Selected for the home page/.test(buildPreviewHtml(fields({ featured: false }))))
  })
})

describe('the preview refuses to hide a problem that would block publishing', () => {
  test('a missing hero is called out rather than drawn as a broken image', () => {
    const html = buildPreviewHtml(fields({ heroSrc: '' }))
    assert.ok(!/<img/.test(html.split('preview-share')[0]), 'a broken image was drawn for a missing hero')
    assert.match(html, /No hero image yet/)
  })

  test('an image with no description is called out before publishing, not after', () => {
    const html = buildPreviewHtml(fields({ heroAlt: '   ' }))
    assert.match(html, /This image has no description/)
  })

  test('a deliberately decorative image is not nagged about, and gets an empty alt', () => {
    const html = buildPreviewHtml(fields({ heroAlt: '', heroDecorative: true }))
    assert.ok(!/This image has no description/.test(html))
    assert.match(html, /<img src="blob:https:\/\/homezai\.com\/abc" alt=""/)
  })

  test('a described image is not nagged about', () => {
    assert.ok(!/This image has no description/.test(buildPreviewHtml(fields())))
  })
})

describe('the preview shows what a shared link will look like', () => {
  test('the share card falls back to the title and summary', () => {
    const html = buildPreviewHtml(fields())
    assert.ok(html.includes('How Homezai routes a showing'))
    assert.ok(html.includes('A short summary used on cards and as the description.'))
    assert.ok(html.includes('homezai.com'))
  })

  test('the overrides win where a publisher set them, because that is what crawlers get', () => {
    const html = buildPreviewHtml(fields({ seoTitle: 'A different share title', seoDescription: 'A different share summary' }))
    const card = html.slice(html.indexOf('preview-share-card'))
    assert.ok(card.includes('A different share title'))
    assert.ok(card.includes('A different share summary'))
  })

  test('an article with no summary yet is told so, rather than shown an empty card', () => {
    const html = buildPreviewHtml(fields({ excerpt: '' }))
    assert.match(html, /No summary yet/)
  })
})

describe('dates are honest about an article that has never been published', () => {
  test('an unpublished article does not invent a date', () => {
    assert.equal(formatPreviewDate(''), 'Not published yet')
    assert.equal(formatPreviewDate(null), 'Not published yet')
    assert.equal(formatPreviewDate('not a date'), 'Not published yet')
  })

  test('a published instant is printed in UTC, not in the publisher local day', () => {
    assert.equal(formatPreviewDate('2026-09-04T02:00:00.000Z'), 'September 4, 2026')
    assert.equal(formatPreviewDate('2026-09-04T23:30:00.000Z'), 'September 4, 2026')
  })

  test('an updated article shows the update line only when it really was updated', () => {
    const same = '2026-09-04T12:00:00.000Z'
    assert.ok(!/article-updated/.test(buildPreviewHtml(fields({ publishedAt: same, updatedAt: same }))))
    assert.match(
      buildPreviewHtml(fields({ publishedAt: same, updatedAt: '2026-09-05T12:00:00.000Z' })),
      /article-updated/,
    )
  })
})

describe('the hero is resolved from the most certain source available', () => {
  test('the file the publisher just chose wins, because nothing else has it yet', () => {
    const url = resolveHeroSource({ fileObj: new Blob(['x']) }, '/blog-media/a.jpg', 'https://cached/thumb')
    assert.match(url, /^blob:/)
  })

  test('the editor cached thumbnail is next, which is the only copy of an unpublished hero', () => {
    assert.equal(resolveHeroSource(undefined, '/blog-media/a.jpg', 'https://cached/thumb'), 'https://cached/thumb')
  })

  test('the published url is last, and only exists once the article has been published', () => {
    assert.equal(resolveHeroSource(undefined, '/blog-media/a.jpg', ''), 'https://homezai.com/blog-media/a.jpg')
  })

  test('no source at all resolves to nothing, so the caller can draw the placeholder', () => {
    assert.equal(resolveHeroSource(undefined, '', ''), '')
    assert.equal(resolveHeroSource(undefined, undefined, ''), '')
  })

  test('the media prefix is the one the site actually serves published images from', () => {
    assert.equal(MEDIA_PREFIX, '/blog-media/')
  })
})

describe('the preview degrades instead of leaving an empty pane', () => {
  test('fields are read from the editor immutable entry', () => {
    const entry = { getIn: (path) => ({ title: 'T', slug: 's', featured: true })[path[1]] }
    const read = collectFields(entry)
    assert.equal(read.title, 'T')
    assert.equal(read.slug, 's')
    assert.equal(read.featured, true)
  })

  test('a plain object entry is accepted too, so a change of shape is not fatal', () => {
    assert.equal(collectFields({ data: { title: 'T' } }).title, 'T')
  })

  test('a missing or throwing entry yields empty fields rather than an exception', () => {
    assert.equal(readField(undefined, 'title'), undefined)
    assert.equal(readField({ getIn: () => { throw new Error('gone') } }, 'title'), undefined)
    assert.doesNotThrow(() => collectFields(null))
  })

  test('an untitled article still renders', () => {
    assert.match(buildPreviewHtml(fields({ title: '', body: '' })), /Untitled article/)
  })

  test('the element factory copies the shape of a real element, and refuses to guess', () => {
    const marker = Symbol.for('react.transitional.element')
    const element = makeElementFactory({ $$typeof: marker })('div', { id: 'x' })
    assert.equal(element.$$typeof, marker)
    assert.equal(element.type, 'div')
    assert.deepEqual(element.props, { id: 'x' })
    assert.equal(makeElementFactory(null), null)
    assert.equal(makeElementFactory({}), null)
  })
})
