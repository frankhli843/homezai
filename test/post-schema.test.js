import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  POST_STATUSES,
  validatePost,
  normalizeSlug,
  isReservedSlug,
  RESERVED_SLUGS,
} from '../src/content/postSchema.js'

/**
 * The content model is the contract every other part of the pipeline reads, so it is
 * tested on its own rather than through the sync or the build. A post that fails here
 * must never reach the public repository.
 */

function draft(overrides = {}) {
  return {
    id: '8f14e45f-ceea-467a-9b1b-6f6a0d8bb6f6',
    title: 'How Homezai routes a showing',
    slug: 'how-homezai-routes-a-showing',
    excerpt: 'A short summary of the article that is used on cards and as a description.',
    body: 'Some body copy.',
    status: 'draft',
    author: 'Homezai Team',
    updatedAt: '2026-09-04T12:00:00.000Z',
    ...overrides,
  }
}

function published(overrides = {}) {
  return draft({
    status: 'published',
    publishedAt: '2026-09-04T12:00:00.000Z',
    heroImage: '/blog-media/showing-route-a1b2c3d4.jpg',
    heroImageAlt: 'A map showing a routed sequence of property visits',
    ...overrides,
  })
}

describe('post status vocabulary', () => {
  test('exactly two states exist and scheduling is not one of them', () => {
    assert.deepEqual([...POST_STATUSES].sort(), ['draft', 'published'])
  })
})

describe('validatePost required fields', () => {
  test('a well formed draft validates', () => {
    const result = validatePost(draft())
    assert.equal(result.ok, true, JSON.stringify(result.errors))
    assert.deepEqual(result.errors, [])
  })

  test('a well formed published post validates', () => {
    const result = validatePost(published())
    assert.equal(result.ok, true, JSON.stringify(result.errors))
  })

  for (const field of ['id', 'title', 'slug', 'excerpt', 'body', 'status']) {
    test(`a missing ${field} is rejected and the field is named`, () => {
      const post = draft()
      delete post[field]
      const result = validatePost(post)
      assert.equal(result.ok, false)
      assert.ok(
        result.errors.some((e) => e.field === field),
        `expected an error naming ${field}, got ${JSON.stringify(result.errors)}`,
      )
    })
  }

  test('an unknown status is rejected', () => {
    const result = validatePost(draft({ status: 'scheduled' }))
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'status'))
  })

  test('a published post must carry a hero image', () => {
    const post = published()
    delete post.heroImage
    const result = validatePost(post)
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'heroImage'))
  })

  test('a published post must carry a publish date', () => {
    const post = published()
    delete post.publishedAt
    const result = validatePost(post)
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'publishedAt'))
  })

  test('a draft may omit the hero image and the publish date', () => {
    const result = validatePost(draft())
    assert.equal(result.ok, true, JSON.stringify(result.errors))
  })
})

describe('accessibility text is required, not optional', () => {
  test('a hero image without alt text is rejected', () => {
    const post = published()
    delete post.heroImageAlt
    const result = validatePost(post)
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'heroImageAlt'))
  })

  test('empty alt text is rejected, because it is indistinguishable from forgetting', () => {
    const result = validatePost(published({ heroImageAlt: '   ' }))
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'heroImageAlt'))
  })

  test('an explicit decorative designation is accepted in place of alt text', () => {
    const post = published({ heroImageDecorative: true })
    delete post.heroImageAlt
    const result = validatePost(post)
    assert.equal(result.ok, true, JSON.stringify(result.errors))
  })
})

describe('hero images must be local site assets, never hotlinked', () => {
  test('a local blog-media path is accepted', () => {
    assert.equal(validatePost(published()).ok, true)
  })

  for (const hostile of [
    'https://images.unsplash.com/photo-1.jpg',
    'http://example.com/a.png',
    '//cdn.example.com/a.png',
    '/images/not-blog-media.png',
  ]) {
    test(`${hostile} is rejected as a hero image`, () => {
      const result = validatePost(published({ heroImage: hostile }))
      assert.equal(result.ok, false)
      assert.ok(result.errors.some((e) => e.field === 'heroImage'))
    })
  }
})

describe('featured selection', () => {
  test('a featured post must be published', () => {
    const result = validatePost(draft({ featured: true }))
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'featured'))
  })

  test('a featured published post needs an integer featureOrder', () => {
    const result = validatePost(published({ featured: true, featureOrder: 'first' }))
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'featureOrder'))
  })

  test('a featured published post with a numeric order validates', () => {
    const result = validatePost(published({ featured: true, featureOrder: 1 }))
    assert.equal(result.ok, true, JSON.stringify(result.errors))
  })
})

describe('slug normalisation', () => {
  test('a title becomes a lowercase kebab slug', () => {
    assert.equal(normalizeSlug('How Homezai Routes A Showing!'), 'how-homezai-routes-a-showing')
  })

  test('accents and punctuation are folded rather than dropped into an empty slug', () => {
    assert.equal(normalizeSlug('Cafe    Ole -- 2026'), 'cafe-ole-2026')
  })

  test('a slug never begins or ends with a separator', () => {
    assert.equal(normalizeSlug('  --hello--  '), 'hello')
  })

  test('a slug with characters that are unsafe in a path is rejected by validation', () => {
    for (const bad of ['Has Spaces', 'UPPER', 'has/slash', 'has.dot', '../escape', 'trailing-']) {
      const result = validatePost(draft({ slug: bad }))
      assert.equal(result.ok, false, `expected ${bad} to be rejected`)
      assert.ok(result.errors.some((e) => e.field === 'slug'))
    }
  })
})

describe('reserved slugs cannot shadow an existing site route', () => {
  test('the existing top level routes are reserved', () => {
    for (const route of ['pricing', 'integrations', 'contact', 'terms', 'privacy', 'admin', 'blog']) {
      assert.equal(isReservedSlug(route), true, `${route} should be reserved`)
      assert.ok(RESERVED_SLUGS.includes(route))
    }
  })

  test('a post may not take a reserved slug', () => {
    const result = validatePost(draft({ slug: 'pricing' }))
    assert.equal(result.ok, false)
    assert.ok(result.errors.some((e) => e.field === 'slug'))
  })
})
