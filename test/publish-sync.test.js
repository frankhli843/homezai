import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { parsePostFile, serialisePostFile } from '../src/content/postFile.js'
import { planPublishSync } from '../src/content/publishPlan.js'

/**
 * planPublishSync decides exactly which bytes cross the boundary from the private
 * content repository into the public one. Everything it does not emit stays private,
 * so a bug here is a disclosure, not a cosmetic defect.
 */

const DRAFT_MD = `---
id: 00000000-0000-4000-8000-000000000002
title: An unreleased headline
slug: unreleased
excerpt: Nobody outside the editor may read this.
status: draft
author: Homezai Team
updatedAt: 2026-09-04T12:00:00.000Z
---

Confidential body copy that must never be published.
`

const PUBLISHED_MD = `---
id: 00000000-0000-4000-8000-000000000001
title: A released headline
slug: released
excerpt: This one is live.
status: published
author: Homezai Team
publishedAt: 2026-09-01T12:00:00.000Z
updatedAt: 2026-09-02T12:00:00.000Z
heroImage: /blog-media/hero-a1b2c3d4.jpg
heroImageAlt: A hero image
---

Public body copy.
`

describe('post files round trip', () => {
  test('frontmatter and body parse apart', () => {
    const post = parsePostFile(PUBLISHED_MD, 'content/posts/released.md')
    assert.equal(post.slug, 'released')
    assert.equal(post.status, 'published')
    assert.equal(post.body.trim(), 'Public body copy.')
    assert.equal(post.file, 'content/posts/released.md')
  })

  test('serialising a parsed post produces a file that parses back to the same values', () => {
    const post = parsePostFile(PUBLISHED_MD, 'content/posts/released.md')
    const round = parsePostFile(serialisePostFile(post), 'content/posts/released.md')
    assert.equal(round.title, post.title)
    assert.equal(round.slug, post.slug)
    assert.equal(round.body.trim(), post.body.trim())
    assert.equal(round.publishedAt, post.publishedAt)
  })

  test('a file with no frontmatter is a named parse error, not a silent empty post', () => {
    assert.throws(() => parsePostFile('just a body', 'content/posts/bad.md'), /frontmatter/i)
  })

  test('frontmatter that is not a mapping is rejected', () => {
    assert.throws(() => parsePostFile('---\n- a\n- b\n---\nbody', 'content/posts/bad.md'), /mapping/i)
  })
})

describe('only published content crosses the boundary', () => {
  const files = [
    { path: 'content/posts/released.md', contents: PUBLISHED_MD },
    { path: 'content/posts/unreleased.md', contents: DRAFT_MD },
  ]
  const media = [
    { path: 'content/media/hero-a1b2c3d4.jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]) },
    { path: 'content/media/unused-secret.jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9, 9, 9]) },
  ]

  const plan = planPublishSync({ files, media })

  test('the plan is clean', () => {
    assert.deepEqual(plan.errors, [], JSON.stringify(plan.errors))
  })

  test('the published post is written to the public repository', () => {
    assert.ok(plan.writes.some((w) => w.path === 'content/posts/released.md'))
  })

  test('the draft is not written anywhere', () => {
    assert.equal(plan.writes.some((w) => w.path.includes('unreleased')), false)
    const serialised = JSON.stringify(plan.writes.map((w) => String(w.contents ?? '')))
    assert.doesNotMatch(serialised, /Confidential body copy/)
    assert.doesNotMatch(serialised, /An unreleased headline/)
  })

  test('only media referenced by a published post crosses over', () => {
    assert.ok(plan.writes.some((w) => w.path === 'public/blog-media/hero-a1b2c3d4.jpg'))
    assert.equal(plan.writes.some((w) => w.path.includes('unused-secret')), false)
  })

  test('the plan reports which files it deliberately withheld, so an operator can tell', () => {
    assert.ok(plan.withheld.some((w) => w.path === 'content/posts/unreleased.md' && w.reason === 'draft'))
    assert.ok(plan.withheld.some((w) => w.path === 'content/media/unused-secret.jpg' && w.reason === 'unreferenced'))
  })
})

describe('unpublishing removes the public copy', () => {
  test('a post present in the public repository but no longer published is deleted', () => {
    const plan = planPublishSync({
      files: [{ path: 'content/posts/unreleased.md', contents: DRAFT_MD }],
      media: [],
      existingPublic: ['content/posts/unreleased.md', 'content/posts/released.md'],
    })
    assert.ok(plan.deletes.includes('content/posts/unreleased.md'))
  })

  test('a post deleted outright in the private repository is deleted publicly too', () => {
    const plan = planPublishSync({
      files: [],
      media: [],
      existingPublic: ['content/posts/gone.md'],
    })
    assert.ok(plan.deletes.includes('content/posts/gone.md'))
  })

  test('media that no published post references any more is deleted', () => {
    const plan = planPublishSync({
      files: [],
      media: [],
      existingPublic: ['public/blog-media/orphan-a1b2c3d4.jpg'],
    })
    assert.ok(plan.deletes.includes('public/blog-media/orphan-a1b2c3d4.jpg'))
  })

  test('nothing outside the two managed directories is ever deleted', () => {
    const plan = planPublishSync({
      files: [],
      media: [],
      existingPublic: ['src/App.jsx', 'public/images/homezai-wordmark.png', 'package.json'],
    })
    assert.deepEqual(plan.deletes, [])
  })
})

describe('a broken reference fails the publish rather than shipping a hole', () => {
  test('a published post pointing at missing media is an error', () => {
    const plan = planPublishSync({
      files: [{ path: 'content/posts/released.md', contents: PUBLISHED_MD }],
      media: [],
    })
    assert.ok(plan.errors.some((e) => e.kind === 'missing_media'))
    assert.equal(plan.writes.length, 0, 'a failing plan must write nothing at all')
  })

  test('a published post whose media fails validation is an error', () => {
    const plan = planPublishSync({
      files: [{ path: 'content/posts/released.md', contents: PUBLISHED_MD }],
      media: [{ path: 'content/media/hero-a1b2c3d4.jpg', bytes: Buffer.from('<svg><script>x</script></svg>') }],
    })
    assert.ok(plan.errors.some((e) => e.kind === 'invalid_media'))
    assert.equal(plan.writes.length, 0)
  })

  test('a slug collision fails the whole plan atomically', () => {
    const other = PUBLISHED_MD.replace('id: 00000000-0000-4000-8000-000000000001', 'id: 00000000-0000-4000-8000-000000000003')
    const plan = planPublishSync({
      files: [
        { path: 'content/posts/released.md', contents: PUBLISHED_MD },
        { path: 'content/posts/released-copy.md', contents: other },
      ],
      media: [{ path: 'content/media/hero-a1b2c3d4.jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]) }],
    })
    assert.ok(plan.errors.some((e) => e.kind === 'slug_collision'))
    assert.equal(plan.writes.length, 0)
    assert.equal(plan.deletes.length, 0)
  })
})

/*
 * These cover two defects that only appeared when a real article was saved in the real
 * editor against production. Neither was visible to any unit test written beforehand,
 * because both tests and fixtures had been written by hand in the shape the schema
 * describes rather than in the shape the CMS actually writes.
 */

const EDITOR_SAVED_MD = `---
id: ff710123-ab49-4923-915f-79b6adfb8cc8
title: An article saved by the editor
slug: editor-saved
excerpt: The editor writes every optional field, and writes the empty ones as ''.
status: published
author: Homezai Team
heroImage: /blog-media/hero-a1b2c3d4.jpg
heroImageAlt: A hero image
heroImageDecorative: false
featured: false
featureOrder: 10
tags: []
seoTitle: ''
seoDescription: ''
publishedAt: ''
updatedAt: ''
previousSlugs: []
---

Body copy.
`

const HERO = { path: 'content/media/hero-a1b2c3d4.jpg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1]) }

describe('an empty string in the frontmatter means absent, not present and invalid', () => {
  test('the fields the editor left blank do not survive parsing as empty strings', () => {
    const post = parsePostFile(EDITOR_SAVED_MD, 'content/posts/editor-saved.md')
    for (const field of ['seoTitle', 'seoDescription', 'publishedAt', 'updatedAt']) {
      assert.equal(post[field], undefined, `${field} came through as ${JSON.stringify(post[field])}`)
    }
    assert.equal(post.tags, undefined)
    assert.equal(post.previousSlugs, undefined)
  })

  test('an article saved by the editor publishes rather than failing validation', () => {
    const plan = planPublishSync({
      files: [{ path: 'content/posts/editor-saved.md', contents: EDITOR_SAVED_MD }],
      media: [HERO],
      now: '2026-09-04T17:00:00.000Z',
    })
    assert.deepEqual(plan.errors, [], JSON.stringify(plan.errors))
    assert.ok(plan.writes.some((w) => w.path === 'content/posts/editor-saved.md'))
  })
})

describe('the publish date is stamped once and then never moves', () => {
  const first = planPublishSync({
    files: [{ path: 'content/posts/editor-saved.md', contents: EDITOR_SAVED_MD }],
    media: [HERO],
    now: '2026-09-04T17:00:00.000Z',
  })
  const published = first.writes.find((w) => w.path === 'content/posts/editor-saved.md').contents

  test('a first publish stamps the date the editor left blank', () => {
    const parsed = parsePostFile(published, 'x')
    assert.equal(parsed.publishedAt, '2026-09-04T17:00:00.000Z')
    assert.equal(parsed.updatedAt, '2026-09-04T17:00:00.000Z')
  })

  test('publishing the same article again a week later does not move either date', () => {
    const again = planPublishSync({
      files: [{ path: 'content/posts/editor-saved.md', contents: EDITOR_SAVED_MD }],
      media: [HERO],
      existingPosts: [{ path: 'content/posts/editor-saved.md', contents: published }],
      now: '2026-09-11T09:00:00.000Z',
    })
    const parsed = parsePostFile(
      again.writes.find((w) => w.path === 'content/posts/editor-saved.md').contents,
      'x',
    )
    assert.equal(parsed.publishedAt, '2026-09-04T17:00:00.000Z')
    assert.equal(parsed.updatedAt, '2026-09-04T17:00:00.000Z')
  })

  test('an unchanged article produces byte identical output, so the sync cannot loop', () => {
    const again = planPublishSync({
      files: [{ path: 'content/posts/editor-saved.md', contents: EDITOR_SAVED_MD }],
      media: [HERO],
      existingPosts: [{ path: 'content/posts/editor-saved.md', contents: published }],
      now: '2026-09-11T09:00:00.000Z',
    })
    assert.equal(again.writes.find((w) => w.path === 'content/posts/editor-saved.md').contents, published)
  })

  test('an edit moves the update date but leaves the publish date alone', () => {
    const edited = EDITOR_SAVED_MD.replace('Body copy.', 'Body copy, corrected.')
    const again = planPublishSync({
      files: [{ path: 'content/posts/editor-saved.md', contents: edited }],
      media: [HERO],
      existingPosts: [{ path: 'content/posts/editor-saved.md', contents: published }],
      now: '2026-09-11T09:00:00.000Z',
    })
    const parsed = parsePostFile(
      again.writes.find((w) => w.path === 'content/posts/editor-saved.md').contents,
      'x',
    )
    assert.equal(parsed.publishedAt, '2026-09-04T17:00:00.000Z')
    assert.equal(parsed.updatedAt, '2026-09-11T09:00:00.000Z')
  })

  test('a title change also counts as an edit, not only a body change', () => {
    const edited = EDITOR_SAVED_MD.replace('An article saved by the editor', 'A better headline')
    const again = planPublishSync({
      files: [{ path: 'content/posts/editor-saved.md', contents: edited }],
      media: [HERO],
      existingPosts: [{ path: 'content/posts/editor-saved.md', contents: published }],
      now: '2026-09-11T09:00:00.000Z',
    })
    const parsed = parsePostFile(
      again.writes.find((w) => w.path === 'content/posts/editor-saved.md').contents,
      'x',
    )
    assert.equal(parsed.updatedAt, '2026-09-11T09:00:00.000Z')
  })
})
