# PR Summary — feat/shell-and-task-completion

## What changed

- Added the global evaluation store in `src/state/useEvaluationStore.ts`: one persisted state for all four scored sections, `localStorage` key `ba.evaluation.v1`, defensive parsing, `clearAll()` with a 5-second undo window, `undoClear()`, and a `useEvaluationStore()` / `useUndoState()` React bridge. Verified end-to-end in the new integration tests.
- Added the responsive shell in `src/components/layout/`: `AppShell` + `AppShellFrame`, a desktop `Sidebar` with the five sections in order, a horizontal `MobileNav` for 400px split-screen windows, a persistent `TopBar` showing the active section title and `Clear All`, and a non-blocking `UndoToast`.
- Added the Task Completion view in `src/components/task-completion/`: Main Goal input with Yes/No/Partial pills and a `+ Add Condition` button beside it, dynamic condition rows using the shared `RemovableFieldRow` with right-aligned `×`, a five-node horizontal Final Rating track, a rating-aware justification starter pill, and a live output preview with `Copy Task Completion` via the clipboard adapter.
- Replaced the root `App.tsx` with the new shell; Task Completion is the default view and the other four tabs show a sprint placeholder.
- Reused the existing `src/adapters/clipboard.ts` and `src/components/RemovableFieldRow.tsx` rather than duplicating them.
- Added `tests/integration/taskCompletion.test.tsx` (jsdom + Testing Library) covering condition add/delete re-indexing and Clear All / Undo restoration.

## Why

This sprint establishes the app shell and the first complete evaluation section, with the store and undo behaviour that the remaining sections will reuse.

## Tests

- `npm test` — 75 passing (8 files), including 4 new integration tests
- `npm run build` — `tsc --noEmit` + Vite build passing

## Review notes / risks

- `useEvaluationStore.ts` imports React because it exposes hooks, as this sprint's file name requires; the rest of the persistence and undo logic stays framework-agnostic and is exercised through the singleton in tests.
- Quick pills map to the five-point scale (`Yes` → 5/5, `Partial` → 3/5, `No` → 1/5), so the preview prints the domain's output labels.
- Condition rows are index-keyed because the domain model has no id field; removal renumbers from the array index.
- The other four section views are placeholders until their sprints.
