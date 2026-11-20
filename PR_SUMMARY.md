# PR Summary — feat/remaining-views-and-summary

## What changed

This branch turns the scaffold into the finished worksheet: state layer, all five
section views, the full rating/output pipeline, and a deployable static build.

**Domain (`src/domain/`, pure — no React/DOM)**
- `taskCompletion.ts` — main-goal Yes/No statuses, conditions, completed-task list,
  `Final Rating`, and the printable `formatTaskCompletion` output.
- `factualAccuracy.ts` — five-node claim accuracy scale (`Inaccurate`, `Unsupported`,
  `Disputed`, `Accurate`, `Can't confidently assess`), claim classifications,
  `createEmptyClaim()` / `createEmptyClaimSource()`, and a classification/accuracy line
  that tolerates partial input.
- `responseExperience.ts` — the 5/5 justification branch, Expected/Actual bullet
  formatting and its copyable output.
- Predefined justifications: `CLAIM_JUSTIFICATION_PRESETS` (five fixed openers for the
  claim dropdown), `claimJustificationForAccuracy()` / `finalJustificationForRating()` for
  the section-specific "cannot be assessed" text, and
  `responseExperienceJustificationForRating()` returning the full Cannot-be-improved
  justification.
- `finalSummary.ts` — the compiled `Response X Scores:` block and missing-rating flags.
- `ratingOptions.ts` — single source of truth for the 5-point scale labels and
  `NOT_RATED`.

**State (`src/state/useEvaluationStore.ts`)**
- Four independent slices (`taskCompletion`, `worldFactCorrectness`, `accountFactuality`,
  `responseExperience`) over a framework-agnostic store.
- `localStorage` persistence under `ba.review.v1`; corrupt or foreign payloads are
  validated against the domain option lists and fall back to an empty worksheet.
- `clearAll()` with a 5-second undo window; any later mutation cancels a pending undo so
  stale data can never overwrite new work.
- Injectable clock and scheduler, so undo/persistence are tested without wall time.

**UI (`src/components/`)**
- `layout/` — `AppShell`, `TopBar`, `Sidebar`, `MobileNav`, `UndoToast` and the shared
  navigation model; five-tab shell that holds up at a 400 px split-screen width.
- `task-completion/` — `TaskCompletionView`, `StatusPills` (Yes/No only for the main goal
  and conditions), `FinalRatingTrack` and the live-output preview with copy.
- `factual-accuracy/JustificationBuilderView` — one parameterised builder mounted for both
  `worldFactCorrectness` and `accountFactuality`: numbered claim cards, per-claim accuracy
  and classification pills, a `Predefined` justification dropdown beside each claim
  justification, sources, and a required Final Justification. Choosing
  "Can't confidently assess" seeds the section's no-fact/no-tool-call justification; the
  1/5 section rating seeds its final counterpart.
- `response-experience/ResponseExperienceView` — perfect 5/5 asks for a justification;
  every other rating shows Expected/Actual `RemovableFieldRow` lists.
- `final-summary/FinalSummaryView` — A/B nudge toggle, live score rows compiled from the
  other four tabs, and the copyable summary block.
- Shared `ScaleTrack` and `CopyButton` used by every section.
- `App.tsx` — replaces the placeholder branch with the real views.

**Tooling / deploy**
- `vite.config.ts` — test include widened to `tests/**/*.test.{ts,tsx}` for jsdom
  integration tests; `@testing-library/react`, `@testing-library/user-event` and `jsdom`
  added as dev dependencies.
- `deploy/worker.js` — minimal ES-module Worker that forwards every request to the static
  assets binding.
- `sites.json` — static deploy manifest (`assetsDirectory: ./dist`, `spa: true`).
- Installable app: `public/manifest.webmanifest` (standalone display, 192/512 + maskable
  icons), `public/sw.js` (network-first navigations, cache-first hashed assets) registered
  from `src/main.tsx` in production builds only, and the matching `index.html` links.

## Why
- The worksheet was usable for one tab only; the remaining sections rendered placeholders.
- One builder component bound to either factuality slice keeps the two sections
  independent in state while sharing every line of claim/source/output UI, as
  `ARCHITECTURE.md` requires.
- `ClaimAccuracy` previously offered invented options (`Partially Accurate`,
  `Cannot Confidently Assess`) in the wrong order; it now matches the specified scale.
- Task Completion originally printed the rating scale (`3/5 Partially Complete`) where the
  spec asks for a Yes/No verdict on the main goal and each condition; statuses now have
  their own label map, and the pill list is imported from the domain so pills and output
  text cannot drift.

## Tests
- `npm test` — **94 passing (10 files)** across `tests/domain/`, `tests/state/` and
  `tests/integration/`, covering formatter output, scale boundaries, store slice
  isolation, persistence round-trips, corrupt-data recovery, undo expiry/cancellation,
  factuality section independence, the mandatory Final Justification state, the two
  cannot-assess presets, the predefined justification list and its dropdown, the
  Response Experience 5/5 branch, cross-tab Final Summary syncing and the Task Completion
  status pills.
- `npm run build` — passing (`tsc --noEmit` + Vite build; 261.41 kB JS / 79.17 kB gzip,
  27.52 kB CSS).
- Domain purity: `rg "react|window|document|navigator|localStorage|setTimeout|fetch" src/domain`
  — no matches.

## Review notes / risks
- Claim accuracy and classification are `aria-pressed` pill groups; the section rating is a
  real radio group.
- The Task Completion status list is deliberately `5/5` (Yes) and `1/5` (No) only, but the
  full `TASK_COMPLETION_STATUS_RATINGS` map is kept so worksheets persisted with the old
  3/5 "Partial" value still print a label instead of crashing.
- The Final Summary A/B choice is view state only and resets to A when the tab unmounts;
  it is not persisted.
- Predefined values replace the justification text when chosen (dropdown pick, "Can't
  confidently assess", 1/5 rating, or 5/5 Response Experience) rather than appending, so a
  deliberate overwrite of typed text is possible.
- The service worker only caches same-origin GETs and is registered in production builds;
  `dist/` ships `manifest.webmanifest`, `sw.js` and the icon set.
- Unused legacy scaffold components (`RatingSelector`, the old `JustificationBuilderView` in
  `src/components/`, `TaskCompletionSection`, `ResponseExperienceSection`, `appStore`) are
  still present but unreferenced.
- `deploy/worker.js` and `sites.json` are committed build config; `dist/` stays gitignored.
  The deployed site is a static SPA with no backend, so all user data lives in the browser's
  `localStorage`.
