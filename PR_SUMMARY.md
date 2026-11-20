# PR Summary — feat/infrastructure-issue-order

## What changed
- **No separate list is plain text.** With the answer set to `No`, Add Issue writes
  `Agent tries to but` into the Justification field, after the text that is already
  there and behind a single space. There are no issue rows, no offsets and no
  composition to keep in sync: the field is the reviewer's text.
- **Yes is the only shape with rows.** Choosing `Yes` shows the action / failure
  rows and prints them as the bulleted `Infrastructure/tool call issues:` block
  below the justification.
- **The justification is stored as typed.** `InfrastructureIssue.at`,
  `justificationFieldText` and `justificationDraft` are gone; the textarea reads and
  writes `taskCompletion.justification` directly, and the Live Output prints the
  same trimmed text.
- **Add Issue stays on the Yes / No row, flush right**, with its right edge aligned
  to the issue rows and the empty state below it.

## Why
- Placing generated lines inside the reviewer's text needed offsets, an inverse
  parse and separator bookkeeping on every keystroke. It was more machinery than
  the task needs, and it kept producing ordering surprises when the field was
  edited.
- Writing one fixed template at the end of the field gives the same reading order
  with a single pure function, and the reviewer fills the blanks in place.

## Tests
- `npm test` — 108 passing (10 files)
- `npm run build` — passing (265.44 kB JS / 79.90 kB gzip, 28.05 kB CSS)

New coverage:
- `tests/domain/taskCompletion.test.ts` — `appendInfrastructureTemplate` appends
  after existing text and behind one space, trims trailing whitespace, and starts a
  blank field with the template; with `No` the output prints only the justification,
  with `Yes` it still prints the bulleted block.
- `tests/integration/taskCompletion.test.tsx` — Add Issue with `No` writes the
  template after the typed text and repeated presses append again; `Yes` shows the
  action / failure rows and the bulleted output; switching back to `No` hides the
  rows and leaves the justification alone; persistence stores the rows without
  offsets.

## Review notes / risks
- Issue rows entered under `Yes` are kept in state when the answer changes to `No`,
  so switching back restores them; they are simply not printed or shown while the
  answer is `No`.
- Saved worksheets from earlier builds may still carry `at` on their issues; the
  reader ignores it.
- The template is inserted as text only, so a reviewer who edits or deletes it is
  free to do so — nothing regenerates it.
