# Architecture

This project is a single-page business-analyst review worksheet. It is split into
**four strict layers**. Dependencies only ever point downward:

```
src/components/   UI (React, Tailwind, Lucide)
      │
      ├──────────────► src/adapters/   browser boundaries (clipboard)
      │
      ▼
src/state/        reactive store + localStorage persistence (no React)
      │
      ▼
src/domain/       pure TypeScript types, rating mappings, formatters
```

A layer may import from the layers below it. It must never import from a layer
above it, and it must never bypass a layer.

| Layer | May import | Must never import |
| --- | --- | --- |
| `src/domain/` | other `src/domain/` files | React, DOM, browser APIs, `src/state`, `src/adapters`, `src/components` |
| `src/state/` | `src/domain/` | React, DOM components, `src/components` |
| `src/adapters/` | types from `src/domain/` | React, `src/components` |
| `src/components/` | `src/domain/`, `src/state/`, `src/adapters/` | — |

## 1. `src/domain/` — pure logic

Contains only:

- **Types** — `Rating`, `RepeatableItem`, `SourceItem`, the three state slice
  shapes, and the aggregate `AppState`.
- **Rating mappings** — the five-point scales for `taskCompletion`,
  `worldFactCorrectness`, `accountFactuality` and `responseExperience`, plus
  helpers such as `clampRating`, `ratingToPercent`, `averageRating` and
  `ratingLabel`.
- **String formatting** — `formatRating`, `formatPercent`, `formatUtcDateTime`,
  `formatSecondsRemaining`, `pluralize`, `truncateText` and
  `formatJustificationSummary`.

Hard rules:

1. **ZERO React, DOM or browser API imports.** No `react`, `react-dom`, `window`,
   `document`, `navigator`, `localStorage`, `crypto`, `setTimeout`, `fetch`, or
   JSX. Domain code must run unchanged in Node, a Worker, or a test file.
2. Everything is a pure function of its arguments. No module-level mutable state,
   no clock reads, no randomness.
3. All user-facing text produced here is plain strings — components own styling,
   domain owns wording and number formatting.

Enforce it with:

```bash
rg "react|window|document|navigator|localStorage|setTimeout|fetch" src/domain
```

The command must produce no matches.

## 2. `src/state/` — reactive store and persistence

`src/state/appStore.ts` exposes a framework-agnostic store with **four independent
state slices**:

| Slice | Shape | Purpose |
| --- | --- | --- |
| `taskCompletion` | `{ rating, completedTasks, notes }` | how much of the assigned task set was delivered |
| `worldFactCorrectness` | `{ rating, conditions, sources, expected, actual }` | fact-checks against the real world |
| `accountFactuality` | `{ rating, conditions, sources, expected, actual }` | fact-checks against the customer account |
| `responseExperience` | `{ rating, comment }` | quality of the written response itself |

Contracts:

- `getState()` returns an immutable snapshot; updates replace the object identity
  so `useSyncExternalStore` re-renders.
- `subscribe(listener)` returns an unsubscribe function.
- `updateTaskCompletion`, `updateJustification(slice, patch)` and
  `updateResponseExperience` are the only mutation entry points.
- Every mutation persists the whole state to `localStorage` under
  `ba.review.v1` (`STORAGE_KEY`). Corrupt or foreign payloads are ignored and
  fall back to an empty worksheet.
- `clearAll()` resets every slice, persists the empty worksheet, and starts a
  **5-second undo window** (`UNDO_WINDOW_MS`).
- `undoClear()` restores the pre-clear snapshot if the window is still open and
  returns `false` afterwards. Any other mutation inside the window cancels the
  pending undo so stale data can never overwrite new work.
- `getUndoState()` reports `{ active, expiresAt }` for the UI countdown.
- Clock and timers are injectable (`now`, `schedule`, `cancelSchedule`) so the
  undo window and persistence are tested without fake browser globals.

The state layer contains **no React**: the only bridge is the
`src/components/useAppStore.ts` hook built on `useSyncExternalStore`.

## 3. `src/adapters/` — browser boundaries

Adapters isolate every platform call so components never touch browser APIs
directly.

- `clipboard.ts` exposes `copyText(text): Promise<boolean>` backed by
  `navigator.clipboard.writeText`. It returns `false` instead of throwing when
  the API is unavailable (insecure context, denied permission, older browser), so
  the UI can show a recoverable error.

New integrations (downloads, share sheets, analytics) belong here as small,
injectable modules with the same "never throw at the caller" contract.

## 4. `src/components/` — responsive dark UI

React + Tailwind + Lucide. Presentation only: no business rules, no formatting
logic, no direct storage or clipboard calls.

Design tokens (see `src/index.css`): background `#0F1115`, cards `#181B20`,
raised surfaces `#1F232A`, borders `#2A2F38`, text `#E6E8EB`, muted `#9AA3AF`,
accent `#6C8CFF`. Dark mode is the default and only theme.

Layout is optimised for a **400 px wide split-screen window**: a single column,
`max-w-[420px]` centred, compact 4 px/8 px rhythm, `min-w-0` on flex children,
`break-all` on URLs, and touch targets of at least 28 px. It scales up to desktop
by staying single-column rather than reflowing into a dense grid.

Two components are mandatory shared contracts:

### `RemovableFieldRow.tsx`

Every repeatable input in the app — **Conditions, Sources, Expected bullets,
Actual bullets, and completed tasks** — renders through this one component. It
takes `children` (the input or inputs for that row) and an `onRemove` callback,
and renders a **right-aligned close (`×`) button** with an accessible
`aria-label`. No bespoke delete buttons are allowed anywhere else.

### `JustificationBuilderView.tsx`

`World Fact Correctness` and `Account Factuality` are rendered by a **single
parameterised** `JustificationBuilderView` — there is no duplicated UI code. It
receives `title`, `description`, `scale`, `draft`, `onChange` and `onCopy`, and
builds the rating selector plus the Conditions, Sources, Expected and Actual
field groups. Adding a new justification-style section means adding a state slice
and passing different props, not copying JSX.

## Testing

- Vitest runs with `npm test` (watch mode: `npm run test:watch`).
- `tests/domain/` covers the pure domain layer and is written **before** the
  implementation (TDD, enforced by `CLAUDE.md`).
- `tests/state/` covers store isolation, persistence round-trips, corrupt data
  recovery, undo expiry and undo cancellation.
- Components are verified through `npm run build` typechecking and manual
  inspection in the running dev server.

## Change checklist

1. Types/mappings/formatters → `src/domain/` + a test in `tests/domain/` first.
2. New state → `src/state/` with persistence defaults and store tests.
3. New browser capability → `src/adapters/` with a graceful failure path.
4. New UI → `src/components/`, reusing `RemovableFieldRow` and
   `JustificationBuilderView` where the pattern already exists.
5. `npm test` and `npm run build` must pass before a commit.
