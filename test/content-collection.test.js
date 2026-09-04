import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildCollection,
  MAX_FEATURED_POSTS,
} from '../src/content/collection.js'

/**
 * buildCollection turns a set of parsed post files into the exact data the public site
 * is allowed to see. Draft exclusion and slug collision live here, so this is the file
 * that has to be right if nothing else is.
 */

let seq = 0
function post(overrides = {}) {
  seq += 1
  const slug = overrides.slug || `post-${seq}`
  return {
    file: `content/posts/${slug}.md`,
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    title: `Post ${seq}`,
    slug,
    excerpt: `Excerpt for post ${seq}.`,
    body: 'Body copy.',
    status: 'published',
    author: 'Homezai Team',
    publishedAt: `2026-09-0${(seq % 9) + 1}T12:00:00.000Z`,
    updatedAt: `2026-09-0${(seq % 9) + 1}T12:00:00.000Z`,
    heroImage: `/blog-media/hero-${seq}-a1b2c3d4.jpg`,
    heroImageAlt: `Hero for post ${seq}`,
    ...overrides,
  }
}

describe('drafts never reach the public collection', () => {
  test('a draft is excluded from posts', () => {
    const { posts, errors } = buildCollection([
      post({ slug: 'live-one' }),
      post({ slug: 'secret-one', status: 'draft', publishedAt: undefined, heroImage: undefined, heroImageAlt: undefined }),
    ])
    assert.deepEqual(errors, [])
    assert.deepEqual(posts.map((p) => p.slug), ['live-one'])
  })

  test('no draft field, body or title survives anywhere in the serialised output', () => {
    const { posts } = buildCollection([
      post({ slug: 'live-one' }),
      post({
        slug: 'secret-one',
        status: 'draft',
        title: 'UNPUBLISHED CONFIDENTIAL HEADLINE',
        body: 'UNPUBLISHED CONFIDENTIAL BODY',
        publishedAt: undefined,
        heroImage: undefined,
        heroImageAlt: undefined,
      }),
    ])
    const serialised = JSON.stringify(posts)
    assert.doesNotMatch(serialised, /UNPUBLISHED CONFIDENTIAL/)
    assert.doesNotMatch(serialised, /secret-one/)
  })

  test('an empty input is an empty collection, not a crash', () => {
    const { posts, featured, errors } = buildCollection([])
    assert.deepEqual(posts, [])
    assert.deepEqual(featured, [])
    assert.deepEqual(errors, [])
  })

  test('an input of only drafts yields an empty public collection', () => {
    const { posts, featured } = buildCollection([
      post({ slug: 'a', status: 'draft', publishedAt: undefined, heroImage: undefined, heroImageAlt: undefined }),
      post({ slug: 'b', status: 'draft', publishedAt: undefined, heroImage: undefined, heroImageAlt: undefined }),
    ])
    assert.deepEqual(posts, [])
    assert.deepEqual(featured, [])
  })
})

describe('slug collisions are a named failure, not a silent overwrite', () => {
  test('two published posts with the same slug produce an error naming both files', () => {
    const { errors } = buildCollection([
      post({ slug: 'duplicate' }),
      post({ slug: 'duplicate' }),
    ])
    assert.equal(errors.length, 1)
    assert.equal(errors[0].kind, 'slug_collision')
    assert.match(errors[0].message, /duplicate/)
    assert.equal(errors[0].files.length, 2)
  })

  test('a collision is reported even when one of the two is a draft', () => {
    const { errors } = buildCollection([
      post({ slug: 'duplicate' }),
      post({ slug: 'duplicate', status: 'draft', publishedAt: undefined, heroImage: undefined, heroImageAlt: undefined }),
    ])
    assert.equal(errors.length, 1)
    assert.equal(errors[0].kind, 'slug_collision')
  })

  test('a new slug colliding with another post previous slug is an error', () => {
    const { errors } = buildCollection([
      post({ slug: 'new-name', previousSlugs: ['old-name'] }),
      post({ slug: 'old-name' }),
    ])
    assert.equal(errors.length, 1)
    assert.equal(errors[0].kind, 'slug_collision')
  })

  test('a duplicate id across two files is an error', () => {
    const shared = '11111111-1111-4111-8111-111111111111'
    const { errors } = buildCollection([
      post({ slug: 'a', id: shared }),
      post({ slug: 'b', id: shared }),
    ])
    assert.ok(errors.some((e) => e.kind === 'duplicate_id'))
  })
})

describe('invalid posts fail the collection instead of shipping broken', () => {
  test('a published post missing alt text fails with the file named', () => {
    const bad = post({ slug: 'no-alt' })
    delete bad.heroImageAlt
    const { errors } = buildCollection([bad])
    assert.ok(errors.some((e) => e.kind === 'invalid_post' && e.file === 'content/posts/no-alt.md'))
  })
})

describe('ordering is deterministic', () => {
  test('the index is newest published first', () => {
    const { posts } = buildCollection([
      post({ slug: 'older', publishedAt: '2026-01-01T00:00:00.000Z' }),
      post({ slug: 'newest', publishedAt: '2026-09-01T00:00:00.000Z' }),
      post({ slug: 'middle', publishedAt: '2026-05-01T00:00:00.000Z' }),
    ])
    assert.deepEqual(posts.map((p) => p.slug), ['newest', 'middle', 'older'])
  })

  test('posts published in the same instant fall back to slug so the order never flickers', () => {
    const at = '2026-09-01T00:00:00.000Z'
    const { posts } = buildCollection([
      post({ slug: 'bravo', publishedAt: at }),
      post({ slug: 'alpha', publishedAt: at }),
    ])
    assert.deepEqual(posts.map((p) => p.slug), ['alpha', 'bravo'])
  })
})

describe('homepage featuring is explicit and capacity bound', () => {
  test('only posts flagged featured are featured', () => {
    const { featured } = buildCollection([
      post({ slug: 'plain' }),
      post({ slug: 'starred', featured: true, featureOrder: 1 }),
    ])
    assert.deepEqual(featured.map((p) => p.slug), ['starred'])
  })

  test('featureOrder decides the order, not the publish date', () => {
    const { featured } = buildCollection([
      post({ slug: 'third', featured: true, featureOrder: 3, publishedAt: '2026-09-09T00:00:00.000Z' }),
      post({ slug: 'first', featured: true, featureOrder: 1, publishedAt: '2026-01-01T00:00:00.000Z' }),
      post({ slug: 'second', featured: true, featureOrder: 2, publishedAt: '2026-05-01T00:00:00.000Z' }),
    ])
    assert.deepEqual(featured.map((p) => p.slug), ['first', 'second', 'third'])
  })

  test('an equal featureOrder is broken by publish date, newest first, then slug', () => {
    const { featured } = buildCollection([
      post({ slug: 'b-older', featured: true, featureOrder: 1, publishedAt: '2026-01-01T00:00:00.000Z' }),
      post({ slug: 'a-newer', featured: true, featureOrder: 1, publishedAt: '2026-09-01T00:00:00.000Z' }),
    ])
    assert.deepEqual(featured.map((p) => p.slug), ['a-newer', 'b-older'])
  })

  test('a featured draft is not featured, because it is not even published', () => {
    const { featured, errors } = buildCollection([
      post({
        slug: 'hidden',
        status: 'draft',
        featured: true,
        featureOrder: 1,
        publishedAt: undefined,
        heroImage: undefined,
        heroImageAlt: undefined,
      }),
    ])
    assert.deepEqual(featured, [])
    assert.deepEqual(errors, [])
  })

  test('the featured list is capped and the overflow is reported rather than silently dropped', () => {
    const many = Array.from({ length: MAX_FEATURED_POSTS + 2 }, (_, i) =>
      post({ slug: `feat-${i}`, featured: true, featureOrder: i }),
    )
    const { featured, warnings } = buildCollection(many)
    assert.equal(featured.length, MAX_FEATURED_POSTS)
    assert.ok(warnings.some((w) => w.kind === 'featured_overflow'))
  })

  test('zero, one and the maximum are all representable', () => {
    assert.equal(buildCollection([post({ slug: 'x' })]).featured.length, 0)
    assert.equal(buildCollection([post({ slug: 'x', featured: true, featureOrder: 1 })]).featured.length, 1)
    const max = Array.from({ length: MAX_FEATURED_POSTS }, (_, i) =>
      post({ slug: `m-${i}`, featured: true, featureOrder: i }),
    )
    assert.equal(buildCollection(max).featured.length, MAX_FEATURED_POSTS)
  })
})

describe('previous slugs become redirects', () => {
  test('a renamed post exposes its old slug as a redirect to the canonical one', () => {
    const { redirects } = buildCollection([
      post({ slug: 'new-name', previousSlugs: ['old-name', 'older-name'] }),
    ])
    assert.deepEqual(
      redirects.sort((a, b) => a.from.localeCompare(b.from)),
      [
        { from: '/blog/old-name/', to: '/blog/new-name/' },
        { from: '/blog/older-name/', to: '/blog/new-name/' },
      ].sort((a, b) => a.from.localeCompare(b.from)),
    )
  })

  test('an unpublished post contributes no redirects', () => {
    const { redirects } = buildCollection([
      post({
        slug: 'new-name',
        previousSlugs: ['old-name'],
        status: 'draft',
        publishedAt: undefined,
        heroImage: undefined,
        heroImageAlt: undefined,
      }),
    ])
    assert.deepEqual(redirects, [])
  })
})
