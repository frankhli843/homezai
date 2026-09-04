import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { SITE_ORIGIN, metaForRoute, renderHead } from '../src/content/seo.js'

/**
 * A social crawler does not run the application. Everything asserted here has to be
 * present in the bytes of the first response, so these tests operate on the string the
 * prerenderer writes into the head, not on anything React does after mount.
 */

const article = {
  id: '00000000-0000-4000-8000-000000000001',
  slug: 'how-homezai-routes-a-showing',
  title: 'How Homezai routes a showing',
  excerpt: 'A short summary used on cards and as the fallback description.',
  author: 'Homezai Team',
  publishedAt: '2026-09-04T12:00:00.000Z',
  updatedAt: '2026-09-05T09:30:00.000Z',
  heroImage: '/blog-media/showing-route-a1b2c3d4.jpg',
  heroImageAlt: 'A map showing a routed sequence of property visits',
  heroImageWidth: 1200,
  heroImageHeight: 630,
  bodyHtml: '<p>Body.</p>',
}

describe('the site origin is the business domain over https', () => {
  test('origin is exactly the production domain', () => {
    assert.equal(SITE_ORIGIN, 'https://homezai.com')
  })
})

describe('article metadata', () => {
  const meta = metaForRoute('/blog/how-homezai-routes-a-showing/', { post: article })

  test('the document title is informative and is not the generic site title', () => {
    assert.equal(meta.title, 'How Homezai routes a showing | Homezai')
  })

  test('the description comes from the excerpt', () => {
    assert.equal(meta.description, article.excerpt)
  })

  test('the canonical url is absolute, https, on the business domain and ends with a slash', () => {
    assert.equal(meta.canonical, 'https://homezai.com/blog/how-homezai-routes-a-showing/')
  })

  test('the social image is an absolute url, not a site relative path', () => {
    assert.equal(meta.image, 'https://homezai.com/blog-media/showing-route-a1b2c3d4.jpg')
  })

  test('open graph type is article and carries the publish and update times', () => {
    assert.equal(meta.ogType, 'article')
    assert.equal(meta.publishedTime, '2026-09-04T12:00:00.000Z')
    assert.equal(meta.modifiedTime, '2026-09-05T09:30:00.000Z')
  })

  test('the twitter card is the large image variant', () => {
    assert.equal(meta.twitterCard, 'summary_large_image')
  })

  test('the article is indexable', () => {
    assert.equal(meta.robots, 'index, follow')
  })

  test('a seo title override wins over the display title', () => {
    const m = metaForRoute('/blog/x/', { post: { ...article, slug: 'x', seoTitle: 'Custom SEO title' } })
    assert.equal(m.title, 'Custom SEO title | Homezai')
  })

  test('a seo description override wins over the excerpt', () => {
    const m = metaForRoute('/blog/x/', { post: { ...article, slug: 'x', seoDescription: 'Custom description.' } })
    assert.equal(m.description, 'Custom description.')
  })
})

describe('index and static route metadata', () => {
  test('the blog index has its own title, description and canonical', () => {
    const meta = metaForRoute('/blog/', {})
    assert.match(meta.title, /Blog/)
    assert.ok(meta.description.length > 20)
    assert.equal(meta.canonical, 'https://homezai.com/blog/')
    assert.equal(meta.ogType, 'website')
  })

  test('the home route canonicalises to the bare origin with a trailing slash', () => {
    assert.equal(metaForRoute('/', {}).canonical, 'https://homezai.com/')
  })

  test('every existing static route still resolves to a title and a canonical', () => {
    for (const route of ['/', '/pricing/', '/integrations/', '/contact/', '/terms/', '/privacy/', '/accessibility/', '/dpa/']) {
      const meta = metaForRoute(route, {})
      assert.ok(meta.title, `no title for ${route}`)
      assert.equal(meta.canonical, `https://homezai.com${route}`)
    }
  })

  test('the not found route is explicitly not indexed', () => {
    assert.equal(metaForRoute('/404/', {}).robots, 'noindex, follow')
  })

  test('the admin route is explicitly not indexed', () => {
    assert.equal(metaForRoute('/admin/', {}).robots, 'noindex, nofollow')
  })
})

describe('renderHead emits the tags a crawler reads', () => {
  const html = renderHead(metaForRoute('/blog/how-homezai-routes-a-showing/', { post: article }))

  const required = [
    /<title>How Homezai routes a showing \| Homezai<\/title>/,
    /<meta name="description" content="[^"]+">/,
    /<link rel="canonical" href="https:\/\/homezai\.com\/blog\/how-homezai-routes-a-showing\/">/,
    /<meta property="og:type" content="article">/,
    /<meta property="og:title" content="[^"]+">/,
    /<meta property="og:description" content="[^"]+">/,
    /<meta property="og:url" content="https:\/\/homezai\.com\/blog\/how-homezai-routes-a-showing\/">/,
    /<meta property="og:image" content="https:\/\/homezai\.com\/blog-media\/showing-route-a1b2c3d4\.jpg">/,
    /<meta property="og:image:alt" content="[^"]+">/,
    /<meta property="og:image:width" content="1200">/,
    /<meta property="og:image:height" content="630">/,
    /<meta property="og:site_name" content="Homezai">/,
    /<meta name="twitter:card" content="summary_large_image">/,
    /<meta name="twitter:title" content="[^"]+">/,
    /<meta name="twitter:description" content="[^"]+">/,
    /<meta name="twitter:image" content="https:\/\/homezai\.com\/blog-media\/[^"]+">/,
    /<meta name="robots" content="index, follow">/,
  ]

  for (const pattern of required) {
    test(`head contains ${pattern}`, () => {
      assert.match(html, pattern)
    })
  }

  test('the head carries BlogPosting structured data with the absolute image', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    assert.ok(match, 'no ld+json block emitted')
    const data = JSON.parse(match[1])
    assert.equal(data['@type'], 'BlogPosting')
    assert.equal(data.headline, 'How Homezai routes a showing')
    assert.equal(data.image, 'https://homezai.com/blog-media/showing-route-a1b2c3d4.jpg')
    assert.equal(data.mainEntityOfPage, 'https://homezai.com/blog/how-homezai-routes-a-showing/')
  })
})

describe('metadata cannot break out of an attribute', () => {
  test('a quote in a title is escaped rather than closing the attribute', () => {
    const html = renderHead(
      metaForRoute('/blog/x/', {
        post: { ...article, slug: 'x', title: 'She said "hello" & <b>left</b>' },
      }),
    )
    assert.doesNotMatch(html, /content="[^"]*"[^">]*>[^<]*<b>/)
    assert.match(html, /&quot;hello&quot;/)
    assert.match(html, /&amp;/)
    assert.doesNotMatch(html, /<b>left<\/b>/)
  })

  test('a script close tag inside structured data cannot terminate the script block', () => {
    const html = renderHead(
      metaForRoute('/blog/x/', {
        post: { ...article, slug: 'x', title: 'break</script><script>alert(1)</script>' },
      }),
    )
    const blocks = html.match(/<script/g) || []
    assert.equal(blocks.length, 1, 'exactly one script element may exist in the head')
  })
})
