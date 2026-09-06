/*
 * Media validation.
 *
 * Everything about an upload except its bytes is attacker controlled: the file name,
 * the extension and any content type a client claims. So type is decided by the leading
 * bytes and nothing else, and the answer is checked against a whitelist rather than a
 * blacklist.
 *
 * SVG is excluded on purpose even though it is an image. An SVG is an XML document that
 * can carry script and external references, and it would be served from the site's own
 * origin, so an accepted SVG is stored cross site scripting.
 *
 * Metadata stripping and resizing happen in mediaPipeline.js, which needs a native
 * image library. This module stays dependency free so that the rules can be tested
 * anywhere.
 */

/** Eight megabytes. Large enough for a full width hero photograph, small enough that a repository stays sane. */
export const MAX_MEDIA_BYTES = 8 * 1024 * 1024

/** The only types that may be published. */
export const ALLOWED_MEDIA_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])

const EXTENSION_FOR_TYPE = Object.freeze({
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
})

function startsWith(buffer, bytes) {
  if (buffer.length < bytes.length) return false
  for (let i = 0; i < bytes.length; i += 1) {
    if (buffer[i] !== bytes[i]) return false
  }
  return true
}

/**
 * Identify a raster image from its magic bytes.
 *
 * Returns null for anything it does not recognise, including SVG and HTML, rather than
 * guessing from the extension.
 */
export function sniffMediaType(buffer) {
  if (!buffer || buffer.length < 4) return null
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (startsWith(buffer, [0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (
    buffer.length >= 12 &&
    startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }
  return null
}

/**
 * Decide whether a file may be published.
 *
 * Every rejection carries both a machine readable code and a sentence, because an
 * operator looking at a failed publish needs to tell a file that was too big from a
 * file that was not an image at all.
 */
export function validateMedia(buffer, name = '') {
  if (!buffer || buffer.length === 0) {
    return { ok: false, code: 'empty', reason: `${name || 'file'} is empty` }
  }

  if (buffer.length > MAX_MEDIA_BYTES) {
    return {
      ok: false,
      code: 'too_large',
      reason: `${name || 'file'} is ${buffer.length} bytes, over the ${MAX_MEDIA_BYTES} byte limit`,
    }
  }

  const type = sniffMediaType(buffer)

  if (!type) {
    return {
      ok: false,
      code: 'unrecognised_type',
      reason: `${name || 'file'} is not a JPEG, PNG or WebP image. Vector, document and archive files are not accepted, whatever the extension says`,
    }
  }

  if (!ALLOWED_MEDIA_TYPES.includes(type)) {
    return {
      ok: false,
      code: 'disallowed_type',
      reason: `${name || 'file'} is ${type}, which is not one of ${ALLOWED_MEDIA_TYPES.join(', ')}`,
      type,
    }
  }

  return { ok: true, type, extension: EXTENSION_FOR_TYPE[type] }
}

/**
 * The stem of the published file name: everything except the extension.
 *
 * Separate from safeMediaName because the extension is decided by the bytes while the
 * stem is decided by the name, so two files can share a stem and still publish under
 * two different names. Comparing stems is how the publish step recognises that the name
 * an article used and the name a file was uploaded under are the same name written two
 * ways, which is what lets a failed publish say which file it did find.
 */
export function mediaNameStem(sourceName) {
  const basename = String(sourceName || '')
    .split(/[/\\]/)
    .pop()
  const stem = basename.replace(/\.[A-Za-z0-9]+$/, '')
  const cleaned = stem
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'image'
}

/**
 * The published file name for an upload.
 *
 * Deterministic and derived only from the source name, never from the bytes. That is
 * what makes replacing an image an in place edit: the URL an already published article
 * and an already scraped social card point at keeps resolving.
 */
export function safeMediaName(sourceName, type) {
  return `${mediaNameStem(sourceName)}${EXTENSION_FOR_TYPE[type] || '.jpg'}`
}
