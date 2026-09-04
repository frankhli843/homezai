/*
 * Reading and writing the on disk form of a post: YAML frontmatter, then a markdown
 * body. This is the format Sveltia CMS writes, so it is also the format a person can
 * read, diff and restore straight out of git without any tooling at all. That is most
 * of why the repository backed approach was chosen.
 */

import { load as yamlLoad, dump as yamlDump, JSON_SCHEMA } from 'js-yaml'

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/

/** Fields that are stored, in a stable order so a save produces a minimal diff. */
const FIELD_ORDER = [
  'id',
  'title',
  'slug',
  'excerpt',
  'status',
  'author',
  'publishedAt',
  'updatedAt',
  'heroImage',
  'heroImageAlt',
  'heroImageDecorative',
  'seoTitle',
  'seoDescription',
  'tags',
  'featured',
  'featureOrder',
  'previousSlugs',
]

/** An instant, whatever js-yaml decided to give us. YAML parses unquoted dates to Date. */
function toInstant(value) {
  if (value == null) return undefined
  if (value instanceof Date) return value.toISOString()
  const text = String(value).trim()
  return text.length === 0 ? undefined : text
}

/*
 * The editor writes every optional field it knows about, and writes the ones nobody
 * filled in as an empty string rather than leaving them out. That is reasonable of it,
 * but downstream an empty string is not the same thing as an absent value: a required
 * field check would pass on '' and an ISO instant check would fail on it, which is how
 * a perfectly ordinary article ends up rejected for "updatedAt must be an ISO 8601
 * instant". Empty means absent, and it is normalised once, here, rather than in each
 * of the places that would otherwise have to remember.
 */
function blankToUndefined(value) {
  if (typeof value === 'string' && value.trim().length === 0) return undefined
  if (Array.isArray(value) && value.length === 0) return undefined
  return value
}

/**
 * Parse one post file.
 *
 * Throws rather than returning a partial post. A file that cannot be parsed is an
 * operator visible failure, never an empty article that ships looking fine.
 */
export function parsePostFile(contents, file) {
  const match = FRONTMATTER.exec(String(contents ?? ''))
  if (!match) {
    throw new Error(`${file}: no YAML frontmatter block. A post starts with a --- delimited header.`)
  }

  let data
  try {
    data = yamlLoad(match[1], { schema: JSON_SCHEMA })
  } catch (cause) {
    throw new Error(`${file}: frontmatter is not valid YAML: ${cause.message}`)
  }

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${file}: frontmatter must be a mapping of field names to values`)
  }

  const normalised = {}
  for (const [key, value] of Object.entries(data)) {
    const cleaned = blankToUndefined(value)
    if (cleaned !== undefined) normalised[key] = cleaned
  }

  return {
    ...normalised,
    publishedAt: toInstant(data.publishedAt),
    updatedAt: toInstant(data.updatedAt),
    body: match[2] ?? '',
    file,
  }
}

/** Write a post back out in the canonical field order. */
export function serialisePostFile(post) {
  const front = {}
  for (const field of FIELD_ORDER) {
    if (post[field] !== undefined && post[field] !== null) front[field] = post[field]
  }
  const header = yamlDump(front, { lineWidth: 0, noRefs: true, sortKeys: false })
  return `---\n${header}---\n\n${String(post.body ?? '').replace(/^\n+/, '')}`
}
