import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { validatePost, bodyImageTargets } from '../src/content/postSchema.js'
import { renderMarkdown } from '../src/content/markdown.js'

/**
 * Images inside the article body.
 *
 * The hero image has always been refused unless it is a local /blog-media/ asset. The
 * body was not checked at all, so an image inserted with the editor's "Enter URL"
 * control published as a live hotlink: a page on homezai.com serving a file from
 * somebody else's server, which can move, expire, or be replaced with anything at all,
 * and nothing in the pipeline would notice.
 */

function draft(body) {
  return {
    id: '8f14e45f-ceea-467a-9b1b-6f6a0d8bb6f6',
    title: 'How Homezai routes a showing',
    slug: 'how-homezai-routes-a-showing',
    excerpt: 'A short summary used on cards and as the description.',
    body,
    status: 'draft',
    author: 'Homezai Team',
    updatedAt: '2026-09-04T12:00:00.000Z',
  }
}

const bodyErrors = (body) => validatePost(draft(body)).errors.filter((e) => e.field === 'body')

describe('an article may only show images we serve ourselves', () => {
  test('an uploaded image is accepted', () => {
    assert.deepEqual(bodyErrors('Text.\n\n![A routed map](/blog-media/route-a1b2c3d4.jpg)\n'), [])
  })

  for (const [label, body] of [
    ['a stock photo host', 'Text\n\n![Nice house](https://images.unsplash.com/photo-123.jpg)\n'],
    ['plain http', 'Text\n\n![Nice house](http://example.com/house.png)\n'],
    ['a protocol relative url', 'Text\n\n![Nice house](//example.com/house.png)\n'],
    ['a bare hostname path', 'Text\n\n![Nice house](example.com/house.png)\n'],
    ['a path outside the media folder', 'Text\n\n![Logo](/images/homezai-logo.svg)\n'],
    ['a relative escape', 'Text\n\n![Logo](../../secrets/key.png)\n'],
    ['an angle bracketed remote url', 'Text\n\n![House](<https://example.com/a b.png>)\n'],
    ['a remote url carrying a title', 'Text\n\n![House](https://example.com/h.png "A house")\n'],
    ['a reference style image', 'Text\n\n![House][h]\n\n[h]: https://example.com/h.png\n'],
    ['a collapsed reference image', 'Text\n\n![house][]\n\n[house]: https://example.com/h.png\n'],
    ['a shortcut reference image', 'Text\n\n![house]\n\n[house]: https://example.com/h.png\n'],
    ['an indented reference definition', 'Text\n\n![House][h]\n\n   [h]: https://example.com/h.png\n'],
  ]) {
    test(`${label} is refused`, () => {
      const errors = bodyErrors(body)
      assert.equal(errors.length > 0, true, `expected ${label} to be refused`)
      assert.match(errors[0].message, /upload it in the editor|has no file/i)
    })
  }

  test('an image with no file at all is refused rather than published empty', () => {
    assert.equal(bodyErrors('Text\n\n![Alt text]()\n').length, 1)
  })

  test('an ordinary external link is still allowed, because only images are the risk', () => {
    assert.deepEqual(bodyErrors('Read [the CincyMLS page](https://www.cincymls.com/) for more.'), [])
  })

  test('a link definition that no image uses does not fail the article', () => {
    assert.deepEqual(bodyErrors('See [the docs][d].\n\n[d]: https://example.com/docs\n'), [])
  })

  test('the message names the offending image so the publisher can find it', () => {
    const [error] = bodyErrors('![House](https://images.unsplash.com/photo-123.jpg)')
    assert.match(error.message, /https:\/\/images\.unsplash\.com\/photo-123\.jpg/)
  })

  test('a published article carrying a hotlink cannot go live', () => {
    const result = validatePost({
      ...draft('![House](https://images.unsplash.com/photo-123.jpg)'),
      status: 'published',
      publishedAt: '2026-09-04T12:00:00.000Z',
      heroImage: '/blog-media/hero-a1b2c3d4.jpg',
      heroImageAlt: 'A house',
    })
    assert.equal(result.ok, false)
  })
})

/*
 * The scanner above is a regular expression, because postSchema.js is the shared
 * contract and is deliberately dependency free. That buys the wrong kind of risk if it
 * is left alone: drifting NARROWER than markdown-it means an image renders on the live
 * page that validation never saw, which is precisely the hotlink we are refusing.
 *
 * So the two are pinned to each other. Every src the real renderer emits for these
 * bodies must be a target the scanner found. The corpus deliberately includes the
 * shapes a person actually produces by pasting, not only the tidy ones.
 */
describe('the scanner cannot see less than the renderer does', () => {
  const corpus = [
    '![a](https://example.com/a.png)',
    '![a](<https://example.com/a b.png>)',
    '![a](https://example.com/a.png "title")',
    '![](/blog-media/x.jpg)',
    'Inline ![a](https://example.com/a.png) mid sentence.',
    'Two ![a](https://example.com/a.png) and ![b](/blog-media/b.jpg) on one line.',
    '![a][ref]\n\n[ref]: https://example.com/a.png',
    '![ref][]\n\n[ref]: https://example.com/a.png',
    '![ref]\n\n[ref]: https://example.com/a.png',
    '> ![a](https://example.com/a.png)',
    '- ![a](https://example.com/a.png)',
    '[![a](https://example.com/a.png)](https://example.com/)',
    '**![a](https://example.com/a.png)**',
    '# Heading ![a](https://example.com/a.png)',
    '| cell |\n| --- |\n| ![a](https://example.com/a.png) |',
    '![a](https://example.com/a.png)\n![b](https://example.com/b.png)',
    'No images here at all, just [a link](https://example.com/).',
    '`![a](https://example.com/a.png)`',
  ]

  for (const body of corpus) {
    test(`every rendered image is caught: ${JSON.stringify(body.slice(0, 48))}`, () => {
      const rendered = [...renderMarkdown(body).matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map((m) => m[1])
      const found = bodyImageTargets(body)
      for (const src of rendered) {
        assert.ok(
          found.some((target) => target === src || encodeURI(target) === src || target === decodeURI(src)),
          `the renderer emits ${JSON.stringify(src)} but the scanner found ${JSON.stringify(found)}`,
        )
      }
    })
  }

  test('the cross check is not vacuous: the corpus really does render images', () => {
    const total = corpus.reduce(
      (count, body) => count + [...renderMarkdown(body).matchAll(/<img[^>]*\ssrc="/g)].length,
      0,
    )
    assert.ok(total >= 15, `the corpus only rendered ${total} images, so it proves very little`)
  })
})
