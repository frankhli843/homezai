/*
 * Turn a set of parsed post files into the exact data the public site is allowed to
 * see.
 *
 * Two rules matter more than the rest. A draft is dropped before anything else touches
 * it, so no later stage can leak one by accident. And a collection that has any error
 * produces no output at all, so a slug collision or an invalid post fails the publish
 * loudly instead of shipping whichever file happened to be written last.
 */

import { validatePost } from './postSchema.js'

/** How many articles the home page will show. */
export const MAX_FEATURED_POSTS = 3

const EMPTY = Object.freeze({ posts: [], featured: [], redirects: [], errors: [], warnings: [] })

/** Newest first, then slug, so two posts sharing an instant never swap places. */
function byPublishedDesc(a, b) {
  const at = Date.parse(a.publishedAt || 0)
  const bt = Date.parse(b.publishedAt || 0)
  if (at !== bt) return bt - at
  return a.slug.localeCompare(b.slug)
}

/** Explicit order first, then the ordinary newest first rule as the tie break. */
function byFeatureOrder(a, b) {
  const ao = Number.isInteger(a.featureOrder) ? a.featureOrder : Number.MAX_SAFE_INTEGER
  const bo = Number.isInteger(b.featureOrder) ? b.featureOrder : Number.MAX_SAFE_INTEGER
  if (ao !== bo) return ao - bo
  return byPublishedDesc(a, b)
}

/**
 * Every name a post answers to: its slug plus every slug it used to have. A rename
 * keeps the old URL alive, so the old name has to keep taking part in collision
 * detection or a new post could quietly steal a redirect.
 */
function namesOf(post) {
  const previous = Array.isArray(post.previousSlugs) ? post.previousSlugs : []
  return [post.slug, ...previous].filter(Boolean)
}

export function buildCollection(rawPosts) {
  if (!Array.isArray(rawPosts) || rawPosts.length === 0) return { ...EMPTY }

  const errors = []
  const warnings = []

  // Identity collisions are checked across every file, published or not, because a
  // draft that already owns a slug will collide the moment it is published.
  const byName = new Map()
  for (const post of rawPosts) {
    for (const name of namesOf(post)) {
      if (!byName.has(name)) byName.set(name, [])
      byName.get(name).push(post)
    }
  }
  for (const [name, owners] of byName) {
    if (owners.length > 1) {
      errors.push({
        kind: 'slug_collision',
        message: `slug "${name}" is claimed by more than one post`,
        slug: name,
        files: owners.map((p) => p.file),
      })
    }
  }

  const byId = new Map()
  for (const post of rawPosts) {
    if (!post.id) continue
    if (!byId.has(post.id)) byId.set(post.id, [])
    byId.get(post.id).push(post)
  }
  for (const [id, owners] of byId) {
    if (owners.length > 1) {
      errors.push({
        kind: 'duplicate_id',
        message: `id ${id} is used by more than one post; an id is minted once and never reused`,
        id,
        files: owners.map((p) => p.file),
      })
    }
  }

  // Drafts leave the pipeline here and are never read again.
  const published = rawPosts.filter((post) => post.status === 'published')

  for (const post of published) {
    const result = validatePost(post)
    if (!result.ok) {
      errors.push({
        kind: 'invalid_post',
        message: result.errors.map((e) => `${e.field}: ${e.message}`).join('; '),
        file: post.file,
        fields: result.errors,
      })
    }
  }

  if (errors.length > 0) return { posts: [], featured: [], redirects: [], errors, warnings }

  const posts = [...published].sort(byPublishedDesc)

  const featuredCandidates = posts.filter((post) => post.featured === true).sort(byFeatureOrder)
  const featured = featuredCandidates.slice(0, MAX_FEATURED_POSTS)
  if (featuredCandidates.length > MAX_FEATURED_POSTS) {
    warnings.push({
      kind: 'featured_overflow',
      message:
        `${featuredCandidates.length} posts are flagged featured but the home page shows ` +
        `${MAX_FEATURED_POSTS}; these are not shown: ` +
        featuredCandidates
          .slice(MAX_FEATURED_POSTS)
          .map((p) => p.slug)
          .join(', '),
      dropped: featuredCandidates.slice(MAX_FEATURED_POSTS).map((p) => p.slug),
    })
  }

  const redirects = []
  for (const post of posts) {
    for (const previous of Array.isArray(post.previousSlugs) ? post.previousSlugs : []) {
      if (previous === post.slug) continue
      redirects.push({ from: `/blog/${previous}/`, to: `/blog/${post.slug}/` })
    }
  }

  return { posts, featured, redirects, errors, warnings }
}
