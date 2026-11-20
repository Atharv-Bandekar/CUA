# PR Summary — feat/infrastructure-issue-order

## What changed
- **Issue lines print first when the list is not separate.** `formatTaskCompletion`
  now emits the `Agent tries to … but …` lines above the typed justification text
  instead of below it, so a combined justification follows the order the reviewer
  recorded things in: issues first, justification text second.
- **The Justification field shows those lines.** When the separate-list answer is
  `No` and at least one issue is filled in, the Task Completion justification card
  renders the printable issue lines directly above the text area, with a one-line
  note that they print before the typed text. They disappear when the answer is
  switched to `Yes`, because they then move to their own bulleted block.
- **`infrastructureIssueLines` is exported** from the domain so the UI and the
  output share one formatter instead of duplicating the template.
- **Add Issue moved to its own right-aligned row** under the Yes / No question, so
  it lines up with the remove buttons of the issue rows below it instead of being
  crowded against the `No` button.

## Why
- The reported caveat: with the list set to `No`, issues added first still printed
  after the justification text, so the on-screen and printed sequence disagreed
  with the order the reviewer worked in.
- The Add Issue button sat tightly against the `No` pill and looked detached from
  the list it appends to.

## Tests
- `npm test` — 108 passing (10 files)
- `npm run build` — passing (265.57 kB JS / 79.93 kB gzip, 28.27 kB CSS)

New coverage:
- `tests/domain/taskCompletion.test.ts` — folded issues print above the
  justification text, keep that order when the justification is typed afterwards,
  and `infrastructureIssueLines` drops empty rows.
- `tests/integration/taskCompletion.test.tsx` — the justification card shows the
  issue lines, the live output keeps them before the typed text, and they
  disappear when the separate list is selected.

## Review notes / risks
- Only the folded (`No`) shape changed order; the separate-list (`Yes`) output is
  untouched — justification first, then the bulleted `Infrastructure/tool call
  issues:` block.
- Stored data is unchanged, so existing saved worksheets re-render with the new
  order and need no migration.
- The issue lines in the justification card are a read-only preview; editing still
  happens in the issue rows, which remain the source of truth.
