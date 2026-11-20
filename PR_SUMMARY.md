# PR Summary — feat/cua-evaluation-branding

## What changed

**Branding**
- Renamed the sidebar brand from `BA Review` to `CUA Evaluation` and removed the
  `Turing evaluation` subtitle line.
- Applied the same name to the installable-app identity: the document title,
  `apple-mobile-web-app-title` and the web app manifest `name` / `short_name` are now
  `CUA Evaluation`.
- Bumped the service-worker cache key (`ba-review-v2` → `cua-evaluation-v3`) so installed
  copies pick up the new title, manifest and shell instead of the cached ones.

**Infrastructure / tool call issues (Task Completion)**
- New section directly below Conditions with the question *"Want a separate Infrastructure
  list?"* (Yes / No), a `+ Add Issue` button on the right of that same row, and a
  repeatable list of issues.
- Each issue is two fields on one line — `Agent tries to [action + target] but [what
  failed]` — plus the shared `RemovableFieldRow` close button. New issues are numbered from
  their position, so deleting one renumbers the rest.
- `formatInfrastructureIssue()` in `src/domain/taskCompletion.ts` renders the fixed
  `Agent tries to … but …` template. Blank slots collapse instead of printing doubled
  spaces, and a row with both fields empty is not printed at all.
- Compilation now has two shapes, chosen by the Yes / No answer:
  - **Yes** — the issues follow the justification as their own block:
    ```
    Justification: …

    Infrastructure/tool call issues:
    • Agent tries to open the CRM ticket but the tool returned a 403
    ```
  - **No** — the same lines are folded into the justification itself, with no heading:
    ```
    Justification: …
    Agent tries to open the CRM ticket but the tool returned a 403
    ```
- State: `separateInfrastructureList: boolean` and `infrastructureIssues:
  InfrastructureIssue[]` added to the Task Completion slice, persisted and validated on
  load (`separateInfrastructureList` only survives as `true`; malformed rows are dropped).

## Why

- The worksheet is used for CUA evaluations, not business-analyst grading, and the subtitle
  implied a single (former) client.
- The manifest, tab title and sidebar disagreed after the rename; installed app windows and
  the OS app list would still have shown the old name.
- Reviewers have to record infrastructure and tool-call failures alongside task completion.
  Free-text justification lost that structure; the two-field template keeps every entry in
  the required `Agent tries to … but …` form.

## Tests

- `npm test` — **105 passing (10 files)**
- `npm run build` — passing (`tsc --noEmit` + Vite build; 264.93 kB JS / 79.78 kB gzip,
  27.82 kB CSS)
- New coverage: the issue template and its blank-slot collapsing, both output shapes
  (separate block vs. folded into the justification), skipping empty rows, adding /
  editing / removing issue rows through the UI, switching Yes ↔ No, and persistence of both
  the issues and the separate-list answer.

## Review notes / risks

- Manifest `id`, `scope` and `start_url` are unchanged, so existing installations keep their
  identity and stored worksheets.
- An app installed before this deploy keeps the old window title until Chrome updates the
  manifest (reopen the app or reinstall from Chrome's Apps page if it lingers).
- The separate-list question defaults to **No**, matching the "add it straight into the
  justification" behaviour. Choosing a side is persisted with the worksheet.
- Issues are ordered as entered and print in that order; the heading text
  (`Infrastructure/tool call issues:`) lives in the domain so the preview and the copy
  button cannot drift.
- Text/state additions only: the stored key `ba.evaluation.v1` is unchanged and older
  payloads load with `separateInfrastructureList: false` and no issues.
