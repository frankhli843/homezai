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
  return String(value)
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

  return {
    ...data,
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
