/*
 * The publish boundary.
 *
 * This is the single function that decides which bytes leave the private content
 * repository and enter the public site repository. A mistake here is a disclosure
 * rather than a cosmetic defect, so it is built to fail closed: any error at all and
 * the plan writes nothing and deletes nothing, which leaves the last good publish
 * standing on the live site.
 *
 * It is a pure function of its inputs. The workflow that actually reads and writes
 * files is a thin shell around it, so the interesting behaviour is testable without a
 * repository, a network or a clock.
 */

import { parsePostFile, serialisePostFile } from './postFile.js'
import { buildCollection } from './collection.js'
import { validateMedia, safeMediaName, mediaNameStem } from './media.js'

/** The only two directories in the public repository this process owns. */
export const MANAGED_PREFIXES = Object.freeze(['content/posts/', 'public/blog-media/'])

/** Where a published image is served from. */
const PUBLIC_MEDIA_PREFIX = '/blog-media/'

/*
 * One /blog-media/ reference inside a body. It runs to the first character that cannot
 * be part of a file name in markdown: whitespace, a closing paren, a quote, an angle
 * bracket or a bracket. Wider than a file name strictly needs to be, on purpose, so
 * that a percent escaped name is captured whole and resolved rather than being cut at
 * the percent sign and reported as a missing file.
 */
const BODY_MEDIA_REFERENCE = /\/blog-media\/([^\s)"'<>\\\]]+)/g

/** Every /blog-media/ reference a post makes, from its hero image and from its body. */
function mediaReferences(post) {
  const found = new Set()
  if (typeof post.heroImage === 'string' && post.heroImage.startsWith(PUBLIC_MEDIA_PREFIX)) {
    found.add(post.heroImage.slice(PUBLIC_MEDIA_PREFIX.length))
  }
  const body = String(post.body ?? '')
  for (const match of body.matchAll(BODY_MEDIA_REFERENCE)) {
    found.add(match[1])
  }
  return [...found]
}

function basename(path) {
  return String(path).split(/[/\\]/).pop()
}

/*
 * Names, and the defect this whole section exists to close.
 *
 * An upload is PUBLISHED under safeMediaName(...), but the editor writes into the
 * article the name the person actually uploaded, because that is the name the bytes
 * have in the private repository and the name the editor's own preview resolves
 * against. Those two strings agree only when the file was already named in lowercase
 * hyphenated form. One underscore, space, capital or accent and the article referred to
 * a name nothing had been indexed under, so the publish refused with missing_media
 * while naming a file that was sitting in the media library the whole time. The person
 * publishing then had no path from the sentence they could see to the cause.
 *
 * The derivation is not changed to fix that, it is applied on both sides. An upload
 * answers to its published name AND to the name it was uploaded under, and the copy of
 * the article that crosses into the public repository has its references rewritten to
 * the published name. The published name still wins a tie, so an already published
 * article and an already scraped social card resolve to exactly the bytes they resolved
 * to before, and replacing an image is still an in place edit.
 *
 * Rewriting the reference is not cosmetic tidying. Without it a publish would succeed
 * and the live page would then ask for /blog-media/My_Hero.PNG from a directory that
 * only ever contains my-hero.png: a broken picture on homezai.com, which is worse than
 * the refusal it replaced.
 *
 * An alias is only honoured when it is unambiguous. If two uploads would both answer to
 * one name, neither claims it and the reference fails closed rather than resolving to
 * whichever the loop happened to read first.
 */
const AMBIGUOUS = Symbol('ambiguous media alias')

/** decodeURIComponent, except that a lone percent sign is a character rather than a throw. */
function decodeReference(reference) {
  try {
    return decodeURIComponent(reference)
  } catch {
    return reference
  }
}

function buildMediaIndex(media, errors) {
  const byPublishedName = new Map()

  for (const item of media) {
    const check = validateMedia(item.bytes, item.path)
    const name = safeMediaName(basename(item.path), check.ok ? check.type : 'image/jpeg')
    if (byPublishedName.has(name)) {
      errors.push({
        kind: 'media_name_collision',
        message: `two uploads both publish as ${name}`,
        files: [byPublishedName.get(name).path, item.path],
      })
      continue
    }
    byPublishedName.set(name, { ...item, check, publishedName: name })
  }

  const byUploadedName = new Map()
  for (const entry of byPublishedName.values()) {
    const uploaded = basename(entry.path)
    for (const alias of new Set([uploaded, decodeReference(uploaded)])) {
      const held = byUploadedName.get(alias)
      byUploadedName.set(alias, held && held !== entry ? AMBIGUOUS : entry)
    }
  }

  return { byPublishedName, byUploadedName }
}

/** The upload a reference means, or null if nothing answers to it unambiguously. */
function resolveReference(reference, index) {
  const published = index.byPublishedName.get(reference)
  if (published) return published

  for (const key of new Set([reference, decodeReference(reference)])) {
    const candidate = index.byUploadedName.get(key)
    if (candidate === AMBIGUOUS) return null
    if (candidate) return candidate
  }
  return null
}

/**
 * The one upload whose name is the reference written a different way, if there is
 * exactly one. Used only to explain a failure, never to resolve one.
 */
function nearestUpload(reference, index) {
  const stem = mediaNameStem(decodeReference(reference))
  const matches = [...index.byPublishedName.values()].filter(
    (item) => mediaNameStem(basename(item.path)) === stem,
  )
  return matches.length === 1 ? matches[0] : null
}

/**
 * Say which file was not found AND which file was, because the old sentence blamed the
 * media library for a file that was in it, and the reader had no way to see that the
 * two names were the same name written twice.
 */
function missingMediaError(post, reference, index) {
  const head = `${post.file} references /blog-media/${reference}, which is not in the media library`
  const nearest = nearestUpload(reference, index)

  if (nearest) {
    return {
      kind: 'missing_media',
      message:
        `${head}. The library does hold ${nearest.path}, which publishes as ` +
        `/blog-media/${nearest.publishedName}: the article and the file do not use the same name`,
      file: post.file,
      reference,
      nearest: nearest.path,
    }
  }

  const names = [...index.byPublishedName.keys()]
  const holds =
    names.length === 0
      ? 'The media library is empty'
      : `The media library holds ${names.length} file${names.length === 1 ? '' : 's'}: ` +
        `${names.slice(0, 6).join(', ')}${names.length > 6 ? ', ...' : ''}`

  return { kind: 'missing_media', message: `${head}. ${holds}`, file: post.file, reference }
}

/**
 * Rewrite a post's media references to the names its images are published under.
 *
 * A reference nothing answers to is left exactly as written, so the failure is reported
 * against the string the author typed rather than against something this function
 * invented.
 */
function rewriteReferences(post, index) {
  const published = (reference) => resolveReference(reference, index)?.publishedName ?? null

  const rewritten = { ...post }

  if (typeof post.heroImage === 'string' && post.heroImage.startsWith(PUBLIC_MEDIA_PREFIX)) {
    const name = published(post.heroImage.slice(PUBLIC_MEDIA_PREFIX.length))
    if (name) rewritten.heroImage = `${PUBLIC_MEDIA_PREFIX}${name}`
  }

  if (typeof post.body === 'string') {
    rewritten.body = post.body.replace(BODY_MEDIA_REFERENCE, (whole, reference) => {
      const name = published(reference)
      return name ? `${PUBLIC_MEDIA_PREFIX}${name}` : whole
    })
  }

  return rewritten
}

/*
 * Timestamps.
 *
 * The editor promises that the publish date is set on first publish and left alone
 * afterwards, and until this was tried against production nothing actually kept that
 * promise: the CMS does not stamp it and the sync did not either, so an article
 * published from the editor arrived with no date at all.
 *
 * Stamping it here has one trap. If the value were recomputed on every run, the sync
 * would rewrite a timestamp even when nothing about the article had changed, which
 * would commit, which would deploy, which would run the sync again. So the previous
 * published copy is the source of truth: publishedAt is taken from it when it exists,
 * and updatedAt only moves when something other than the timestamps actually differs.
 */
function stampTimestamps(post, previous, now) {
  const publishedAt = previous?.publishedAt || post.publishedAt || now

  const meaningfulChange =
    !previous ||
    ['title', 'slug', 'excerpt', 'author', 'heroImage', 'heroImageAlt', 'heroImageDecorative',
      'seoTitle', 'seoDescription', 'featured', 'featureOrder'].some(
      (field) => JSON.stringify(previous[field] ?? null) !== JSON.stringify(post[field] ?? null),
    ) ||
    String(previous.body ?? '').trim() !== String(post.body ?? '').trim() ||
    JSON.stringify(previous.tags ?? []) !== JSON.stringify(post.tags ?? []) ||
    JSON.stringify(previous.previousSlugs ?? []) !== JSON.stringify(post.previousSlugs ?? [])

  const updatedAt = meaningfulChange ? post.updatedAt || now : previous.updatedAt || publishedAt

  return { ...post, publishedAt, updatedAt }
}

export function planPublishSync({
  files = [],
  media = [],
  existingPublic = [],
  existingPosts = [],
  now = new Date().toISOString(),
} = {}) {
  const errors = []
  const warnings = []
  const withheld = []

  // 1. Parse. A file that will not parse is named and stops the publish.
  const posts = []
  for (const file of files) {
    try {
      posts.push(parsePostFile(file.contents, file.path))
    } catch (cause) {
      errors.push({ kind: 'unparseable_post', file: file.path, message: cause.message })
    }
  }

  // 2. Index the media by the name it will be published under. The name is derived from
  //    the source file name only, so replacing an image is an in place edit and every
  //    already published article and already scraped social card keeps resolving.
  const index = buildMediaIndex(media, errors)
  const { byPublishedName } = index

  // 3. Point every reference at the name its image is published under, before anything
  //    reads a reference. This has to happen ahead of the timestamp comparison below:
  //    the previous published copy carries the rewritten name, so comparing it against
  //    an unrewritten post would report a change on every single run, which would
  //    commit, which would deploy, which would run the sync again.
  const resolved = posts.map((post) => rewriteReferences(post, index))

  // 4. Stamp the timestamps before validating, so that an article the editor saved
  //    without a publish date is dated rather than rejected. The previous published
  //    copy, when there is one, decides both values.
  const previousBySlug = new Map()
  for (const previous of existingPosts) {
    try {
      const parsed = parsePostFile(previous.contents, previous.path)
      previousBySlug.set(parsed.slug, parsed)
    } catch {
      // A previously published file that no longer parses is not a reason to refuse a
      // new publish; it is simply replaced.
    }
  }

  const stamped = resolved.map((post) =>
    post.status === 'published' ? stampTimestamps(post, previousBySlug.get(post.slug), now) : post,
  )

  // 5. Validate the collection. Drafts are dropped here and never read again.
  const collection = buildCollection(stamped)
  errors.push(...collection.errors)
  warnings.push(...collection.warnings)

  for (const post of stamped) {
    if (post.status !== 'published') {
      withheld.push({ path: post.file, reason: 'draft' })
    }
  }

  // 6. Resolve every reference a published post makes.
  const referenced = new Set()
  for (const post of collection.posts) {
    for (const reference of mediaReferences(post)) {
      const item = resolveReference(reference, index)
      if (!item) {
        errors.push(missingMediaError(post, reference, index))
        continue
      }
      if (!item.check.ok) {
        errors.push({
          kind: 'invalid_media',
          message: `${item.path} cannot be published: ${item.check.reason}`,
          file: item.path,
          code: item.check.code,
        })
        continue
      }
      referenced.add(item.publishedName)
    }
  }

  for (const [name, item] of byPublishedName) {
    if (!referenced.has(name)) withheld.push({ path: item.path, reason: 'unreferenced' })
  }

  // 7. Fail closed. Nothing moves unless the whole plan is sound.
  if (errors.length > 0) {
    return { writes: [], deletes: [], errors, warnings, withheld }
  }

  const writes = []
  for (const post of collection.posts) {
    writes.push({
      path: `content/posts/${post.slug}.md`,
      contents: serialisePostFile(post),
      encoding: 'utf8',
    })
  }
  for (const name of [...referenced].sort()) {
    const item = byPublishedName.get(name)
    writes.push({
      path: `public/blog-media/${name}`,
      contents: item.bytes,
      encoding: 'binary',
      // The type was decided from the magic bytes here, so the writer never has to
      // sniff again and never has to trust the extension.
      type: item.check.type,
      source: item.path,
    })
  }

  // 8. Anything the public repository still holds inside a managed directory that this
  //    plan did not write is gone from the private repository or is no longer published,
  //    so it is removed. Nothing outside those two directories is ever touched.
  const written = new Set(writes.map((w) => w.path))
  const deletes = existingPublic.filter(
    (path) => MANAGED_PREFIXES.some((prefix) => path.startsWith(prefix)) && !written.has(path),
  )

  return { writes, deletes, errors, warnings, withheld, collection }
}
