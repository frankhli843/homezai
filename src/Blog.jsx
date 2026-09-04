/*
 * The public blog: the index, the article page and the home page feature strip.
 *
 * Everything these components render was generated at build time by
 * scripts/build-content.mjs from the markdown in content/posts. Only published
 * articles are ever written into that module, so a draft has no route to here at all;
 * there is no runtime fetch, no API and therefore nothing to filter at request time.
 *
 * bodyHtml is set with dangerouslySetInnerHTML on purpose, and the name is a fair
 * warning. It is safe here for one specific reason: the string was produced by
 * src/content/markdown.js with raw HTML disabled, so it cannot contain an element the
 * author wrote. test/markdown-rendering.test.js is what keeps that true.
 */

import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'

import { posts, featuredPosts } from './generated/content.js'
import { trackEvent } from './analytics'
import { BLOG_INDEX_TITLE, SITE_NAME, metaForRoute } from './content/seo.js'
import { formatPublishedDate } from './content/formatDate.js'

const BASE = import.meta.env.BASE_URL

/** A site relative asset path, honouring the Vite base the rest of the app uses. */
function asset(path) {
  return `${BASE}${String(path || '').replace(/^\//, '')}`
}

/**
 * Apply head metadata after a client side navigation.
 *
 * The prerendered file already carries all of this, which is what a crawler reads.
 * This exists so that the tab title and the canonical stay correct when a reader moves
 * between articles without a page load.
 */
function useDocumentMeta(path, context) {
  useEffect(() => {
    const meta = metaForRoute(path, context)
    document.title = meta.title
    const set = (selector, attribute, value) => {
      const node = document.head.querySelector(selector)
      if (node) node.setAttribute(attribute, value)
    }
    set('link[rel="canonical"]', 'href', meta.canonical)
    set('meta[name="description"]', 'content', meta.description)
    set('meta[property="og:title"]', 'content', meta.title)
    set('meta[property="og:description"]', 'content', meta.description)
    set('meta[property="og:url"]', 'content', meta.canonical)
    set('meta[property="og:image"]', 'content', meta.image)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, context?.post?.slug])
}

/**
 * One card. The whole card is not a link; the headline is, so a screen reader
 * announces one meaningful link per article rather than three that read the same.
 */
function ArticleCard({ post, location }) {
  return (
    <article className="blog-card">
      <Link
        to={`/blog/${post.slug}/`}
        className="blog-card-media"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => trackEvent('blog_card_click', { button_location: location, page_path: `/blog/${post.slug}/` })}
      >
        <img
          src={asset(post.heroImage)}
          alt=""
          width={post.heroImageWidth || 1200}
          height={post.heroImageHeight || 630}
          loading="lazy"
          decoding="async"
        />
      </Link>
      <div className="blog-card-body">
        <p className="blog-card-meta">
          <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
          <span aria-hidden="true"> &middot; </span>
          <span>{post.readingMinutes} min read</span>
        </p>
        <h3 className="blog-card-title">
          <Link
            to={`/blog/${post.slug}/`}
            onClick={() => trackEvent('blog_card_click', { button_location: location, page_path: `/blog/${post.slug}/` })}
          >
            {post.title}
          </Link>
        </h3>
        <p className="blog-card-excerpt">{post.excerpt}</p>
      </div>
    </article>
  )
}

/** The home page strip. Renders nothing at all when no article is featured. */
export function FeaturedArticles() {
  if (featuredPosts.length === 0) return null
  return (
    <section className="section blog-featured" id="from-the-blog" aria-labelledby="from-the-blog-heading">
      <div className="section-container">
        <h2 className="section-title" id="from-the-blog-heading">
          From the Homezai blog
        </h2>
        <p className="section-subtitle">
          What we are building, what we are learning, and what it means for your showings.
        </p>
        <div className={`blog-grid blog-grid-count-${featuredPosts.length}`}>
          {featuredPosts.map((post) => (
            <ArticleCard key={post.id} post={post} location="home_featured" />
          ))}
        </div>
        <div className="blog-featured-more">
          <Link to="/blog/" className="btn btn-outline">
            Read the blog
          </Link>
        </div>
      </div>
    </section>
  )
}

export function BlogIndexPage() {
  useDocumentMeta('/blog/', {})
  useEffect(() => {
    document.title = `${BLOG_INDEX_TITLE} | ${SITE_NAME}`
    // Structural only. GA4 already attributes the campaign and the referrer itself, so
    // nothing here needs to carry a reader's identity, and nothing does.
    trackEvent('blog_index_view', { published_count: posts.length, page_path: '/blog/' })
  }, [])

  return (
    <main className="blog-page">
      <header className="blog-hero">
        <div className="section-container">
          <h1>Homezai blog</h1>
          <p className="blog-hero-lede">
            Product news, MLS and association updates, and practical notes on running
            showings from the team building Homezai.
          </p>
        </div>
      </header>

      <div className="section-container blog-list-container">
        {posts.length === 0 ? (
          <div className="blog-empty">
            <h2>Nothing published yet</h2>
            <p>
              The first Homezai articles are on their way. In the meantime, have a look
              at what the platform does.
            </p>
            <Link to="/pricing" className="btn btn-primary">
              See plans and pricing
            </Link>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <ArticleCard key={post.id} post={post} location="blog_index" />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export function ArticlePage() {
  const { slug } = useParams()
  const post = posts.find((entry) => entry.slug === slug)

  useDocumentMeta(post ? `/blog/${post.slug}/` : '/404/', post ? { post } : {})
  useEffect(() => {
    document.title = post ? `${post.seoTitle || post.title} | ${SITE_NAME}` : `Page not found | ${SITE_NAME}`
    if (post) {
      trackEvent('blog_article_view', { slug: post.slug, page_path: `/blog/${post.slug}/` })
    } else {
      // A reader reaching an article route that has no article is worth seeing, because
      // it is what an unpublish or a slug change without a redirect looks like from the
      // outside. The slug is the article address, not anything about the reader.
      trackEvent('blog_article_missing', { slug: slug || '', page_path: `/blog/${slug || ''}/` })
    }
  }, [post, slug])

  if (!post) return <NotFoundPage />

  return (
    <main className="blog-page">
      <article className="article">
        <header className="article-header">
          <div className="article-container">
            <p className="article-eyebrow">
              <Link to="/blog/">Blog</Link>
            </p>
            <h1>{post.title}</h1>
            <p className="article-meta">
              <span>{post.author}</span>
              <span aria-hidden="true"> &middot; </span>
              <time dateTime={post.publishedAt}>{formatPublishedDate(post.publishedAt)}</time>
              <span aria-hidden="true"> &middot; </span>
              <span>{post.readingMinutes} min read</span>
            </p>
          </div>
        </header>

        <figure className="article-hero">
          <img
            src={asset(post.heroImage)}
            alt={post.heroImageAlt}
            width={post.heroImageWidth || 1600}
            height={post.heroImageHeight || 900}
            decoding="async"
          />
        </figure>

        <div className="article-container">
          <div className="article-body" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />

          {post.updatedAt && post.updatedAt !== post.publishedAt ? (
            <p className="article-updated">
              Updated <time dateTime={post.updatedAt}>{formatPublishedDate(post.updatedAt)}</time>
            </p>
          ) : null}

          <nav className="article-footer-nav" aria-label="More from the blog">
            <Link to="/blog/" className="btn btn-outline">
              Back to the blog
            </Link>
            <Link to="/contact" className="btn btn-primary">
              Schedule a demo
            </Link>
          </nav>
        </div>
      </article>
    </main>
  )
}

/**
 * A real not found page. The site used to answer an unknown deep link with a redirect
 * shim that repainted some other route; a reader saw something plausible and a crawler
 * saw HTTP 404 for a URL that was supposed to exist. Now the URLs that exist are files
 * that return 200, and this is what genuinely does not exist.
 */
export function NotFoundPage() {
  useEffect(() => {
    document.title = `Page not found | ${SITE_NAME}`
  }, [])
  return (
    <main className="blog-page">
      <div className="section-container blog-empty" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <h1>Page not found</h1>
        <p>That address does not exist on homezai.com. It may have moved, or the link may be incomplete.</p>
        <div className="article-footer-nav">
          <Link to="/" className="btn btn-primary">
            Go to the home page
          </Link>
          <Link to="/blog/" className="btn btn-outline">
            Read the blog
          </Link>
        </div>
      </div>
    </main>
  )
}
