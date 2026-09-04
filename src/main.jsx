import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

/*
 * Every route is prerendered into its own file at build time, so in production the
 * root already holds the finished page when this script runs. Hydrating that markup
 * rather than discarding it is what keeps the article visible without a flash, and it
 * is what lets a reader read the page while the bundle is still arriving.
 *
 * The dev server serves an empty root, so both paths have to exist.
 */
const container = document.getElementById('root')

const tree = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

if (container.hasChildNodes()) {
  hydrateRoot(container, tree)
} else {
  createRoot(container).render(tree)
}
