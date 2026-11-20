# PR Summary — feat/domain-formatters

## What changed

- Added `src/domain/taskCompletion.ts`: `TaskCompletionRating` options (5/5 → "Fully Complete" … 1/5 → "Not at all Complete"), `TaskCompletionState`, and `formatTaskCompletion()` with dynamically numbered conditions.
- Added `src/domain/factualAccuracy.ts`: the shared `FactualAccuracyState` / `Claim` model for World Fact Correctness and Account Factuality, `formatJustificationBuilder()` with index-numbered claims and per-claim sources, and `formatObjectiveClaimsList()`.
- Added `src/domain/responseExperience.ts`: rating options (5/5 → "Cannot be improved" … 1/5 → "Horrible") plus `formatResponseExperience()`, which emits rating + justification for a perfect score and expected/actual bullets otherwise.
- Added `src/domain/finalSummary.ts`: `formatFinalSummary(input, responseLabel = 'A')` compiling all four output labels with a `[Not Rated]` fallback.
- Added `src/domain/ratingOptions.ts` for the shared best-first option lists and output-text lookup; no `(x/5)` prefix is ever printed.
- Added TDD suites in `tests/domain/`: `taskCompletion`, `factualAccuracy`, `responseExperience`, `finalSummary` (written before implementation, observed failing on missing modules).

## Why

The review worksheet needs its four report sections to compile to a fixed, review-ready text format with label-only ratings, so the same domain formatters can later back the UI and clipboard output.

## Tests

- `npm test` — 71 passing (7 files), including the 29 new domain tests
- `npm run build` — `tsc --noEmit` + Vite build passing

## Review notes / risks

- Unselected ratings render `[Not Rated]` consistently across all formatters; the task spec only defined this fallback for the final summary.
- `ClaimAccuracy` is modelled as `'Accurate' | 'Inaccurate' | 'Partially Accurate' | 'Cannot Confidently Assess' | ''` because the spec left claim-level accuracy options open; the format line prints `{classification} - {accuracy}`.
- Claim and point text is trimmed; only `formatObjectiveClaimsList` collapses internal whitespace to one line, as specified.
