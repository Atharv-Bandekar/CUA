# PR Summary — feat/infrastructure-issue-order

## What changed
- **The justification field reads as one flow.** With the separate-list answer set
  to `No`, each `Agent tries to … but …` line is spliced into the justification
  field at the position where it was added. An issue added after some text lands
  *below* that text instead of jumping to the top, and a later edit to a row's
  action or failure updates its line in place.
- **Each issue remembers its position.** `InfrastructureIssue` gained `at`, the
  number of typed characters that come before its line. Add Issue records the end
  of the text that already exists, so the sequence the reviewer builds is the
  sequence that prints.
- **`justificationFieldText` composes, `justificationDraft` decomposes.**
  `justificationFieldText(issues, typed, separateList)` weaves the generated lines
  into the typed text; `justificationDraft(fieldValue, issues, separateList)`
  finds those lines again, removes them, and re-reads their positions on every
  keystroke, so the typed text is never stored twice.
- **`formatTaskCompletion` prints the same text the field shows** when the list is
  not separate, so the Live Output and the field never disagree.
- **Add Issue stays on the Yes / No row, flush right**, with its right edge aligned
  to the issue rows and the empty state below it.

## Why
- The reported caveat: an issue added after some justification text was inserted
  above the text that was already written, breaking the reading order the reviewer
  had built.
- The Add Issue button sat tightly against the `No` pill and was not aligned with
  the list it appends to.

## Tests
- `npm test` — 113 passing (10 files)
- `npm run build` — passing (266.56 kB JS / 80.37 kB gzip, 28.21 kB CSS)

New coverage:
- `tests/domain/taskCompletion.test.ts` — an issue recorded at the end of the
  typed text renders below it, issues and text interleave in the added order, and
  `justificationDraft` round-trips that field back to the typed text plus the same
  positions.
- `tests/integration/taskCompletion.test.tsx` — fill an issue, type the
  justification, add a second issue: the field and the Live Output both read
  issue → text → new issue, and the stored justification stays the typed text only.

## Review notes / risks
- Only the folded (`No`) shape embeds the lines; the separate-list (`Yes`) output
  is untouched — justification first, then the bulleted `Infrastructure/tool call
  issues:` block.
- Saved worksheets from before this change have no `at` on their issues; they load
  with `0`, which keeps the previous "issues above the text" order until the field
  is edited.
- Editing a generated line inside the textarea re-renders it from the issue rows;
  the rows remain the place to change their wording.
