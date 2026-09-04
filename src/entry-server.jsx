/*
 * Build time rendering entry point.
 *
 * The site is hosted on GitHub Pages, which is a plain file server: a URL exists only
 * if a file exists at it. That is why every deep route answered HTTP 404 on the first
 * byte. This module lets scripts/prerender.mjs render each route to real markup in
 * Node so the build can write one file per route, and the host can answer 200 with the
 * article already in the response instead of an empty shell plus a promise.
 *
 * It runs in Node, so nothing here may touch window or document. The application
 * already satisfies that: every browser API it uses sits inside an event handler or an
 * effect, neither of which runs during renderToString.
 */

import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'

import App from './App.jsx'
import './index.css'

/**
 * Render one route to HTML.
 *
 * @param {string} url canonical path, for example /blog/how-homezai-routes-a-showing/
 * @returns {{html: string}} markup for the application root
 */
export function render(url) {
  const html = renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  )
  return { html }
}
