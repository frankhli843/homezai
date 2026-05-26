// GA4 helper for Homezai landing site (G-VJ5C0CSR0B)
// This file provides lightweight wrappers around window.gtag.
// No PII is sent — only structural metadata (page paths, button locations, event categories).

const GA_ID = 'G-VJ5C0CSR0B'

/**
 * Fire a GA4 page_view event. Call this on every React Router location change.
 * @param {string} path - window.location.pathname + search
 * @param {string} [title] - page title (falls back to document.title)
 */
export function trackPageView(path, title) {
  if (typeof window.gtag !== 'function') return
  window.gtag('config', GA_ID, {
    page_path: path,
    page_title: title || document.title,
  })
}

/**
 * Fire a named GA4 event with optional parameters.
 * Never pass user-entered content (names, emails, message body, phone numbers) here.
 * @param {string} eventName - GA4 event name (snake_case recommended)
 * @param {Object} [params] - non-sensitive parameters (location, category, page_path)
 */
export function trackEvent(eventName, params) {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params || {})
}
