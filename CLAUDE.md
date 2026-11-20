# CLAUDE.md

Operating rules for this repository. They are mandatory for humans and AI agents.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, Lucide icons, Vitest.

```bash
npm run dev        # local dev server
npm test           # run the Vitest suite once
npm run test:watch # TDD loop
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build
```

Architecture is defined in `ARCHITECTURE.md`. Read it before adding files.

## 1. Strict TypeScript — zero `any`

- `tsconfig.json` keeps `"strict": true`, `"noImplicitAny": true`,
  `"noUnusedLocals": true`, `"noUnusedParameters": true` and
  `"noFallthroughCasesInSwitch": true`. Do not weaken them.
- **Never write `any`.** This includes `as any`, `: any`, `any[]`,
  `Record<string, any>` and implicit `any` from untyped parameters.
- Use `unknown` at boundaries and narrow with type guards. Validate parsed JSON
  and external input before it reaches application types.
- Prefer discriminated unions and literal types over booleans or strings that
  encode state. `Rating` is `1 | 2 | 3 | 4 | 5` — never a bare `number`.
- Type-only imports use `import type`.
- `npm run typecheck` must pass with no errors and no `@ts-ignore`,
  `@ts-expect-error` or `eslint-disable` suppressions.

Layer rules:

- `src/domain/` — pure TypeScript. **No React, DOM, or browser API imports.**
- `src/state/` — reactive store and `localStorage` persistence. No React.
- `src/adapters/` — browser integrations such as clipboard.
- `src/components/` — React UI only; no business logic.

## 2. Test-Driven Development

Write the test first, then the implementation.

1. Add or extend a Vitest test in `tests/domain/` **before** writing the
   `src/domain/` function. The test must fail for the right reason.
2. Implement the smallest pure function in `src/domain/` that satisfies it.
3. Refactor with the test green.
4. State changes get coverage in `tests/state/` (persistence, undo window, slice
   isolation).
5. Components are verified with `npm run typecheck` / `npm run build` and manual
   inspection; extract logic into `src/domain/` rather than testing JSX details.

Rules:

- Do not merge a feature with failing tests or with tests skipped via `.skip`,
  `.todo` or commented-out assertions.
- Do not rewrite an assertion to match a buggy implementation — fix the
  implementation.
- Tests are deterministic: inject clocks and storage instead of relying on wall
  time or the real `localStorage`.

## 3. Git discipline

- **Never commit directly to `main`.** `main` only receives reviewed merges.
  (The initial scaffold is the single intentional exception.)
- One sprint per feature: branch `feat/<name>` from an up-to-date `main`, e.g.
  `feat/world-fact-correctness`.
- Before every commit:
  1. `npm test` passes.
  2. `npm run build` passes.
  3. `git status` contains only intended files.
- Commit messages follow **Conventional Commits**:

  ```
  <type>(<scope>): <imperative summary>

  <optional body explaining why>
  ```

  Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`, `build`.
  Examples: `feat(state): add 5s undo window to clearAll`,
  `test(domain): cover rating clamp boundaries`.
- Keep commits focused; never mix a refactor with behaviour changes.
- **No AI attribution.** Commit messages, pull request bodies and files end on
  their own last line. Never add `Co-Authored-By` trailers, `Generated with …`
  lines or any agent name. The only author is the repository owner.
- Pull requests are opened and updated with the GitHub CLI (`gh`), not by hand:
  `gh pr create`, `gh pr view`, `gh pr checks`. If `gh` is not on `PATH`, stop
  and install it (`winget install --id GitHub.cli --exact`) rather than asking a
  human to open the compare page.
- Generate `PR_SUMMARY.md` at the end of each sprint before opening the pull
  request. Delete or reset it on the next sprint so it always describes the
  current branch. Template:

  ```markdown
  # PR Summary — <branch>

  ## What changed
  - ...

  ## Why
  - ...

  ## Tests
  - `npm test` — X passing
  - `npm run build` — passing

  ## Review notes / risks
  - ...
  ```

## 4. Definition of done

- [ ] Tests written first for domain logic, then implementation
- [ ] `npm test` green
- [ ] `npm run build` green, no `any`, no suppressions
- [ ] Layer boundaries respected (`src/domain/` free of React/DOM)
- [ ] Shared components reused: `RemovableFieldRow`, `JustificationBuilderView`
- [ ] On a `feat/<name>` branch, Conventional Commit, `PR_SUMMARY.md` generated
- [ ] Commit message has no `Co-Authored-By` trailer or agent attribution
