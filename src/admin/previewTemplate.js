/*
 * What the editor's Preview pane shows.
 *
 * Pure: no window, no stylesheet, no editor. preview.js is the part that wires this
 * into Sveltia, so everything below can be exercised directly by the test suite.
 *
 * Sveltia's own preview is a labelled dump of every field: Internal id, Web address,
 * Home page order, Previous web addresses, and so on. That is a view of the form, not
 * a view of the article, and a publisher deciding whether something is ready to go out
 * cannot use it to answer the only question that matters, which is what the reader
 * will see. This module replaces it with the real thing.
 *
 * Two properties are deliberate.
 *
 * The body is rendered by src/content/markdown.js, the exact renderer the published
 * page uses, not by a second one that happens to look similar. If the two differed the
 * preview would be able to lie in the one direction that matters most: raw HTML pasted
 * into the body renders as inert text on the live site, and a preview using a
 * different renderer could show it executing, or show it rendering, and either way
 * would teach the publisher something untrue.
 *
 * The stylesheet is src/App.css itself, imported as text and handed to Sveltia as a
 * raw style, rather than a hand copied subset. A copy drifts the first time somebody
 * changes the real article styles, and a preview that drifts is worse than no preview
 * because it is believed.
 *
 * Everything here degrades. Sveltia gives the preview component a React element
 * factory only indirectly, so the element is built from the shape of a real one; if
 * that ever stops working, or a field is missing, or the hero has not been uploaded
 * yet, the preview says so in place rather than throwing and leaving an empty pane.
 */

import { renderMarkdown, readingTimeMinutes } from '../content/markdown.js'

/** Local media lives here once published. Anything else cannot be a hero image. */
export const MEDIA_PREFIX = '/blog-media/'

const SITE_ORIGIN = 'https://homezai.com'

/** Escape a value that came from a person typing into the editor. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Read one field out of whatever Sveltia hands us. It currently passes an
 * Immutable-style entry with getIn; a plain object is accepted too so that a change in
 * that shape degrades to an empty preview rather than an exception.
 */
export function readField(entry, name) {
  if (!entry) return undefined
  if (typeof entry.getIn === 'function') {
    try {
      return entry.getIn(['data', name])
    } catch {
      return undefined
    }
  }
  if (entry.data && typeof entry.data === 'object') return entry.data[name]
  return undefined
}

/**
 * The date line the article page prints. Kept in the same shape as the published page
 * rather than a locale default, and honest about an article that has never been
 * published, which has no date yet.
 */
export function formatPreviewDate(value) {
  if (!value) return 'Not published yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not published yet'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

/**
 * Where the hero image can actually be loaded from inside the preview frame.
 *
 * The frame is a blob document, so a site relative path resolves against nothing. The
 * order below is the order of certainty: the file the publisher just chose, then the
 * thumbnail Sveltia cached for the repository copy, then the published URL, which only
 * exists once the article has been published at least once. When none of them resolve
 * the caller draws a labelled placeholder instead of a broken image.
 */
export function resolveHeroSource(asset, path, thumbnailUrl) {
  if (asset && asset.fileObj && typeof URL !== 'undefined' && URL.createObjectURL) {
    try {
      return URL.createObjectURL(asset.fileObj)
    } catch {
      /* fall through */
    }
  }
  if (thumbnailUrl) return thumbnailUrl
  if (typeof path === 'string' && path.startsWith(MEDIA_PREFIX)) return SITE_ORIGIN + path
  if (typeof path === 'string' && /^https?:\/\//i.test(path)) return path
  return ''
}

/**
 * Sveltia keeps a thumbnail blob for every asset in the repository, keyed by the file
 * sha it also keeps in its file cache. Reading it is the only way to show a hero that
 * has been saved into the private repository but never published, which is exactly the
 * state an article is in while somebody is deciding whether to publish it.
 *
 * This reaches into the editor's own storage, so it is written to fail quietly: any
 * missing database, store, key or blob simply means no thumbnail and the caller moves
 * on to the next source.
 */
export async function loadCachedThumbnail(repo, mediaPath) {
  if (typeof indexedDB === 'undefined' || !repo || !mediaPath) return ''
  const request = (source) =>
    new Promise((resolve) => {
      source.onsuccess = () => resolve(source.result)
      source.onerror = () => resolve(undefined)
    })
  try {
    const db = await new Promise((resolve) => {
      const open = indexedDB.open(`github:${repo}`)
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => resolve(undefined)
    })
    if (!db) return ''
    const names = [...db.objectStoreNames]
    if (!names.includes('file-cache') || !names.includes('asset-thumbnails')) {
      db.close()
      return ''
    }
    const cached = await request(db.transaction('file-cache', 'readonly').objectStore('file-cache').get(mediaPath))
    const sha = cached && cached.sha
    if (!sha) {
      db.close()
      return ''
    }
    const blob = await request(db.transaction('asset-thumbnails', 'readonly').objectStore('asset-thumbnails').get(sha))
    db.close()
    if (!blob) return ''
    return URL.createObjectURL(blob)
  } catch {
    return ''
  }
}

/**
 * The preview markup.
 *
 * Deliberately the same element and class structure as ArticlePage in src/Blog.jsx, so
 * that the imported stylesheet dresses it exactly the way it dresses the live page.
 * Around it sits the part a reader never sees and a publisher needs: whether this is
 * live yet, and what the share card will look like when somebody posts the link.
 */
export function buildPreviewHtml(fields) {
  const {
    title,
    slug,
    excerpt,
    body,
    author,
    status,
    publishedAt,
    updatedAt,
    heroSrc,
    heroAlt,
    heroDecorative,
    featured,
    seoTitle,
    seoDescription,
  } = fields

  const safeTitle = escapeHtml(title || 'Untitled article')
  const url = `${SITE_ORIGIN}/blog/${slug || ''}${slug ? '/' : ''}`
  const shareTitle = escapeHtml(seoTitle || title || 'Untitled article')
  const shareDescription = escapeHtml(seoDescription || excerpt || '')
  const isPublished = status === 'published'
  const bodyHtml = renderMarkdown(body || '')
  const minutes = readingTimeMinutes(body || '')

  const hero = heroSrc
    ? `<img src="${escapeHtml(heroSrc)}" alt="${escapeHtml(heroDecorative ? '' : heroAlt || '')}" width="1600" height="900" decoding="async" />`
    : `<div class="preview-hero-missing">No hero image yet. The article needs one before it can be published, and it is the image that appears when the link is shared.</div>`

  const altWarning =
    heroSrc && !heroDecorative && !String(heroAlt || '').trim()
      ? `<p class="preview-warning">This image has no description. Add one, or mark the image decorative, before publishing.</p>`
      : ''

  const statusLine = isPublished
    ? `<span class="preview-badge preview-badge-live">Published</span> This is live at <span class="preview-url">${escapeHtml(url)}</span>`
    : `<span class="preview-badge preview-badge-draft">Draft</span> Nobody outside this editor can see this. It will live at <span class="preview-url">${escapeHtml(url)}</span> once you publish it.`

  return `
    <div class="preview-shell">
      <p class="preview-status">${statusLine}</p>
      ${featured ? `<p class="preview-status preview-status-featured">Selected for the home page.</p>` : ''}
      ${altWarning}
      <main class="blog-page">
        <article class="article">
          <header class="article-header">
            <div class="article-container">
              <p class="article-eyebrow">Blog</p>
              <h1>${safeTitle}</h1>
              <p class="article-meta">
                <span>${escapeHtml(author || 'Homezai Team')}</span>
                <span aria-hidden="true"> &middot; </span>
                <span>${escapeHtml(formatPreviewDate(publishedAt))}</span>
                <span aria-hidden="true"> &middot; </span>
                <span>${minutes} min read</span>
              </p>
            </div>
          </header>
          <figure class="article-hero">${hero}</figure>
          <div class="article-container">
            <div class="article-body">${bodyHtml}</div>
            ${
              updatedAt && updatedAt !== publishedAt
                ? `<p class="article-updated">Updated ${escapeHtml(formatPreviewDate(updatedAt))}</p>`
                : ''
            }
          </div>
        </article>
      </main>
      <section class="preview-share" aria-label="Share preview">
        <h2 class="preview-share-heading">When somebody shares this link</h2>
        <div class="preview-share-card">
          ${heroSrc ? `<img src="${escapeHtml(heroSrc)}" alt="" />` : `<div class="preview-hero-missing preview-share-missing">No image yet</div>`}
          <div class="preview-share-text">
            <p class="preview-share-domain">homezai.com</p>
            <p class="preview-share-title">${shareTitle}</p>
            <p class="preview-share-description">${shareDescription || 'No summary yet. The summary is what a reader sees under the headline when the link is shared.'}</p>
          </div>
        </div>
      </section>
    </div>
  `
}

/** Extra styling for the parts of the preview that have no counterpart on the live page. */
export const PREVIEW_CHROME_CSS = `
  body { margin: 0; background: #F8FAFC; }
  .preview-shell { padding-bottom: 48px; }
  .preview-status {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 13px; line-height: 1.5; color: #475569;
    margin: 0; padding: 12px 20px; background: #FFFFFF; border-bottom: 1px solid #E2E8F0;
  }
  .preview-status-featured { border-bottom: 1px solid #E2E8F0; }
  .preview-badge {
    display: inline-block; border-radius: 999px; padding: 2px 10px; margin-right: 8px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
  }
  .preview-badge-draft { background: #FEF3C7; color: #92400E; }
  .preview-badge-live { background: #DCFCE7; color: #166534; }
  .preview-url { color: #0F172A; font-weight: 500; }
  .preview-warning {
    font-family: Inter, sans-serif; font-size: 13px; color: #92400E;
    background: #FFFBEB; margin: 0; padding: 12px 20px; border-bottom: 1px solid #FDE68A;
  }
  .preview-hero-missing {
    display: flex; align-items: center; justify-content: center; text-align: center;
    aspect-ratio: 16 / 9; background: #F1F5F9; border: 1px dashed #CBD5E1; border-radius: 12px;
    color: #64748B; font-family: Inter, sans-serif; font-size: 14px; padding: 24px;
  }
  .preview-share { max-width: 560px; margin: 40px auto 0; padding: 0 20px; }
  .preview-share-heading {
    font-family: Inter, sans-serif; font-size: 13px; font-weight: 600; text-transform: none;
    color: #64748B; margin: 0 0 12px;
  }
  .preview-share-card {
    border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #FFFFFF;
  }
  .preview-share-card img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; }
  .preview-share-missing { border: 0; border-radius: 0; }
  .preview-share-text { padding: 12px 16px 16px; font-family: Inter, sans-serif; }
  .preview-share-domain { margin: 0 0 4px; font-size: 12px; color: #64748B; }
  .preview-share-title { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #0F172A; }
  .preview-share-description { margin: 0; font-size: 14px; color: #475569; }
`

/**
 * Build a React element without React.
 *
 * Sveltia renders the preview with its own bundled React and does not export it, so
 * the only honest way to hand it an element is to copy the shape of one it just made.
 * widgetFor returns a real element, and its $$typeof symbol is the tag React checks.
 * If the shape ever changes this returns null, which renders an empty pane rather than
 * throwing inside the editor.
 */
export function makeElementFactory(sampleElement) {
  const marker = sampleElement && sampleElement.$$typeof
  if (!marker) return null
  return (type, props) => ({
    $$typeof: marker,
    type,
    key: null,
    ref: null,
    props: props || {},
    _owner: null,
    _store: {},
  })
}

/** Collect the fields the preview needs out of the editor's entry. */
export function collectFields(entry) {
  return {
    title: readField(entry, 'title'),
    slug: readField(entry, 'slug'),
    excerpt: readField(entry, 'excerpt'),
    body: readField(entry, 'body'),
    author: readField(entry, 'author'),
    status: readField(entry, 'status'),
    publishedAt: readField(entry, 'publishedAt'),
    updatedAt: readField(entry, 'updatedAt'),
    heroPath: readField(entry, 'heroImage'),
    heroAlt: readField(entry, 'heroImageAlt'),
    heroDecorative: Boolean(readField(entry, 'heroImageDecorative')),
    featured: Boolean(readField(entry, 'featured')),
    seoTitle: readField(entry, 'seoTitle'),
    seoDescription: readField(entry, 'seoDescription'),
  }
}
