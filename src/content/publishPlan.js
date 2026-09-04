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
import { validateMedia, safeMediaName } from './media.js'

/** The only two directories in the public repository this process owns. */
export const MANAGED_PREFIXES = Object.freeze(['content/posts/', 'public/blog-media/'])

/** Where a published image is served from. */
const PUBLIC_MEDIA_PREFIX = '/blog-media/'

/** Every /blog-media/ reference a post makes, from its hero image and from its body. */
function mediaReferences(post) {
  const found = new Set()
  if (typeof post.heroImage === 'string' && post.heroImage.startsWith(PUBLIC_MEDIA_PREFIX)) {
    found.add(post.heroImage.slice(PUBLIC_MEDIA_PREFIX.length))
  }
  const body = String(post.body ?? '')
  for (const match of body.matchAll(/\/blog-media\/([A-Za-z0-9][A-Za-z0-9._-]*)/g)) {
    found.add(match[1])
  }
  return [...found]
}

function basename(path) {
  return String(path).split(/[/\\]/).pop()
}

export function planPublishSync({ files = [], media = [], existingPublic = [] } = {}) {
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

  // 2. Validate the collection. Drafts are dropped here and never read again.
  const collection = buildCollection(posts)
  errors.push(...collection.errors)
  warnings.push(...collection.warnings)

  for (const post of posts) {
    if (post.status !== 'published') {
      withheld.push({ path: post.file, reason: 'draft' })
    }
  }

  // 3. Index the media by the name it will be published under. The name is derived from
  //    the source file name only, so replacing an image is an in place edit and every
  //    already published article and already scraped social card keeps resolving.
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

  // 4. Resolve every reference a published post makes.
  const referenced = new Set()
  for (const post of collection.posts) {
    for (const reference of mediaReferences(post)) {
      const item = byPublishedName.get(reference)
      if (!item) {
        errors.push({
          kind: 'missing_media',
          message: `${post.file} references /blog-media/${reference}, which is not in the media library`,
          file: post.file,
          reference,
        })
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
      referenced.add(reference)
    }
  }

  for (const [name, item] of byPublishedName) {
    if (!referenced.has(name)) withheld.push({ path: item.path, reason: 'unreferenced' })
  }

  // 5. Fail closed. Nothing moves unless the whole plan is sound.
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

  // 6. Anything the public repository still holds inside a managed directory that this
  //    plan did not write is gone from the private repository or is no longer published,
  //    so it is removed. Nothing outside those two directories is ever touched.
  const written = new Set(writes.map((w) => w.path))
  const deletes = existingPublic.filter(
    (path) => MANAGED_PREFIXES.some((prefix) => path.startsWith(prefix)) && !written.has(path),
  )

  return { writes, deletes, errors, warnings, withheld, collection }
}
