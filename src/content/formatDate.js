/*
 * Reader facing dates.
 *
 * Timestamps are stored as UTC instants, so they are also formatted in UTC. Formatting
 * in the reader's local zone would move the published date of an article across a day
 * boundary for anyone west of Greenwich, which makes the visible date disagree with the
 * date in the sitemap and in the structured data.
 */

/** "September 4, 2026", or an empty string for anything unparseable. */
export function formatPublishedDate(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
