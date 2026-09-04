#!/usr/bin/env bash
#
# End to end proof of the publish boundary, run in CI on every change.
#
# Unit tests can be satisfied by a function that is correct in isolation while the
# pipeline around it leaks. This builds a synthetic content repository containing one
# published article and one draft, runs the real publish sync and the real build, and
# then asserts on the tree that would be uploaded to GitHub Pages.
#
# It is deliberately a negative control as well as a positive one: it fails if the
# draft appears, and it also fails if the published article does NOT appear, so a sync
# that silently produced nothing cannot pass it.

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mkdir -p "$work/content/posts" "$work/content/media"

node -e "
const sharp = require('sharp')
sharp({ create: { width: 2400, height: 1350, channels: 3, background: { r: 59, g: 108, b: 246 } } })
  .withMetadata({ exif: { IFD0: { Copyright: 'CI_METADATA_CANARY', Artist: 'CI_METADATA_CANARY' } } })
  .jpeg()
  .toFile('$work/content/media/CI Hero.jpg')
"

cat > "$work/content/posts/published.md" <<'EOF'
---
id: 0198f4aa-1111-4222-8333-444455556666
title: CI published article
slug: ci-published-article
excerpt: A synthetic published article used by the continuous integration boundary check.
status: published
author: Homezai Team
publishedAt: 2026-01-01T00:00:00.000Z
updatedAt: 2026-01-01T00:00:00.000Z
heroImage: /blog-media/ci-hero.jpg
heroImageAlt: A flat blue placeholder
featured: true
featureOrder: 1
---

## A heading

Body copy with an <script>alert('CI_XSS_CANARY')</script> injection attempt.
EOF

cat > "$work/content/posts/draft.md" <<'EOF'
---
id: 0198f4aa-9999-4888-8777-666655554444
title: CI_DRAFT_CANARY headline
slug: ci-draft-canary
excerpt: CI_DRAFT_CANARY summary.
status: draft
author: Homezai Team
updatedAt: 2026-01-01T00:00:00.000Z
---

CI_DRAFT_CANARY body.
EOF

cd "$here"

# Keep whatever content is really committed, and restore it afterwards.
backup="$(mktemp -d)"
cp -a content/posts "$backup/posts"
cp -a public/blog-media "$backup/blog-media"
restore() {
  rm -rf content/posts public/blog-media
  cp -a "$backup/posts" content/posts
  cp -a "$backup/blog-media" public/blog-media
  rm -rf "$backup"
}
trap 'restore; rm -rf "$work"' EXIT

node scripts/publish-sync.mjs --content "$work"
npm run build
node scripts/verify-build.mjs

fail=0
note() { echo "  $1"; }

# The published article must exist as a real file with real metadata.
article="dist/blog/ci-published-article/index.html"
if [ ! -s "$article" ]; then
  note "FAIL: the published article produced no page, so every check below would pass vacuously"
  fail=1
else
  grep -q '<link rel="canonical" href="https://homezai.com/blog/ci-published-article/">' "$article" ||
    { note "FAIL: no canonical in the article bytes"; fail=1; }
  grep -q '<meta property="og:image" content="https://homezai.com/blog-media/ci-hero.jpg">' "$article" ||
    { note "FAIL: no absolute og:image in the article bytes"; fail=1; }
  grep -q '<h2>A heading</h2>' "$article" ||
    { note "FAIL: the body was not prerendered into the page"; fail=1; }
fi

# The draft must be nowhere at all.
if grep -rq 'CI_DRAFT_CANARY' dist/ content/posts/ 2>/dev/null; then
  note "FAIL: draft content reached the public tree"
  grep -rl 'CI_DRAFT_CANARY' dist/ content/posts/ 2>/dev/null | sed 's/^/    /'
  fail=1
fi

# The injection must have been neutralised into text, not executed markup.
if grep -q "<script>alert('CI_XSS_CANARY')" "$article" 2>/dev/null; then
  note "FAIL: an author written script tag survived into the published page"
  fail=1
fi
grep -q "&lt;script&gt;alert" "$article" 2>/dev/null ||
  { note "FAIL: the injection is not present as escaped text either, so this check proved nothing"; fail=1; }

# The image must have lost its embedded metadata on the way out.
if grep -aq 'CI_METADATA_CANARY' public/blog-media/ci-hero.jpg 2>/dev/null; then
  note "FAIL: embedded image metadata was published"
  fail=1
fi
node -e "
const sharp = require('sharp')
sharp('public/blog-media/ci-hero.jpg').metadata().then((m) => {
  if (m.exif) { console.log('  FAIL: the published image still carries an EXIF block'); process.exit(1) }
  if (m.width !== 1600) { console.log('  FAIL: the published image was not resized, width is ' + m.width); process.exit(1) }
})
" || fail=1

if [ "$fail" -ne 0 ]; then
  echo "publish boundary check FAILED"
  exit 1
fi

echo "publish boundary check ok: published article rendered with metadata, draft withheld, injection escaped, image stripped and resized"
