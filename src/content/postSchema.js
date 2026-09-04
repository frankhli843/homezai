/*
 * The article content model.
 *
 * This module is the contract between the editor, the publish sync and the build. It
 * is deliberately dependency free and pure so that it can be imported by a Node build
 * script, by a test and by the browser bundle without any of them dragging in the
 * others' machinery.
 *
 * Scheduling is not part of the model. There are two states and neither of them is
 * "scheduled", so nothing downstream has to guess what a future dated post means.
 */

/** The only two states a post may hold. */
export const POST_STATUSES = Object.freeze(['draft', 'published'])

/**
 * Slugs that would shadow a real page of the site. A post is not allowed to take one,
 * because /blog/pricing/ is fine but a future flat route would not be, and because a
 * reserved word here is far cheaper than a route collision discovered in production.
 */
export const RESERVED_SLUGS = Object.freeze([
  'admin',
  'blog',
  'accessibility',
  'contact',
  'dpa',
  'images',
  'blog-media',
  'integrations',
  'pricing',
  'privacy',
  'support',
  'terms',
  'videos',
])

/** A slug is lowercase alphanumerics in hyphen separated groups, and nothing else. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Hero images must be site local assets emitted by the media pipeline. */
const LOCAL_MEDIA_PATTERN = /^\/blog-media\/[A-Za-z0-9][A-Za-z0-9._-]*$/

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ISO_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/

/** Longest excerpt that still renders as a usable meta description. */
export const MAX_EXCERPT_LENGTH = 300

/**
 * Turn arbitrary prose into a candidate slug. Accents are folded rather than dropped so
 * that a title made mostly of accented characters still produces something readable
 * instead of an empty string.
 */
export function normalizeSlug(input) {
  if (typeof input !== 'string') return ''
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isReservedSlug(slug) {
  return RESERVED_SLUGS.includes(String(slug || '').toLowerCase())
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Validate one post.
 *
 * Returns every problem rather than the first one, because an editor fixing a post
 * should see the whole list instead of discovering the next fault on the next save.
 * Draft rules are looser than published rules on purpose: a half written draft is a
 * normal state, a half written published article is a defect on the live site.
 */
export function validatePost(post) {
  const errors = []
  const fail = (field, message) => errors.push({ field, message })

  if (!post || typeof post !== 'object') {
    return { ok: false, errors: [{ field: 'post', message: 'post is not an object' }] }
  }

  if (!isNonEmptyString(post.id)) fail('id', 'id is required and is minted once at creation')
  else if (!UUID_PATTERN.test(post.id)) fail('id', 'id must be a uuid')

  if (!isNonEmptyString(post.title)) fail('title', 'title is required')

  if (!isNonEmptyString(post.slug)) {
    fail('slug', 'slug is required')
  } else if (!SLUG_PATTERN.test(post.slug)) {
    fail('slug', `slug "${post.slug}" must be lowercase letters, digits and single hyphens`)
  } else if (isReservedSlug(post.slug)) {
    fail('slug', `slug "${post.slug}" is reserved by an existing site route`)
  }

  if (!isNonEmptyString(post.excerpt)) {
    fail('excerpt', 'excerpt is required and is used as the search and social description')
  } else if (post.excerpt.length > MAX_EXCERPT_LENGTH) {
    fail('excerpt', `excerpt must be ${MAX_EXCERPT_LENGTH} characters or fewer`)
  }

  if (typeof post.body !== 'string' || post.body.length === 0) fail('body', 'body is required')

  if (!isNonEmptyString(post.status)) {
    fail('status', 'status is required')
  } else if (!POST_STATUSES.includes(post.status)) {
    fail('status', `status must be one of ${POST_STATUSES.join(', ')}`)
  }

  for (const field of ['publishedAt', 'updatedAt']) {
    if (post[field] != null && !ISO_INSTANT_PATTERN.test(String(post[field]))) {
      fail(field, `${field} must be an ISO 8601 instant in UTC`)
    }
  }

  const published = post.status === 'published'

  if (published) {
    if (!isNonEmptyString(post.publishedAt)) {
      fail('publishedAt', 'a published post must carry the instant it was first published')
    }
    if (!isNonEmptyString(post.heroImage)) {
      fail('heroImage', 'a published post must carry a hero image, which is also its social card')
    }
  }

  if (post.heroImage != null && isNonEmptyString(post.heroImage)) {
    if (!LOCAL_MEDIA_PATTERN.test(post.heroImage)) {
      fail(
        'heroImage',
        `heroImage "${post.heroImage}" must be a local /blog-media/ asset, never a remote or hotlinked url`,
      )
    }
    if (!post.heroImageDecorative && !isNonEmptyString(post.heroImageAlt)) {
      fail(
        'heroImageAlt',
        'describe the image for a screen reader, or set heroImageDecorative when it carries no meaning',
      )
    }
  }

  if (post.featured) {
    if (!published) fail('featured', 'only a published post can be featured on the home page')
    if (!Number.isInteger(post.featureOrder)) {
      fail('featureOrder', 'a featured post needs an integer featureOrder so the home page order is deterministic')
    }
  }

  if (post.previousSlugs != null) {
    if (!Array.isArray(post.previousSlugs)) {
      fail('previousSlugs', 'previousSlugs must be a list')
    } else {
      for (const previous of post.previousSlugs) {
        if (!SLUG_PATTERN.test(String(previous))) {
          fail('previousSlugs', `previous slug "${previous}" is not a valid slug`)
        }
      }
    }
  }

  if (post.tags != null && !Array.isArray(post.tags)) fail('tags', 'tags must be a list')

  return { ok: errors.length === 0, errors }
}
