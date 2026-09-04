/*
 * Head metadata.
 *
 * A social crawler fetches the URL and reads the bytes. It does not mount React, so
 * anything this module produces has to end up in the file GitHub Pages serves, written
 * at build time by the prerenderer. Nothing here may depend on the browser.
 *
 * The escaping is the security relevant part. Titles and descriptions come from the
 * CMS, so they are attacker influenced strings being placed inside HTML attributes and
 * inside a script element, which are two different escaping problems.
 */

/** The production origin. Every canonical and every social image is absolute against it. */
export const SITE_ORIGIN = 'https://homezai.com'

export const SITE_NAME = 'Homezai'

/**
 * The one place the site title lives. index.html carries the same string so the dev
 * server and the prerendered home page agree; a test pins them together.
 */
export const HOME_TITLE = 'Homezai - AI Showings Management for Real Estate'

const HOME_DESCRIPTION =
  'Homezai revolutionizes property showings for real estate professionals with intelligent scheduling, automated routing, and seamless integrations.'

export const BLOG_INDEX_TITLE = 'Blog'

export const BLOG_INDEX_DESCRIPTION =
  'News, product updates and practical guidance from the Homezai team on showings, MLS integrations and the day to day work of a real estate professional.'

/** Default social card for any page that has no image of its own. */
const DEFAULT_SOCIAL_IMAGE = '/images/homezai-wordmark.png'
const DEFAULT_SOCIAL_IMAGE_WIDTH = 1600
const DEFAULT_SOCIAL_IMAGE_HEIGHT = 400

/**
 * Title and description for every route that is not an article. Keyed by the canonical
 * path with its trailing slash, which is the form GitHub Pages actually serves.
 */
const STATIC_META = {
  '/': { title: HOME_TITLE, description: HOME_DESCRIPTION, bare: true },
  '/blog/': { title: BLOG_INDEX_TITLE, description: BLOG_INDEX_DESCRIPTION },
  '/pricing/': {
    title: 'Plans and Pricing',
    description:
      'Subscription plans and pricing for MLSs, associations and brokerages using Homezai to manage property showings.',
  },
  '/integrations/': {
    title: 'Integrations',
    description:
      'The MLSs, associations and CRM platforms Homezai connects to, so showings, listings and rosters stay in step.',
  },
  '/contact/': {
    title: 'Contact Us',
    description: 'Talk to the Homezai team about a demo, pricing or support for your organization.',
  },
  '/terms/': { title: 'Terms of Service', description: 'The terms that govern use of the Homezai website and platform.' },
  '/privacy/': { title: 'Privacy Policy', description: 'How Homezai collects, uses and protects personal information.' },
  '/accessibility/': {
    title: 'Accessibility Statement',
    description: 'Homezai commitment to an accessible website and platform, and how to report a barrier.',
  },
  '/dpa/': {
    title: 'Data Processing Agreement',
    description: 'The data processing terms that apply to Homezai customers.',
  },
  '/support/': { title: 'Support', description: 'Homezai support and contact options.', robots: 'noindex, follow' },
  '/404/': { title: 'Page not found', description: 'That page does not exist on homezai.com.', robots: 'noindex, follow' },
  '/admin/': {
    title: 'Homezai content editor',
    description: 'Authorized publishers only.',
    robots: 'noindex, nofollow',
  },
}

/** Absolute https URL for a site relative path. */
export function absoluteUrl(path) {
  if (typeof path !== 'string' || path.length === 0) return SITE_ORIGIN + '/'
  if (/^https?:\/\//i.test(path)) return path
  return SITE_ORIGIN + (path.startsWith('/') ? path : `/${path}`)
}

/**
 * Head metadata for one route.
 *
 * @param {string} path canonical path, with a trailing slash
 * @param {{post?: object}} context the article, when the route is an article
 */
export function metaForRoute(path, context = {}) {
  const post = context.post
  const canonical = absoluteUrl(path)

  if (post) {
    const title = post.seoTitle || post.title
    const description = post.seoDescription || post.excerpt || BLOG_INDEX_DESCRIPTION
    const image = post.heroImage || DEFAULT_SOCIAL_IMAGE
    return {
      path,
      title: `${title} | ${SITE_NAME}`,
      rawTitle: title,
      description,
      canonical,
      image: absoluteUrl(image),
      imageAlt: post.heroImageAlt || title,
      imageWidth: post.heroImageWidth || null,
      imageHeight: post.heroImageHeight || null,
      ogType: 'article',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      publishedTime: post.publishedAt || null,
      modifiedTime: post.updatedAt || post.publishedAt || null,
      author: post.author || SITE_NAME,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description,
        image: absoluteUrl(image),
        datePublished: post.publishedAt || null,
        dateModified: post.updatedAt || post.publishedAt || null,
        author: { '@type': 'Organization', name: post.author || SITE_NAME },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: { '@type': 'ImageObject', url: absoluteUrl(DEFAULT_SOCIAL_IMAGE) },
        },
        mainEntityOfPage: canonical,
      },
    }
  }

  const entry = STATIC_META[path] || STATIC_META['/404/']
  return {
    path,
    title: entry.bare ? entry.title : `${entry.title} | ${SITE_NAME}`,
    rawTitle: entry.title,
    description: entry.description,
    canonical,
    image: absoluteUrl(DEFAULT_SOCIAL_IMAGE),
    imageAlt: SITE_NAME,
    imageWidth: DEFAULT_SOCIAL_IMAGE_WIDTH,
    imageHeight: DEFAULT_SOCIAL_IMAGE_HEIGHT,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    robots: entry.robots || 'index, follow',
    publishedTime: null,
    modifiedTime: null,
    author: SITE_NAME,
    structuredData: null,
  }
}

/** Escape for use inside a double quoted HTML attribute. */
export function escapeAttribute(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escape for use inside a script element. The parser looks for the literal characters
 * "</script" and nothing else, so escaping the forward slash is what keeps a title
 * containing a close tag from ending the block early.
 */
function escapeJsonForScript(value) {
  return JSON.stringify(value)
    .replace(/</g, String.fromCharCode(92) + 'u003c')
    .replace(/>/g, String.fromCharCode(92) + 'u003e')
    .replace(/&/g, String.fromCharCode(92) + 'u0026')
}

/** Render the head fragment a crawler will read on the first byte. */
export function renderHead(meta) {
  const tag = (name, content) => `<meta name="${name}" content="${escapeAttribute(content)}">`
  const prop = (property, content) => `<meta property="${property}" content="${escapeAttribute(content)}">`

  const lines = [
    `<title>${escapeAttribute(meta.title)}</title>`,
    tag('description', meta.description),
    `<link rel="canonical" href="${escapeAttribute(meta.canonical)}">`,
    tag('robots', meta.robots),
    prop('og:type', meta.ogType),
    prop('og:site_name', SITE_NAME),
    prop('og:title', meta.title),
    prop('og:description', meta.description),
    prop('og:url', meta.canonical),
    prop('og:image', meta.image),
    prop('og:image:alt', meta.imageAlt),
  ]

  if (meta.imageWidth) lines.push(prop('og:image:width', String(meta.imageWidth)))
  if (meta.imageHeight) lines.push(prop('og:image:height', String(meta.imageHeight)))
  if (meta.publishedTime) lines.push(prop('article:published_time', meta.publishedTime))
  if (meta.modifiedTime) lines.push(prop('article:modified_time', meta.modifiedTime))
  if (meta.ogType === 'article') lines.push(prop('article:author', meta.author))

  lines.push(
    tag('twitter:card', meta.twitterCard),
    tag('twitter:title', meta.title),
    tag('twitter:description', meta.description),
    tag('twitter:image', meta.image),
    tag('twitter:image:alt', meta.imageAlt),
  )

  if (meta.structuredData) {
    lines.push(
      `<script type="application/ld+json">${escapeJsonForScript(meta.structuredData)}</script>`,
    )
  }

  return lines.join('\n    ')
}
