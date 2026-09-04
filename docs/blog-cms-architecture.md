# Homezai blog and media CMS: architecture decision

Status: accepted, 2026-09-04.
Scope: the public marketing site `homezai.com` only. This is not `app.homezai.com`,
which is a separate product in a separate repository.

## The problem being solved

Nina has roughly thirty days of social content queued and no way to put any of it on
the business site. Today she sends a change to Frank and Frank edits React source by
hand. Frank is the bottleneck. The fix has to let Nina write, illustrate, preview,
publish, revise and unpublish an article herself, and it has to produce a real URL
that a social crawler can read, because the whole point of the request was that
Homezai's social posts should link back to the site and pull the tagged image.

## Constraints measured from the real stack, not assumed

Everything below was probed on 2026-09-04 rather than taken from documentation.

| Constraint | Evidence |
| --- | --- |
| Host is GitHub Pages, static only | `GET /repos/frankhli843/homezai_landing_page/pages` returns `build_type: workflow`, `cname: homezai.com`, `https_enforced: true` |
| The site repository is public | `GET /repos/frankhli843/homezai_landing_page` returns `"private": false` |
| No server, no database, no session layer exists | the entire application is `src/App.jsx`, a client-rendered Vite build; `deploy.yml` uploads `dist` to Pages |
| Deep routes return HTTP 404 on first byte | `curl` on `/pricing`, `/integrations`, `/blog` all returned `404` with the 992 byte `public/404.html` SPA shim |
| There is no sitemap and no robots file | `curl /sitemap.xml` and `curl /robots.txt` both returned `404` |
| A directory index does return 200 | control probe on another Pages site: `/versions` returned `301` to `/versions/`, which returned `200` |
| The app can be rendered in Node | every `window` and `document` reference in `App.jsx` is inside an event handler or an effect; the one module-scope read is already guarded with `typeof document === 'undefined'` |

Two of those decide the architecture. Because the host is a static file server, a
publish action must end in a rebuild; nothing can be resolved per request. Because a
directory index returns 200, the first-byte 404 is fixable by emitting one HTML file
per route instead of by changing hosts.

## Options compared

### A. Hosted headless CMS (Sanity, Storyblok, Contentful)

Rejected on the free tier for security reasons, not for taste.

Sanity's free plan has no private datasets, so everything is readable by API key, and
it has no custom roles or RBAC. That fails two acceptance requirements outright:
drafts must not appear in unauthenticated API responses, and the publisher role must
be narrowly scoped. Storyblok's free plan includes one seat and no custom roles, so
Nina and Frank cannot both hold accounts and the role cannot be narrowed. Paid tiers
would clear both bars, but they add a recurring bill and a vendor dependency to a
marketing blog that publishes a few articles a week, and the content would then live
in a system Homezai does not own.

The shape of the work does not shrink either. Because the host is static, a hosted CMS
still needs a webhook into a rebuild, so the prerender pipeline described below would
have to be built regardless. The vendor buys an editor and costs a content store.

### B. First-party CMS service

Rejected. It requires a server, a database, a session layer, an upload service and an
authorization model, none of which exist today. The acceptance criteria explicitly
warn against building a large custom CMS when a smaller secure option works, and
every one of those components is a new thing to secure and operate.

### C. Repository-backed editorial workflow (selected)

Sveltia CMS, an MIT-licensed browser CMS that is configuration-compatible with Decap
CMS, served as a static page at `homezai.com/admin/`, reading and writing a separate
**private** GitHub repository that holds the content.

Why this wins on the axes that were compared:

- **Permissions are backend-enforced by GitHub.** The `/admin/` page is inert static
  HTML with no secrets in it. Every read and write goes to `api.github.com` carrying
  the signed-in user's own credential, and GitHub decides. A person without access to
  the content repository gets 404 from the API, so they cannot list drafts, read
  bodies, browse the media folder or read history. There is nothing to hide in the
  React layer because the React layer was never the boundary.
- **Least privilege is genuinely available.** The publisher credential is a
  fine-grained personal access token scoped to the single content repository with
  Contents read and write. It cannot touch the site source, cannot deploy code and
  cannot reach any other repository. This is narrower than the OAuth path, which asks
  GitHub for the classic `repo` scope across everything the user can reach.
- **Drafts are private by construction.** They live only in the private content
  repository. The publish step copies published posts out; a draft is never copied,
  so it cannot leak into the public repository, the build, the sitemap or an API
  response. There is no preview token to enumerate because preview happens inside the
  authenticated editor rather than on a public URL.
- **Revision history and backup are free and real.** Every save is a git commit with
  an author and a timestamp. Export is `git clone`. There is no lock-in and no
  proprietary format: the content is markdown and images on disk.
- **Cost is zero** and there is no new vendor account, no new bill and nothing new to
  operate beyond one scheduled GitHub Actions workflow.

Honest limitations of the choice, carried into the summary rather than hidden:

- Sveltia CMS has no built-in revision history screen, so this task ships a read-only
  revision view of its own that reads the git history of a post through the GitHub API
  and can restore a previous version.
- Sign-in uses a personal access token that Frank issues once. It is a one-time paste
  for Nina rather than a password prompt, and fine-grained tokens expire, so Frank
  reissues it at most once a year. Upgrading to a full OAuth sign-in later is a single
  `base_url` line in the CMS config plus a small hosted auth relay; no content moves
  and nothing else changes.
- Sveltia CMS is a small project with a single principal maintainer. That risk is
  bounded because its configuration file is Decap CMS compatible, so the editor can be
  swapped for Decap without touching the content, the repositories or the site.
- Scheduled publishing is **not** supported in this version. Publishing is immediate.
  The editor therefore offers no schedule control and the UI never implies one exists.

## The selected design

```
  Nina's browser
        |
        |  homezai.com/admin/   (static Sveltia CMS, no secrets)
        |  fine-grained PAT, Contents RW on the content repo only
        v
  frankhli843/homezai-content            PRIVATE
    content/posts/<slug>.md              drafts and published, full git history
    content/media/<file>                 uploads as supplied
        |
        |  push -> publish workflow
        |  checks out the site repo, runs its tested scripts/publish-sync.mjs
        |  copies ONLY status: published, validates and cleans media
        v
  frankhli843/homezai_landing_page       PUBLIC
    content/posts/<slug>.md              published only
    public/blog-media/<file>             validated, metadata-stripped, resized
        |
        |  push to main -> existing deploy.yml
        |  build-content -> vite build -> vite build --ssr -> prerender
        v
  GitHub Pages
    /blog/index.html            HTTP 200, real HTML, real head metadata
    /blog/<slug>/index.html     HTTP 200, canonical, Open Graph, Twitter, JSON-LD
    /sitemap.xml  /robots.txt
```

Publish latency is one build, about a minute, and it is visible: the workflow either
goes green or fails loudly.

## Content model

One markdown file per post, frontmatter plus body.

| Field | Rule |
| --- | --- |
| `id` | stable UUID, minted once at creation, never changes, survives a slug change |
| `slug` | URL segment, lowercase kebab, unique; a collision is rejected at sync with a named error |
| `title` | required, used for the document title when `seoTitle` is absent |
| `excerpt` | required, used on cards and as the fallback meta description |
| `body` | markdown; rendered with raw HTML disabled, so a script tag cannot be injected |
| `heroImage` | required for a published post; must resolve to a local `blog-media` asset |
| `heroImageAlt` | required unless `heroImageDecorative` is true |
| `author` | byline, from a fixed list |
| `status` | `draft` or `published`; only `published` leaves the private repository |
| `publishedAt` | set on first publish, never rewritten by a later edit |
| `updatedAt` | set on every save |
| `seoTitle`, `seoDescription` | optional overrides |
| `tags` | optional, drives nothing structural in this version |
| `featured` | boolean, homepage feature selection |
| `featureOrder` | integer, deterministic homepage ordering, ties broken by `publishedAt` |
| `previousSlugs` | appended automatically when a slug changes, so old URLs keep working |

Lifecycle rules:

- **Slug collision.** Two posts may not share a slug, and a slug may not collide with
  any `previousSlugs` entry or with an existing site route. The sync fails with the
  offending file named.
- **Slug change.** The old slug is appended to `previousSlugs` and the build emits a
  redirect page at the old URL pointing at the new canonical one.
- **Unpublish.** Setting `status` back to `draft` removes the file from the public
  repository, the blog index, the homepage, the sitemap and the build. The URL then
  returns the site's real 404 page.
- **Delete.** Deleting in the editor removes the file from the private repository. The
  git history retains it, which is the archival path.
- **Image replacement.** Media is content-addressed by a hash suffix, so replacing an
  image writes a new file rather than mutating the old one. An older article and an
  already-scraped social card keep resolving.
- **Preview.** Inside the authenticated editor only. There is no public preview URL and
  no preview token.
