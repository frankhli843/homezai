# Homezai Admin SSO for the blog editor: architecture decision

Status: accepted, 2026-09-05.
Supersedes the sign-in half of `docs/blog-cms-architecture.md`. Everything that
document says about content storage, drafts, the publish workflow and the static
site still holds. Only the answer to "who is allowed in, and how" changes.

## What is wrong with the thing that shipped

Task 11 shipped a working CMS whose authorization boundary is GitHub. That was the
right call at the time and it is genuinely secure: `/admin/` is inert static HTML,
every read and write carries the signed-in publisher's own fine-grained token, and a
person without repository access gets 404 from the API and can enumerate nothing.

It has one defect, and it is a people defect rather than a security defect. To let
Nina publish, Frank has to issue her a fine-grained personal access token through the
GitHub web interface, she has to paste it into a form, and he has to reissue it when
it expires. A new Homezai administrator therefore needs a GitHub onboarding step that
has nothing to do with Homezai, and an administrator who leaves Homezai keeps a
working credential until somebody remembers to revoke it in a second system.

Frank's ask on 2026-09-05 was: can the blog use the Homezai sign-in the person
already has.

## What was measured before anything was designed

Probed 2026-09-05 against production, not read from documentation.

| Fact | Evidence |
| --- | --- |
| The editor is live and still token-based | `GET https://homezai.com/admin/` 200, and `GET /admin/config.yml` 200 returns a `backend:` block with `name: github` and no `api_root` and no `base_url`, so the browser talks straight to `api.github.com` |
| The site is static on GitHub Pages | `.github/workflows/deploy.yml` uploads `dist` via `actions/deploy-pages` |
| The content repository is private | `GET /repos/frankhli843/homezai-content` returns `"private": true`, `default_branch: main` |
| The Homezai app is a separate product on separate infrastructure | frontend on Vercel at `https://app.homezai.com`, backend on ECS behind `https://api.dev.homezyai.com` |
| That backend answers cross-origin already | `GET https://api.dev.homezyai.com/api/v1/agent/support` returns `401` with `access-control-allow-origin: *`, so it is bearer-authenticated and not cookie-authenticated |
| `homezai.com` and `app.homezai.com` are the same site | they share the registrable domain, so a credentialed request from the editor to the app is same-site and the existing session cookie is sent |
| `api.dev.homezyai.com` is a *different* site | `homezyai` is not `homezai`, so no Homezai cookie can ever reach the API host, and any design that assumed one would have failed in the browser |
| The canonical Homezai Admin rule already exists | `BrokerageIdentityService.is_homezai_admin` requires `isAdmin` **and** a login email on the Homezai domain or the documented Frank operator exception |
| The editor can be pointed somewhere other than GitHub | the deployed `sveltia-cms.js` accepts `api_root`, `graphql_api_root`, `base_url`, `auth_endpoint`, `auth_methods` and `include_credentials` on its GitHub backend |
| A genuinely custom editor backend is not possible | `registerBackend` is on the editor's own not-implemented list |
| The paste-a-token screen can be removed outright | `auth_methods` is an enum of `oauth` and `token`; `['oauth']` is valid and an empty list is a config error |

The last three decide the shape of the answer. The editor cannot be taught a new
backend, but its existing GitHub backend can be pointed at a different host, and its
sign-in can be reduced to a single authorization-relay method.

## What the constraint actually is

GitHub Pages is a file server. Nothing served from `homezai.com` can hold a secret,
mint a session, or decide anything. Two things follow and neither is negotiable:

* A check in the browser that the current user looks like a Homezai administrator is
  not authorization. It is a rendering decision. Any design whose access decision is
  reached in JavaScript is rejected here by name.
* Being signed into Homezai does not give a person permission to commit to a private
  GitHub repository. Homezai identity and GitHub identity are unrelated. Something on
  a server has to hold a repository credential and decide, per request, whether the
  Homezai caller may use it.

## Options compared

### A. Move the editor inside the Homezai application and write a new one

Put a first-party editor at `app.homezai.com/agent/admin/blog`, behind the session
and the Homezai Admin gate that the operations surface already uses, and give it a
content API on the existing Flask backend.

Rejected, on size rather than on security. The security story is excellent: same
origin as the session, canonical predicate in process, nothing new about identity.
But "the editor" is not a page. Task 11 ships a markdown editor, a media library with
client-side image transformation, an asset picker, a field-validating form for
seventeen fields, a live preview pane wired to the site's own renderer and stylesheet,
a revision browser and a restore path. Rebuilding those inside MUI is weeks of work
whose only product is a worse version of something that already exists and is already
tested. The acceptance asks for the simplest sufficient architecture, and an option
that discards a working, tested editor to rewrite it is not that.

It also breaks preview. The preview pane is built from the site's own renderer and
`App.css`; moving the editor into the other repository means either duplicating the
renderer or shipping a cross-repository build. Both are worse than leaving it alone.

### B. Standards-based OAuth or OpenID Connect between Homezai and a separately hosted editor backend

Stand up a real authorization server in Homezai, register the editor as a client, run
an authorization code flow with PKCE, and have a separately hosted editor backend
consume the resulting identity.

Rejected as disproportionate. Homezai does not have an authorization server today and
this task would have to build one: client registry, consent, discovery document,
signing keys and their rotation, token introspection or JWKS verification, and the
whole of it operated forever for exactly one relying party that Homezai also owns.
The acceptance says in as many words to avoid creating a full identity provider when
the existing session and backend can meet the requirement with a smaller integration.
They can. Every security property this option would buy is available in option C
without a new identity system, because the two parties are not independent: the same
organisation controls both, and the relying party can simply ask the identity holder a
question rather than being issued a federated assertion about it.

There is one honest thing option B has that option C does not: a general mechanism
for a *third* relying party later. If Homezai ever needs to federate identity to
something it does not own, this becomes the right answer. It is not the right answer
for one first-party editor.

### C. Broker the repository through the Homezai backend and relay the sign-in (selected)

Three small pieces, none of which is a new system:

1. **The editor stops talking to GitHub.** `api_root` and `graphql_api_root` in
   `config.yml` point at a first-party broker on the Homezai backend. Every read and
   write the editor performs now arrives at Homezai infrastructure.
2. **The broker is the authorization boundary.** It authenticates the caller by a
   short-lived opaque editor token it minted itself, resolves that to a Homezai user
   id, and re-evaluates `BrokerageIdentityService.is_homezai_admin` on **every**
   request before forwarding anything. Only then does it call GitHub, using a
   server-held credential scoped to the single private content repository, which the
   browser never sees and which can be rotated without shipping a frontend.
3. **Sign-in becomes a relay, not a token prompt.** `auth_methods: ['oauth']` deletes
   the paste-a-token screen. The one remaining method opens a popup at
   `app.homezai.com`, which is the origin that holds the Homezai session. That
   endpoint reads the session server-side, sends a signed-out person through the real
   Homezai sign-in, asks the canonical backend to mint an editor session, and returns
   it over the editor's documented `postMessage` contract to an allow-listed origin.

Why this wins on the axes that were compared:

- **Security.** The access decision is a server-side call to the same predicate the
  Homezai operations surface uses, evaluated per request rather than once per session,
  so it cannot go stale. The browser holds no GitHub credential of any kind, and the
  thing it does hold is opaque, short-lived, useless anywhere except the broker, and
  revocable. Nothing in the editor's JavaScript decides anything.
- **Implementation size.** The editor, its preview, its media pipeline, its revision
  view, the content repository, the publish workflow and the public site are all
  untouched. The change is one configuration block, one gate script, one Flask
  blueprint and one route handler on the app.
- **Repository permissions.** Narrower than today, not wider: one service identity
  scoped to one repository replaces one personal token per publisher.
- **Revocation speed.** Losing Homezai Admin status stops the next request, because
  the predicate runs on the next request. There is no second system to remember.
- **Auditability.** Every mint, denial, read, write and repository failure is an event
  on the Homezai backend with a correlation id and an actor user id, in the same logs
  operators already read. Today there are no Homezai-side events at all, because the
  browser talks to GitHub directly and Homezai never sees it.
- **Editor compatibility, preview, publishing latency, backup and export.** All
  unchanged by construction. Content is still markdown and images in git, export is
  still `git clone`, publish is still the existing workflow, and preview is still the
  site's own renderer.
- **Hosting cost.** Zero. No new service, no new vendor, no new bill.

Honest limitations, carried into the summary rather than hidden:

- **Commit attribution moves to the service identity.** GitHub will record the commit
  as the service identity rather than as Nina, because Nina no longer has a GitHub
  identity in this system, which is the entire point. The broker therefore stamps the
  acting Homezai user id into the commit message, and the audit log is the primary
  record. Git history remains a complete and ordered revision history; it is the
  *author* field that is now a robot.
- **The editor depends on an undocumented-but-schema-declared configuration surface.**
  `api_root` and `graphql_api_root` are in the editor's own published config schema,
  so they are supported rather than a hack, but the editor is a small project. The
  version is pinned in `package-lock.json` and a test asserts the deployed bundle
  still declares those properties, so an upgrade that removed them would fail CI
  rather than fail Nina.
- **The broker forwards GraphQL it does not fully parse.** The boundary that makes
  that safe is the credential, not the parser: the service identity can reach exactly
  one repository, so a request the broker failed to understand still cannot touch
  anything else. Path allow-listing on the REST side is defence in depth on top of
  that, not the boundary itself.
- **Two deployments must move together.** The editor configuration and the broker are
  a compatible pair. The rollout order is backend first, then the static site, so the
  editor never points at an endpoint that does not exist yet.

## Rejected outright, by name

* Any check in the editor's JavaScript that the current user has a Homezai email, a
  Homezai role, or an `isAdmin` flag. That is rendering, not authorization.
* A shared GitHub token embedded in the editor bundle or served to the browser.
* Returning any long-lived repository credential to the browser under any name.
* Trusting a browser-supplied assertion about who the user is.
* Hiding `/admin/` and calling it access control.
* Keeping the fine-grained token flow behind a Homezai-branded screen. An SSO screen
  that still requires the person to hold GitHub permission does not solve the problem
  that was reported.

## The selected design

```
  A Homezai administrator's browser
        |
        |  1. homezai.com/admin/            static, inert, holds no secret
        |     auth_methods: [oauth] only, so there is no token to paste
        v
  2. popup: app.homezai.com/api/blog-editor/authorize
        |     reads the existing Homezai session server-side
        |     signed out -> the real Homezai sign-in, then back here
        v
  3. api.dev.homezyai.com  POST /api/v1/blog-editor/session
        |     is_homezai_admin(user) or refuse with a denial category
        |     mints a short-lived opaque editor token, hashed at rest
        |     -> postMessage back to the allow-listed editor origin only
        v
  4. editor reads and writes through
     api.dev.homezyai.com/api/v1/blog-editor/gh/...
        |     every request: resolve token -> user -> re-run the predicate
        |     then forward to api.github.com with the SERVER-held credential
        v
  frankhli843/homezai-content            PRIVATE, unchanged
        |     publish workflow, publish-sync, Pages deploy: all unchanged
        v
  homezai.com/blog/                      unchanged
```

The public blog, the content repository, the draft boundary, the publish workflow and
the static hosting model are all exactly what Task 11 shipped. This document changes
who is let in and how, and nothing else.

## Threat model

Written against the design above rather than against a checklist, and each row
names where the defence lives, because a defence nobody can point at is a
defence nobody can check.

### Identity and authorization

| Threat | Why it fails |
| --- | --- |
| Somebody edits a copy of `/admin/` to force the gate open | The gate is a rendering decision and nothing reads it. Every request the editor then makes is authorized on the backend against the canonical predicate. They get an editor that refuses everything. |
| A frontend role flag or an email suffix is trusted | There is none. `test/admin-sso.test.js` fails the build if `isAdmin`, `is_homezai_admin`, an `@homezai.com` suffix test, `localStorage`, `sessionStorage` or a role comparison appears in the page's script. |
| A platform admin without a Homezai login email gets in | `is_homezai_admin` requires both halves. A user fixture with exactly this shape is in the denial matrix, and substituting raw `isAdmin` for the predicate turns three tests red. |
| A brokerage or association administrator gets in | Different population entirely; both are in the denial matrix against the real predicate. |
| Somebody keeps access after losing the Homezai Admin role | The predicate runs against the database on every brokered request, not once per session. A test demotes the same user between two requests on the same token and asserts the second is refused. |
| A deleted or merged account keeps a working session | The token carries a user id; a user id that no longer resolves is refused as an expired session. |

### The editor's credential

| Threat | Why it fails |
| --- | --- |
| The browser is given a GitHub credential | It is given an opaque Homezai token that grants nothing at GitHub. A test asserts no response on any route contains the credential, `ghs_`, or even the word GitHub. |
| The editor token is forged | HMAC over the payload with a key derived from the JWT secret under a distinct label, compared in constant time, verified before the payload is trusted for anything including its own expiry. |
| A Homezai access token is replayed as an editor token, or the reverse | Different keys and an explicit `purpose` claim. Both directions are pinned. |
| One user's token is repointed at another user | Changing `uid` invalidates the signature. |
| A stolen token is used forever | One hour maximum, re-checked against the payload's own `iat` at verification so a longer-lived signed token is still refused. |
| A token survives an explicit sign-out | Deny list in Redis, plus the one-hour ceiling for the case where Redis could not be written. Stated as a bound rather than assumed away. |
| A Redis outage signs everybody out, or stops the deny list denying | The token is signed rather than stored, so an outage costs the acceleration of a sign-out and nothing else. The authorization decision was never in Redis. |

### The sign-in relay

| Threat | Why it fails |
| --- | --- |
| A page on another origin opens the popup and reads the token | `postMessage` targets an allow-listed origin explicitly, never `'*'` and never the opener's claimed origin. The browser drops a message whose target does not match. Mutating this to `event.origin` turns the suite red. |
| `site_id` is used as a destination | It is a claim, matched against the allow list and refused before anything is minted. Look-alike suffixes, a smuggled `http:` scheme and a `user@host` trick are all in the tests. |
| Open redirect through the sign-in return address | The return address is built from the app's own origin and the relay's own path. Nothing caller-supplied appears in it. |
| Login CSRF, session fixation | The relay creates no Homezai session and accepts no credential. It reads the session that already exists and asks the backend a question about it. |
| The token leaks through history, a referrer or an access log | It is never in a URL, never in a fragment, never in a redirect. `Referrer-Policy: no-referrer`, `Cache-Control: no-store`. |
| Clickjacking the popup | `X-Frame-Options: DENY` and `frame-ancestors 'none'`. |
| An attacker forces a mint they cannot read | They can, and it is stated rather than hidden: minting is rate-limited and audited, and the result is delivered only to the allow-listed origin. |

Authorization code state, nonce and PKCE are not used, and that is a decision with
a reason rather than an omission: there is no authorization code, no token
endpoint and no third-party assertion in this flow. `src/lib/blogEditorRelay.ts`
says so at the top, next to what is defended instead.

### The brokered repository

| Threat | Why it fails |
| --- | --- |
| Confused deputy: the broker is talked into touching another repository | The credential can reach exactly one. On top of that, the REST path's owner and repository are checked, and the GraphQL body's structurally findable repository fields are checked. |
| Path traversal out of the allow list | `..` is refused rather than normalized, because the upstream would resolve it. |
| A read endpoint is turned into a write | REST accepts `GET` and `HEAD` only. The single write path is the editor's own GraphQL mutation. |
| An oversized or unparseable body is forwarded blind | Refused before an upstream call. |
| Commit attribution is lost | Stated as a limitation and mitigated: the acting Homezai user id is stamped into the commit body and recorded independently in the audit log. |

### The content boundary, which this change must not weaken

Drafts still live only in the private content repository, the publish workflow
still copies only `status: published`, and the public site is still static files.
None of that is touched by this change, and the tests that pin it are the ones
Task 11 shipped. SSO is an access change.

### What is logged, and what is not

Every mint, denial, read, write and repository failure is an event with a
correlation id, an actor user id and a category. Article bodies, media bytes,
emails, cookies, bearer tokens, editor tokens, authorization codes, GitHub
credentials and full upstream error payloads are all excluded by name, and the
`emit` signature has no parameter that could carry one. Ordinary denials are
warnings rather than errors, because the production error metric filter counts the
literal term `Error:` and a refused agent is not a backend error.
