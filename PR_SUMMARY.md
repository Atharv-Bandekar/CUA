# PR Summary — feat/cua-evaluation-branding

## What changed

- Renamed the sidebar brand from `BA Review` to `CUA Evaluation` and removed the
  `Turing evaluation` subtitle line.
- Applied the same name to the installable-app identity: the document title,
  `apple-mobile-web-app-title` and the web app manifest `name` / `short_name` are now
  `CUA Evaluation`.
- Bumped the service-worker cache key (`ba-review-v2` → `cua-evaluation-v3`) so installed
  copies pick up the new title, manifest and shell instead of the cached ones.

## Why

- The worksheet is used for CUA evaluations, not business-analyst grading, and the
  subtitle implied a single (former) client.
- The manifest, tab title and sidebar disagreed after the rename; installed app windows and
  the OS app list would still have shown the old name.
- Chrome keeps the previous manifest name for an already-installed app until it re-reads
  the manifest, which the forced cache refresh guarantees.

## Tests

- `npm test` — 94 passing (10 files)
- `npm run build` — passing

## Review notes / risks

- Manifest `id`, `scope` and `start_url` are unchanged, so existing installations keep
  their identity and stored worksheets.
- An app installed before this deploy keeps the old window title until Chrome updates the
  manifest (reopen the app or reinstall from Chrome's Apps page if it lingers).
- Text-only change: no state, domain or behaviour touched; `localStorage.ba.review.v1` key
  is untouched so saved worksheets survive.
