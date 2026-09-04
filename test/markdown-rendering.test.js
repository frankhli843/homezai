import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import { renderMarkdown } from '../src/content/markdown.js'

/**
 * Nina writes the body. The body is therefore untrusted input that ends up inside the
 * published HTML of homezai.com, so the renderer has to be incapable of emitting
 * active content rather than merely unlikely to.
 */

describe('approved formatting renders', () => {
  test('headings render as heading elements', () => {
    const html = renderMarkdown('## A section heading')
    assert.match(html, /<h2[^>]*>A section heading<\/h2>/)
  })

  test('a top level heading is demoted, because the page already has one h1', () => {
    const html = renderMarkdown('# Not the page title')
    assert.match(html, /<h2[^>]*>Not the page title<\/h2>/)
    assert.doesNotMatch(html, /<h1/)
  })

  test('paragraphs, bold and italic render', () => {
    const html = renderMarkdown('Plain **bold** and *italic* text.')
    assert.match(html, /<p>/)
    assert.match(html, /<strong>bold<\/strong>/)
    assert.match(html, /<em>italic<\/em>/)
  })

  test('unordered and ordered lists render', () => {
    assert.match(renderMarkdown('- one\n- two'), /<ul>[\s\S]*<li>one<\/li>/)
    assert.match(renderMarkdown('1. one\n2. two'), /<ol>[\s\S]*<li>one<\/li>/)
  })

  test('block quotes render', () => {
    assert.match(renderMarkdown('> quoted'), /<blockquote>/)
  })

  test('images render with their alt text preserved', () => {
    const html = renderMarkdown('![A routed map](/blog-media/map-a1b2c3d4.jpg)')
    assert.match(html, /<img[^>]+src="\/blog-media\/map-a1b2c3d4\.jpg"/)
    assert.match(html, /alt="A routed map"/)
  })

  test('an image without alt text still emits an alt attribute', () => {
    const html = renderMarkdown('![](/blog-media/map-a1b2c3d4.jpg)')
    assert.match(html, /alt=""/)
  })
})

describe('links are safe by construction', () => {
  test('an internal link keeps no target and no rel noise', () => {
    const html = renderMarkdown('[pricing](/pricing)')
    assert.match(html, /<a href="\/pricing">pricing<\/a>/)
  })

  test('an external link opens in a new tab with rel noopener noreferrer', () => {
    const html = renderMarkdown('[MLS](https://example.com)')
    assert.match(html, /rel="noopener noreferrer"/)
    assert.match(html, /target="_blank"/)
  })

  for (const hostile of [
    '[click](javascript:alert(1))',
    '[click](JaVaScRiPt:alert(1))',
    '[click](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '[click](vbscript:msgbox(1))',
  ]) {
    test(`a hostile link scheme is stripped: ${hostile.slice(0, 28)}`, () => {
      const html = renderMarkdown(hostile)
      assert.doesNotMatch(html, /javascript:/i)
      assert.doesNotMatch(html, /vbscript:/i)
      assert.doesNotMatch(html, /href="data:/i)
    })
  }
})

describe('active content cannot be injected', () => {
  const attacks = [
    '<script>window.__pwned = 1</script>',
    '<img src=x onerror="window.__pwned=1">',
    '<iframe src="https://evil.example"></iframe>',
    '<svg/onload=alert(1)>',
    '<a href="#" onclick="alert(1)">x</a>',
    '<object data="evil.swf"></object>',
    '<embed src="evil.swf">',
    '<style>body{display:none}</style>',
    '<form action="https://evil.example"><input name="a"></form>',
    '<math><mtext><script>alert(1)</script></mtext></math>',
  ]

  for (const attack of attacks) {
    test(`raw HTML is neutralised: ${attack.slice(0, 32)}`, () => {
      const html = renderMarkdown(`Before\n\n${attack}\n\nAfter`)
      assert.doesNotMatch(html, /<script/i)
      assert.doesNotMatch(html, /<iframe/i)
      assert.doesNotMatch(html, /<object/i)
      assert.doesNotMatch(html, /<embed/i)
      assert.doesNotMatch(html, /<style/i)
      assert.doesNotMatch(html, /<form/i)
      // No emitted element may carry an event handler attribute. The payload text
      // itself may survive as escaped copy, which is inert, so the assertion is about
      // real tags rather than about the characters appearing anywhere at all.
      assert.doesNotMatch(html, /<[a-z][a-z0-9]*[^>]*\son[a-z]+\s*=/i)
      // the surrounding copy must survive, so this is not just an empty string
      assert.match(html, /Before/)
      assert.match(html, /After/)
    })
  }

  test('an html comment cannot smuggle a conditional script', () => {
    const html = renderMarkdown('<!--[if IE]><script>alert(1)</script><![endif]-->')
    assert.doesNotMatch(html, /<script/i)
  })
})

describe('the renderer is deterministic and total', () => {
  test('the same input renders identically twice', () => {
    const input = '## H\n\nsome *text* and [a link](https://example.com)\n\n- a\n- b'
    assert.equal(renderMarkdown(input), renderMarkdown(input))
  })

  test('empty and nullish input render to an empty string rather than throwing', () => {
    assert.equal(renderMarkdown(''), '')
    assert.equal(renderMarkdown(null), '')
    assert.equal(renderMarkdown(undefined), '')
  })
})
