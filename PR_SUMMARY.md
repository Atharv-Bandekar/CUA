# PR Summary — feat/infrastructure-issue-order

## What changed
- **Folded issue lines live in the Justification field itself.** With the
  separate-list answer set to `No`, the Task Completion justification textarea now
  shows the `Agent tries to … but …` lines above the text the reviewer types. The
  lines are generated from the issue rows, always sit above the typed text, and
  follow any edit to a row's action or failure.
- **Typed text is stored separately from the generated lines.**
  `justificationFieldText` composes the field value and `typedJustification`
  recovers the typed text on edit, so the issue rows stay the source of truth and
  no text is duplicated in storage or in the output.
- **`formatTaskCompletion` prints the issues before the justification text** when
  the list is not separate, so the printed order matches what the field shows.
- **Add Issue stays on the Yes / No row, flush right.** The question, its pills and
  the button live in a right-aligned cluster, so Add Issue's right edge lines up
  vertically with the issue rows below it at every width, with a wider gap from the
  `No` pill.

## Why
- The reported caveat: with the list set to `No`, issues added first still printed
  after the justification text, and the field being filled did not show them at
  all, so the visual sequence did not match the output.
- The Add Issue button sat tightly against the `No` pill and was not aligned with
  the list it appends to.

## Tests
- `npm test` — 110 passing (10 files)
- `npm run build` — passing (265.59 kB JS / 80.01 kB gzip, 28.21 kB CSS)

New coverage:
- `tests/domain/taskCompletion.test.ts` — `justificationFieldText` puts the issue
  lines above the typed text and stays inert for a separate list;
  `typedJustification` recovers the typed text and the folded order is preserved
  when the justification is written after the issues.
- `tests/integration/taskCompletion.test.tsx` — adding and editing an issue updates
  the justification field text while the typed text survives, the live output
  keeps the issues first, and switching to a separate list strips them from the
  field.

## Review notes / risks
- Only the folded (`No`) shape embeds the lines; the separate-list (`Yes`) output
  is untouched — justification first, then the bulleted `Infrastructure/tool call
  issues:` block.
- Stored data is unchanged (`justification` still holds the typed text only), so
  existing saved worksheets re-render correctly with no migration.
- Editing a generated line inside the textarea re-renders it from the issue rows;
  the rows remain the place to change their wording.
