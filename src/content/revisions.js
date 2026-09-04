/*
 * Revision history.
 *
 * Sveltia CMS has no history screen, so this is the piece the architecture decision
 * said would have to be supplied. It is a thin read over what git already records: the
 * editor commits every save to the private content repository, so a post's history is
 * literally the commit list for its file, and restoring a version is writing an old
 * blob back as a new commit.
 *
 * Nothing here widens access. Every request carries the publisher's own token, so a
 * person who cannot read the content repository cannot read its history either, and a
 * person who can read but not write gets 403 on a restore. GitHub stays the authority.
 *
 * The module is pure: it builds requests and interprets responses. The page supplies
 * fetch. That keeps the interesting behaviour testable without a network.
 */

const API_ROOT = 'https://api.github.com'

/** The file that holds one article. */
export function postPath(slug) {
  return `content/posts/${slug}.md`
}

/** Commits that touched one article, newest first. */
export function historyRequest({ repo, branch = 'main', slug, perPage = 20 }) {
  const params = new URLSearchParams({
    path: postPath(slug),
    sha: branch,
    per_page: String(perPage),
  })
  return { url: `${API_ROOT}/repos/${repo}/commits?${params}`, method: 'GET' }
}

/** The article file as it stood at one commit. */
export function versionRequest({ repo, slug, ref }) {
  const params = new URLSearchParams({ ref })
  return {
    url: `${API_ROOT}/repos/${repo}/contents/${encodeURIComponent(postPath(slug))}?${params}`,
    method: 'GET',
  }
}

/** Write a previous version back as a new commit, which is what restore means in git. */
export function restoreRequest({ repo, branch = 'main', slug, contentsBase64, currentSha, shortRef }) {
  return {
    url: `${API_ROOT}/repos/${repo}/contents/${encodeURIComponent(postPath(slug))}`,
    method: 'PUT',
    body: {
      message: `Restore article "${slug}" to the version from ${shortRef}`,
      content: contentsBase64,
      sha: currentSha,
      branch,
    },
  }
}

/**
 * Reduce the GitHub commit payload to what a publisher needs to see.
 *
 * Deliberately does not surface the committer's email address. The history screen is
 * for choosing a version, not for publishing anyone's contact details into a browser.
 */
export function summariseCommits(payload) {
  if (!Array.isArray(payload)) return []
  return payload.map((entry) => ({
    ref: entry.sha,
    shortRef: String(entry.sha || '').slice(0, 7),
    when: entry.commit?.committer?.date || entry.commit?.author?.date || null,
    who: entry.commit?.author?.name || 'unknown',
    message: entry.commit?.message || '',
  }))
}

/**
 * Turn a failed request into something an operator can act on. The point is that a
 * permission problem, a missing article and a rate limit must not all read as "it did
 * not work".
 */
export function describeFailure(status, body) {
  if (status === 401) {
    return {
      code: 'not_signed_in',
      message: 'Your sign in has expired. Open the editor, sign in again, then come back.',
    }
  }
  if (status === 403 && /rate limit/i.test(String(body?.message || ''))) {
    return { code: 'rate_limited', message: 'GitHub is rate limiting this token. Wait a few minutes.' }
  }
  if (status === 403) {
    return {
      code: 'not_permitted',
      message: 'That account can read this article but is not allowed to change it.',
    }
  }
  if (status === 404) {
    return {
      code: 'not_found',
      message:
        'No such article, or this account has no access to the content repository. Those two cases are deliberately indistinguishable.',
    }
  }
  if (status === 409) {
    return { code: 'conflict', message: 'Somebody else changed this article. Reload and try again.' }
  }
  return { code: 'unexpected', message: `GitHub returned ${status}.` }
}
