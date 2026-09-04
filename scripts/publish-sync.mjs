#!/usr/bin/env node
/*
 * The publish step.
 *
 * Runs in GitHub Actions from the private content repository's workflow, with this
 * repository checked out alongside it, so that all of the logic lives here where it is
 * unit tested and the private repository holds only content plus a thirty line
 * workflow.
 *
 * It is the boundary between private and public. planPublishSync decides what may
 * cross; this file does the reading, the image processing and the writing, and nothing
 * else. If anything at all is wrong it exits non zero having written nothing, which
 * leaves the last good publish standing on the live site rather than shipping a
 * half correct one.
 *
 * Usage: node scripts/publish-sync.mjs --content <path to the content checkout>
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

import { planPublishSync } from '../src/content/publishPlan.js'

const site = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Widest image the site ever needs. A hero renders at 1000 CSS pixels at most. */
const MAX_IMAGE_WIDTH = 1600

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? fallback : process.argv[index + 1]
}

function listFiles(dir) {
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()) : []
}

/**
 * Append a line to the workflow summary, so a publish that failed says which of the
 * five distinguishable things went wrong on the run page rather than only in a log.
 */
function summary(line) {
  const file = process.env.GITHUB_STEP_SUMMARY
  if (file) writeFileSync(file, `${line}\n`, { flag: 'a' })
  console.log(line)
}

/**
 * Re-encode an image for publication.
 *
 * sharp drops every metadata block unless it is explicitly asked to keep one, so this
 * is also where GPS coordinates, camera serial numbers and the Canva XMP that a partner
 * supplied artwork once carried stop being published. rotate() is called first so that
 * an EXIF orientation is baked into the pixels before the tag it depended on is
 * discarded, otherwise a phone photograph would publish on its side.
 */
async function processImage(bytes, type) {
  const pipeline = sharp(bytes).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
  if (type === 'image/jpeg') return pipeline.jpeg({ quality: 86, mozjpeg: true }).toBuffer()
  if (type === 'image/png') return pipeline.png({ compressionLevel: 9 }).toBuffer()
  return pipeline.webp({ quality: 86 }).toBuffer()
}

async function main() {
  const contentRoot = argument('content')
  if (!contentRoot) {
    console.error('publish-sync: --content <path> is required')
    process.exit(2)
  }

  const postsDir = join(contentRoot, 'content/posts')
  const mediaDir = join(contentRoot, 'content/media')

  const files = listFiles(postsDir)
    .filter((entry) => entry.name.endsWith('.md'))
    .map((entry) => ({
      path: `content/posts/${entry.name}`,
      contents: readFileSync(join(postsDir, entry.name), 'utf8'),
    }))

  const media = listFiles(mediaDir).map((entry) => ({
    path: `content/media/${entry.name}`,
    bytes: readFileSync(join(mediaDir, entry.name)),
  }))

  const existingPublic = [
    ...listFiles(join(site, 'content/posts'))
      .filter((entry) => entry.name.endsWith('.md'))
      .map((entry) => `content/posts/${entry.name}`),
    ...listFiles(join(site, 'public/blog-media'))
      .filter((entry) => entry.name !== '.gitkeep')
      .map((entry) => `public/blog-media/${entry.name}`),
  ]

  const plan = planPublishSync({ files, media, existingPublic })

  if (plan.errors.length > 0) {
    summary('## Publish failed')
    summary('')
    summary('Nothing was changed on the live site. The last published version is still up.')
    summary('')
    for (const error of plan.errors) {
      summary(`- **${error.kind}**: ${error.message}`)
    }
    process.exit(1)
  }

  let wroteMedia = 0
  let wrotePosts = 0

  for (const write of plan.writes) {
    const target = join(site, write.path)
    mkdirSync(dirname(target), { recursive: true })
    if (write.encoding === 'binary') {
      writeFileSync(target, await processImage(write.contents, write.type))
      wroteMedia += 1
    } else {
      writeFileSync(target, write.contents, 'utf8')
      wrotePosts += 1
    }
  }

  for (const path of plan.deletes) {
    rmSync(join(site, path), { force: true })
  }

  summary('## Publish')
  summary('')
  summary(`- ${wrotePosts} published article(s) written`)
  summary(`- ${wroteMedia} image(s) processed, resized to at most ${MAX_IMAGE_WIDTH}px and stripped of embedded metadata`)
  summary(`- ${plan.deletes.length} file(s) removed because they are unpublished or deleted`)
  summary(
    `- ${plan.withheld.filter((w) => w.reason === 'draft').length} draft(s) deliberately kept private`,
  )
  for (const warning of plan.warnings) summary(`- warning: ${warning.message}`)
}

main().catch((error) => {
  summary('## Publish failed')
  summary('')
  summary(`Unexpected failure: ${error.message}`)
  console.error(error)
  process.exit(1)
})
