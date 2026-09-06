import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { parsePostFile } from '../src/content/postFile.js'
import { planPublishSync } from '../src/content/publishPlan.js'
import { validatePost } from '../src/content/postSchema.js'

/**
 * The name an upload is referred to by, and the name it is published under.
 *
 * These are two different strings and they were never reconciled. The editor keeps the
 * file name a person chose, writes that name into the article, and commits the bytes
 * under it; the publish step derives a safe name from it and indexes the library under
 * the derived name only. The two agree exactly when the person happened to name the
 * file in lowercase hyphenated form already, which is why every synthetic asset used in
 * testing published fine and a real upload called "My_Hero Image.PNG" did not.
 *
 * The failure landed on the next publish as missing_media naming a file that was
 * demonstrably sitting in the media library, so the sentence the operator could see
 * pointed away from the cause.
 *
 * The evidence this is real and not a reading of the source: commit c720b10 in
 * frankhli843/homezai-content uploaded content/media/hz_synthetic_hero.webp and wrote
 * "heroImage: /blog-media/hz_synthetic_hero.webp" into the article in the same commit.
 * safeMediaName publishes those bytes as hz-synthetic-hero.webp.
 */

const PNG = (...tail) => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...tail])
const JPEG = (...tail) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, ...tail])
const WEBP = (...tail) =>
  Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, ...tail])

function article({ slug = 'awkward-names', heroImage, body = 'Public body copy.\n' }) {
  return {
    path: `content/posts/${slug}.md`,
    contents: `---
id: 00000000-0000-4000-8000-00000000000a
title: An article with an illustrated hero
slug: ${slug}
excerpt: One or two sentences used on cards and as the social description.
status: published
author: Homezai Team
publishedAt: 2026-09-01T12:00:00.000Z
updatedAt: 2026-09-02T12:00:00.000Z
heroImage: ${JSON.stringify(heroImage)}
heroImageAlt: A hero image
---

${body}`,
  }
}

const publishedPost = (plan, slug = 'awkward-names') =>
  parsePostFile(
    plan.writes.find((write) => write.path === `content/posts/${slug}.md`).contents,
    `content/posts/${slug}.md`,
  )

/*
 * Every shape a real upload takes. The last row is the positive control: a file already
 * named in the safe form, which resolved before this fix and must still resolve after
 * it. Without that row the whole table would pass on a tree where nothing resolves at
 * all, because every other row would then fail for the same reason it fails today.
 */
const UPLOADS = [
  ['an underscore', 'hz_synthetic_hero.webp', WEBP(1), 'hz-synthetic-hero.webp'],
  ['a space', 'My Hero Image.PNG', PNG(1), 'my-hero-image.png'],
  ['a capital letter', 'HeroShot.JPG', JPEG(1), 'heroshot.jpg'],
  ['a diacritic', 'Café Terrasse.png', PNG(2), 'cafe-terrasse.png'],
  ['nothing needing a rewrite', 'already-safe-hero.jpg', JPEG(2), 'already-safe-hero.jpg'],
]

describe('an upload resolves under the name the editor wrote, whatever it was called', () => {
  for (const [label, uploaded, bytes, published] of UPLOADS) {
    describe(`a file name carrying ${label}`, () => {
      const media = [{ path: `content/media/${uploaded}`, bytes }]
      const files = [article({ heroImage: `/blog-media/${uploaded}` })]
      const plan = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })

      test('the publish is not refused', () => {
        assert.deepEqual(plan.errors, [], JSON.stringify(plan.errors))
      })

      test(`the bytes are published as ${published}`, () => {
        const write = plan.writes.find((w) => w.path === `public/blog-media/${published}`)
        assert.ok(write, `expected a write of public/blog-media/${published}`)
        assert.equal(Buffer.compare(write.contents, bytes), 0)
      })

      test('the published article points at the published name, not the uploaded one', () => {
        assert.equal(publishedPost(plan).heroImage, `/blog-media/${published}`)
      })

      test('nothing is published under the uploaded name', () => {
        assert.equal(
          plan.writes.some((w) => w.path === `public/blog-media/${uploaded}` && uploaded !== published),
          false,
        )
      })
    })
  }
})

describe('a body image resolves too', () => {
  const media = [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(1) }]

  test('a percent escaped body reference resolves and is rewritten', () => {
    const files = [
      article({
        heroImage: '/blog-media/My Hero Image.PNG',
        body: 'Text.\n\n![A routed map](/blog-media/My%20Hero%20Image.PNG)\n',
      }),
    ]
    const plan = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })
    assert.deepEqual(plan.errors, [], JSON.stringify(plan.errors))
    assert.match(publishedPost(plan).body, /!\[A routed map\]\(\/blog-media\/my-hero-image\.png\)/)
    assert.equal(publishedPost(plan).body.includes('%20'), false)
  })
})

describe('the fail closed boundary is unchanged', () => {
  const media = [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(1) }]

  test('an asset that is genuinely absent still refuses the publish', () => {
    const files = [article({ heroImage: '/blog-media/no-such-picture.jpg' })]
    const plan = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })

    const missing = plan.errors.filter((e) => e.kind === 'missing_media')
    assert.equal(missing.length, 1, JSON.stringify(plan.errors))
    assert.deepEqual(plan.writes, [])
    assert.deepEqual(plan.deletes, [])
  })

  test('a reference that resolves to two different uploads refuses rather than guessing', () => {
    // One file called "a%20b.png" and one called "a b.png", so the escaped name and the
    // decoded name are the same string. They publish as a-20b.png and a-b.jpg, which is
    // two different names, so the collision check does not catch this first.
    const ambiguous = [
      { path: 'content/media/a%20b.png', bytes: PNG(3) },
      { path: 'content/media/a b.png', bytes: JPEG(3) },
    ]
    const files = [article({ heroImage: '/blog-media/a b.png' })]
    const plan = planPublishSync({ files, media: ambiguous, now: '2026-09-06T12:00:00.000Z' })

    assert.equal(
      plan.errors.some((e) => e.kind === 'missing_media'),
      true,
      JSON.stringify(plan.errors),
    )
    assert.deepEqual(plan.writes, [])
  })

  test('an upload that is not really an image is still refused', () => {
    const files = [article({ heroImage: '/blog-media/Not An Image.PNG' })]
    const plan = planPublishSync({
      files,
      media: [{ path: 'content/media/Not An Image.PNG', bytes: Buffer.from('<svg/>') }],
      now: '2026-09-06T12:00:00.000Z',
    })
    assert.equal(
      plan.errors.some((e) => e.kind === 'invalid_media'),
      true,
      JSON.stringify(plan.errors),
    )
    assert.deepEqual(plan.writes, [])
  })
})

describe('a missing_media failure names the file it did find', () => {
  test('a near match is named, so the mismatch is readable without opening the source', () => {
    const media = [{ path: 'content/media/My Hero Photo.png', bytes: PNG(4) }]
    const files = [article({ heroImage: '/blog-media/my-hero-photo.jpg' })]
    const plan = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })

    const [error] = plan.errors.filter((e) => e.kind === 'missing_media')
    assert.ok(error, JSON.stringify(plan.errors))
    assert.match(error.message, /My Hero Photo\.png/)
    assert.match(error.message, /my-hero-photo\.png/)
    assert.equal(error.nearest, 'content/media/My Hero Photo.png')
  })

  test('with no near match the message says what the library actually holds', () => {
    const media = [{ path: 'content/media/unrelated-picture.jpg', bytes: JPEG(5) }]
    const files = [article({ heroImage: '/blog-media/no-such-picture.jpg' })]
    const plan = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })

    const [error] = plan.errors.filter((e) => e.kind === 'missing_media')
    assert.ok(error, JSON.stringify(plan.errors))
    assert.match(error.message, /unrelated-picture\.jpg/)
    assert.equal(error.nearest, undefined)
  })

  test('an empty library says so rather than naming nothing', () => {
    const files = [article({ heroImage: '/blog-media/no-such-picture.jpg' })]
    const plan = planPublishSync({ files, media: [], now: '2026-09-06T12:00:00.000Z' })

    const [error] = plan.errors.filter((e) => e.kind === 'missing_media')
    assert.ok(error, JSON.stringify(plan.errors))
    assert.match(error.message, /media library is empty/i)
  })
})

describe('rewriting the reference does not make the sync loop', () => {
  const media = [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(1) }]
  const files = [article({ heroImage: '/blog-media/My Hero Image.PNG' })]

  test('a second run over its own output is byte identical', () => {
    const first = planPublishSync({ files, media, now: '2026-09-06T12:00:00.000Z' })
    const written = first.writes.find((w) => w.path === 'content/posts/awkward-names.md')

    const second = planPublishSync({
      files,
      media,
      existingPosts: [{ path: written.path, contents: written.contents }],
      existingPublic: first.writes.map((w) => w.path),
      now: '2026-09-07T12:00:00.000Z',
    })

    assert.deepEqual(second.errors, [], JSON.stringify(second.errors))
    assert.deepEqual(second.deletes, [])
    assert.equal(
      second.writes.find((w) => w.path === 'content/posts/awkward-names.md').contents,
      written.contents,
    )
  })
})

describe('the published name is still derived from the source name only', () => {
  test('replacing an image keeps the url, so an already scraped social card resolves', () => {
    const files = [article({ heroImage: '/blog-media/My Hero Image.PNG' })]
    const before = planPublishSync({
      files,
      media: [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(1) }],
      now: '2026-09-06T12:00:00.000Z',
    })
    const after = planPublishSync({
      files,
      media: [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(2, 3, 4) }],
      now: '2026-09-06T12:00:00.000Z',
    })

    const url = (plan) => plan.writes.filter((w) => w.path.startsWith('public/blog-media/'))[0].path
    assert.equal(url(before), 'public/blog-media/my-hero-image.png')
    assert.equal(url(after), url(before))
  })

  test('an article that already uses the published name is untouched by any of this', () => {
    const files = [article({ heroImage: '/blog-media/already-safe-hero.jpg' })]
    const plan = planPublishSync({
      files,
      media: [
        { path: 'content/media/already-safe-hero.jpg', bytes: JPEG(2) },
        { path: 'content/media/Already Safe Hero.jpg', bytes: JPEG(9) },
      ],
      now: '2026-09-06T12:00:00.000Z',
    })

    // Both uploads publish as already-safe-hero.jpg, which is a collision the boundary
    // already refuses. What must not happen is the reference quietly picking one.
    assert.equal(
      plan.errors.some((e) => e.kind === 'media_name_collision'),
      true,
      JSON.stringify(plan.errors),
    )
    assert.deepEqual(plan.writes, [])
  })
})

/*
 * The schema rule that sits in front of all of this.
 *
 * A reference has to be one file name under /blog-media/, and it has to accept the file
 * names people actually produce. Before this fix a hero image called "My Hero Image.PNG"
 * was refused with the sentence "must be a local /blog-media/ asset, never a remote or
 * hotlinked url", which described neither the file nor the problem.
 */
describe('a media reference may carry the file name a person chose', () => {
  const heroErrors = (heroImage) =>
    validatePost({
      id: '8f14e45f-ceea-467a-9b1b-6f6a0d8bb6f6',
      title: 'A hero image',
      slug: 'a-hero-image',
      excerpt: 'One or two sentences used on cards and as the social description.',
      body: 'Body copy.',
      status: 'draft',
      author: 'Homezai Team',
      updatedAt: '2026-09-04T12:00:00.000Z',
      heroImage,
      heroImageAlt: 'A hero image',
    }).errors.filter((e) => e.field === 'heroImage')

  for (const accepted of [
    '/blog-media/route-a1b2c3d4.jpg',
    '/blog-media/My Hero Image.PNG',
    '/blog-media/hz_synthetic_hero.webp',
    '/blog-media/Café Terrasse.png',
    '/blog-media/My%20Hero%20Image.PNG',
  ]) {
    test(`${accepted} is accepted`, () => assert.deepEqual(heroErrors(accepted), []))
  }

  for (const refused of [
    'https://images.unsplash.com/photo-123.jpg',
    '//example.com/house.png',
    'example.com/house.png',
    '/images/homezai-logo.svg',
    '../../secrets/key.png',
    '/blog-media/nested/house.png',
    '/blog-media/house.png?raw=1',
    '/blog-media/house.png#fragment',
    '/blog-media/..',
    '/blog-media/.',
    '/blog-media/',
    '/blog-media/ leading-space.png',
    '/blog-media/quote".png',
    '/blog-media/angle<>.png',
  ]) {
    test(`${refused} is refused`, () => assert.equal(heroErrors(refused).length, 1))
  }

  test('an escaped traversal passes the shape check and then refuses the publish', () => {
    // The schema only says "one segment". %2f is not a slash to a regular expression, so
    // this shape is accepted here and has to be stopped by resolution instead, which it
    // is: nothing in the library answers to it, so the publish refuses and no path is
    // ever built from the string.
    const reference = '/blog-media/..%2f..%2fsecrets.png'
    assert.deepEqual(heroErrors(reference), [])

    const plan = planPublishSync({
      files: [article({ heroImage: reference })],
      media: [{ path: 'content/media/My Hero Image.PNG', bytes: PNG(1) }],
      now: '2026-09-06T12:00:00.000Z',
    })
    assert.equal(plan.errors.some((e) => e.kind === 'missing_media'), true)
    assert.deepEqual(plan.writes, [])
  })
})
