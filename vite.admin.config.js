import { defineConfig } from 'vite'

/*
 * Builds the editor's article preview.
 *
 * Separate from the site build on purpose. The preview is not part of the React
 * application: it is a small module the Sveltia editor loads at /admin/preview.js,
 * and it has to be a single self contained file because the editor page is plain
 * HTML with no bundler of its own.
 *
 * The output lands in public/admin/ rather than dist/, next to the vendored editor
 * bundle and for the same reason: `vite build` copies public/ verbatim, so producing
 * it here means one build order and one copy rule instead of two. It is gitignored,
 * exactly like sveltia-cms.js, so the built artefact can never disagree with the
 * source it came from.
 */
export default defineConfig({
  // This build writes INTO public/, so it must not also try to copy public/ as static
  // assets. Left on, vite warns that the two overlap and the copy is undefined.
  publicDir: false,
  build: {
    outDir: 'public/admin',
    emptyOutDir: false,
    // The editor loads this by a fixed URL, so it may not carry a content hash.
    lib: {
      entry: 'src/admin/preview.js',
      formats: ['es'],
      fileName: () => 'preview.js',
    },
    // Sveltia's own bundle is already ~2 MB; a warning about this one is noise.
    chunkSizeWarningLimit: 2000,
  },
})
