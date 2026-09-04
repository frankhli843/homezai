/*
 * Article body rendering.
 *
 * The body is written by a person in the CMS, so it is untrusted input that ends up
 * inside the published HTML of homezai.com. The defence is not a filter that tries to
 * spot bad HTML; it is a renderer that has no way to emit HTML the author wrote.
 * markdown-it runs with html disabled, so every angle bracket in the source is escaped
 * on the way out and a script tag is simply text.
 *
 * Two things are handled on top of that:
 *
 *  - Hostile URL schemes. markdown-it already refuses to build a link for one, but it
 *    then falls back to printing the raw source, which puts the literal string
 *    "javascript:alert(1)" on the page. That is inert but it is also visible rubbish,
 *    so those targets are neutralised before parsing.
 *  - Heading level. The article template already renders the title as the page h1, so
 *    an author writing a top level heading would produce a second one. It is demoted.
 *
 * The typographer is deliberately off. It would rewrite plain hyphens into en and em
 * dashes, which this repository does not want in published copy.
 */

import MarkdownIt from 'markdown-it'

/** Schemes that may never appear as a link or image target. */
const HOSTILE_SCHEMES = 'javascript|vbscript|data|file|blob'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
})

/** Demote a top level heading to h2 so the article keeps exactly one h1. */
md.core.ruler.push('demote_h1', (state) => {
  for (const token of state.tokens) {
    if (token.type === 'heading_open' && token.tag === 'h1') token.tag = 'h2'
    else if (token.type === 'heading_close' && token.tag === 'h1') token.tag = 'h2'
  }
})

const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

/**
 * Anything that leaves the site opens in a new tab and cannot reach back through
 * window.opener. An in-site link is left exactly as written.
 */
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || ''
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet('target', '_blank')
    tokens[idx].attrSet('rel', 'noopener noreferrer')
  }
  return defaultLinkOpen(tokens, idx, options, env, self)
}

/**
 * Replace hostile link and image targets before the parser ever sees them, so neither
 * a working link nor the raw text of one survives into the output.
 */
function neutraliseHostileTargets(source) {
  return source
    .replace(new RegExp(String.raw`\]\(\s*(?:${HOSTILE_SCHEMES})\s*:[^)]*\)`, 'gi'), '](#)')
    .replace(new RegExp(String.raw`<\s*(?:${HOSTILE_SCHEMES})\s*:[^>]*>`, 'gi'), '')
}

/**
 * Render an article body to safe HTML.
 *
 * Total by construction: nullish and empty input render to an empty string rather than
 * throwing, because a draft with no body yet is an ordinary state.
 */
export function renderMarkdown(source) {
  if (typeof source !== 'string' || source.length === 0) return ''
  return md.render(neutraliseHostileTargets(source)).trim()
}

/**
 * Plain text of a body, used for reading time and for a fallback excerpt. It renders
 * first and strips tags afterwards so that escaped source cannot be mistaken for markup.
 */
export function markdownToPlainText(source) {
  return renderMarkdown(source)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Whole minutes at 200 words per minute, never less than one. */
export function readingTimeMinutes(source) {
  const words = markdownToPlainText(source).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
