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
