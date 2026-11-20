# PR Summary — feat/remaining-views-and-summary

## What changed
- `src/domain/factualAccuracy.ts` — replaced the placeholder claim accuracy scale with the
  five-node scale (`Inaccurate`, `Unsupported`, `Disputed`, `Accurate`, `Can't confidently assess`),
  exported `CLAIM_ACCURACIES`, `CLAIM_CLASSIFICATIONS`, `createEmptyClaim()` and
  `createEmptyClaimSource()`, and made the classification/accuracy line tolerate partial input.
- `src/state/useEvaluationStore.ts` — persisted-claim validation now reuses the domain option
  lists instead of local duplicates, so stored accuracy values can never drift from the UI.
- `src/components/factual-accuracy/JustificationBuilderView.tsx` — one parameterised builder
  mounted for both `worldFactCorrectness` and `accountFactuality`: empty-state `+ Add Claim`
  (top and bottom), numbered claim cards with a right-aligned `×`, per-claim accuracy and
  classification pills, justification, `+ Add Source` rows, the five-node final rating track and
  a required Final Justification with a warning border until written. Emits the formatted
  justification and the objective-claims bullet list.
- `src/components/response-experience/ResponseExperienceView.tsx` — five-node rating track;
  a perfect 5/5 asks for a justification, every other rating shows Expected and Actual
  `RemovableFieldRow` lists with `+ Add`, plus one copyable preview.
- `src/components/final-summary/FinalSummaryView.tsx` — A/B nudge toggle (defaults to A), live
  score rows compiled from the other four tabs with missing ratings highlighted, and the
  copyable `Response X Scores:` block.
- `src/components/ScaleTrack.tsx`, `src/components/CopyButton.tsx` — shared rating track and
  clipboard action with idle/copied/failed feedback, reused by both new views.
- `src/App.tsx` — replaces the placeholder branch with the four real section views.

## Why
- Sprint goal: the worksheet was usable only for Task Completion; the remaining four tabs still
  rendered a placeholder.
- One builder component bound to either factuality slice keeps the two sections independent in
  state while sharing every line of claim/source/output UI.
- `ClaimAccuracy` previously offered invented options (`Partially Accurate`,
  `Cannot Confidently Assess`) in the wrong order; it now matches the specified five-node scale.

## Tests
- `npm test` — 82 passing (10 files), including new jsdom integration coverage for factuality
  section independence, the mandatory Final Justification state, live Final Summary score syncing
  across tabs, and the Response Experience 5/5 branch.
- `npm run build` — passing (`tsc --noEmit` + Vite build).
- Domain purity check: `rg "react|window|document|navigator|localStorage|setTimeout|fetch" src/domain` — no matches.

## Review notes / risks
- Claim accuracy and classification are `aria-pressed` pill groups rather than radios; the final
  section rating is a real radio group.
- The Final Summary A/B choice is view state only and resets to A when the tab unmounts; it is
  not persisted.
- The unused legacy scaffold components (`RatingSelector`, the old `JustificationBuilderView` in
  `src/components/`, `TaskCompletionSection`, `ResponseExperienceSection`, `appStore`) remain in
  place and unused, as in the previous sprint.
- The A/B toggle is labelled "Nudge response" with buttons "Response A" / "Response B".
