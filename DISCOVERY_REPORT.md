# System Discovery & Architecture Audit

**Repository:** `agentic-tic-tac-toe`
**Scope:** Full codebase (`src/`, root scripts, CI/CD workflows, dependency manifest)
**Method:** Static review of all tracked source files, `npm audit`/`npm outdated`, GitHub Actions run history, and GitHub repository/branch settings via `gh` CLI.
**Generated:** 2026-09-15

---

## Executive Summary

The codebase is small (5 source files, ~250 LOC) and functionally solid — the Tic Tac Toe game logic is correct and covered by 15 passing Vitest tests. The most significant findings are **not in the game logic** but in the **CI/CD trust model**: PRs are auto-merged to `main` on the basis of a hardcoded, non-substantive "review" comment, `main` has no branch protection, and there is no linting step in CI. These combine into a real risk that low-quality or broken code can reach `main` without genuine review. Secondary findings cover missing accessibility/edge-case tests, a legacy one-off script left in the repo root, and CSS class names that currently do nothing because no stylesheet exists.

| Severity | Count |
|---|---|
| High | 2 |
| Medium | 5 |
| Low | 6 |

---

## 1. Dead Code & Redundancies

| Finding | Location | Detail | Recommendation |
|---|---|---|---|
| **Unstyled CSS hooks** | `src/Board.jsx` (`className="game"`, `"status"`, `"board"`, `"square"`, `"reset"`) | No `.css` file exists anywhere in the repo, and none is imported by `main.jsx`, `App.jsx`, or `Board.jsx`. These class names currently have zero effect — the only visual styling is the inline `style={{...}}` grid layout on the board container. | Either add a real stylesheet that targets these classes (see §4) or remove the dead class names until styling is implemented. |
| **Legacy one-off script** | `seed-linear.mjs` | A standalone script that bulk-creates the TIC-1/TIC-2/TIC-3 Linear issues. It has already served its purpose (all three issues exist and are `Done`), is not referenced by any `npm` script, `package.json`, or CI workflow, and will fail/duplicate issues if re-run against a fresh workspace. | Move to a `scripts/` or `tools/` directory with a short README note that it's a one-time bootstrap script, or delete it now that seeding is complete. |
| **Committed build artifact risk** | `dist/` | Present locally from a manual `vite build`, but correctly listed in `.gitignore` and confirmed untracked (`git status --ignored` shows `!! dist/`). Not currently a problem, but flagged because it's easy to accidentally `git add -A` and commit build output. | No action required; consider adding a pre-commit guard or CI check that fails if `dist/` is ever tracked. |
| **`package.json` has no `lint` script** | `package.json` | There is no ESLint/Prettier config anywhere in the repo (`.eslintrc*`, `eslint.config.*` all absent), so there's no automated style/quality gate at all, and nothing to be "dead" against. | See §3 — add linting rather than a redundancy fix. |

No unused React imports, unreachable branches, or orphaned components were found in `App.jsx`, `Board.jsx`, or `main.jsx` — the application code itself is lean.

---

## 2. Missing Edge-Case Tests

Current suite: `src/App.test.jsx` (2 tests) + `src/Board.test.jsx` (13 tests), all passing. Coverage is strong for win/draw/reset logic but has the following gaps:

### Interaction / race conditions
- **No test for rapid double-firing on the same square before React commits a re-render** (e.g., two `fireEvent.click` calls on the same square back-to-back without an intervening state read). The current "clicking an occupied square" test only covers the *already-rendered* disabled state, not the same-tick scenario.
- **No test using `@testing-library/user-event`'s `dblClick`/rapid `click` sequence**, which more faithfully simulates real browser event timing than `fireEvent` (which is synchronous and doesn't model pointer event pairing).
- **No test that a click during the exact render where `isGameOver` just became `true` is ignored** (i.e., the winning click itself must not also re-trigger a handler for a second square in the same batch).

### Accessibility
- **No test asserts `aria-label` content changes correctly as the board fills** (e.g., `Square 1, X` after a move) — only implicitly exercised, never directly asserted.
- **No test verifies the `role="status"` element behaves as a live region** (i.e., that assistive tech would announce the winner/draw text — `role="status"` implies `aria-live="polite"`, but nothing confirms this contract, e.g. via an explicit `aria-live` attribute check).
- **No test for the Reset button's accessible name/role in isolation**, or that focus lands somewhere sensible after reset (currently focus is not managed at all — after a win, all 9 squares become `disabled`, silently dropping keyboard focus with no test coverage of where it goes).
- **No axe/jest-axe style automated accessibility scan** exists at all.

### Keyboard navigation
- **No test verifies squares are reachable via `Tab` and activatable via `Enter`/`Space`.** They're native `<button>` elements so this works by default, but nothing in the suite would catch a future regression (e.g., switching to `<div onClick>`).
- **No test for keyboard-only game completion** (playing an entire game using `userEvent.keyboard` instead of `fireEvent.click`).

### Game logic
- **O's vertical and diagonal wins are untested** — only O's horizontal win is covered (`detects a win for O`); X is tested for horizontal, vertical, and both diagonals. Full symmetry is implicit but not asserted.
- **No test resets mid-game (non-terminal state)** — the existing reset test only resets *after* a win. A reset during an in-progress, non-terminal game is untested.
- **No test resets from a draw state** — only the "reset after win" path is covered.
- **No test for clicking a square with an out-of-range or invalid index** (defense-in-depth; low risk since indices are generated internally from `squares.map`, but worth a sanity test if `handleClick` is ever exposed more broadly).

---

## 3. System Risks & Vulnerabilities

### High: Auto-merge workflow provides false assurance and bypasses review
`.github/workflows/pr-review.yml` runs on every `opened`/`synchronize` PR event, posts a **hardcoded** comment claiming `"Static Analysis: Passed clean syntax checks"` and `"Approved for Auto-Merge"` regardless of what the diff actually contains (the script does no analysis — it's a fixed template string), then immediately runs `gh pr merge --auto --squash`. Combined with:
- No `main` branch protection (`gh api repos/.../branches/main/protection` → `404 Branch not protected`), and
- No required status checks or required reviewers configured,

...this means **any PR that merely passes `npm test` and `npm run build` is auto-merged to `main` with a misleading "reviewed and approved" comment attached, with no human in the loop.** This is a governance risk independent of code quality: a subtly broken or malicious change that still passes the existing tests would merge automatically and the PR comment would falsely claim it was reviewed.

**Recommendation:** Either (a) remove the fabricated "Automated Agent PR Review" comment and replace it with real static analysis (ESLint, `tsc --noEmit`, etc.), or (b) require at least one human approval via branch protection before merge is possible, or both. At minimum, stop describing a no-op as "Approved."

### High: `main` has zero branch protection
Confirmed via `gh api repos/EishaKhan727/agentic-tic-tac-toe/branches/main/protection` → `404`. Anyone with push access (including this very session, per the current task) can push directly to `main`, force-push, or delete the branch, and PRs can merge without passing review or even without CI having finished, since no status checks are *required* (they merely exist).

**Recommendation:** Enable branch protection on `main`: require the `CI Suite` workflow as a required status check, require at least one approving review, and disable force-pushes/deletions.

### Medium: Workflow permissions broader than needed
`pr-review.yml` declares `permissions: contents: write, pull-requests: write` at the workflow (top) level, so every job/step in the file inherits both, even though only the final "Enable Auto-Merge" step needs `contents: write` and only the comment step needs `pull-requests: write`.

**Recommendation:** Scope permissions per-job (or per-step where supported) following least-privilege, and set a restrictive default (`permissions: {}` or `contents: read`) at the workflow root with elevated scopes only on the job that needs them.

### Medium: `ci.yml` does not declare explicit permissions
No `permissions:` block is set in `.github/workflows/ci.yml`, so it inherits whatever the repository/org default `GITHUB_TOKEN` permissions are (which can vary and may be broader than `read`).

**Recommendation:** Add `permissions: contents: read` explicitly — this workflow only needs to check out code, run tests, and build.

### Medium: No linting or type-checking in CI
`ci.yml` runs `npm test -- --run` and `npm run build`, but there is no `eslint`/`tsc` step, and no ESLint config exists in the repo at all. Syntax and logic errors are only caught by the (currently thin) test suite and the build step; style/quality issues aren't caught at all.

**Recommendation:** Add an ESLint config (e.g., `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y` for accessibility linting) and a `lint` step in CI before tests.

### Medium: Auto-merge repo setting is inconsistent with the workflow's assumption
`gh api repos/EishaKhan727/agentic-tic-tac-toe` reports `allow_auto_merge: false` at the repository-settings level, yet `pr-review.yml` unconditionally calls `gh pr merge --auto --squash` and has historically succeeded (see run `34947768704` for PR #3). This mismatch between the declared repo setting and the workflow's observed behavior is fragile and should be reconciled explicitly rather than relying on it "happening to work."

**Recommendation:** Enable "Allow auto-merge" in repository settings to match what the workflow assumes, or switch the workflow to `gh pr merge --squash` (immediate merge gated by required status checks configured via branch protection) for more predictable behavior.

### Low: No error boundary
Neither `App.jsx` nor `main.jsx` wraps `<Board />` in a React error boundary. An unexpected exception inside `Board` (e.g., from a future refactor) would unmount the whole React tree and white-screen the app with no user-facing fallback.

**Recommendation:** Add a small `ErrorBoundary` component around `<Board />` in `App.jsx`.

### Low: Dependency freshness
`npm audit` reports **0 vulnerabilities** (both prod and full dependency tree) — good. `npm outdated` shows one minor lag: `vitest` `5.0.0` installed vs. `5.0.1` latest. No action-critical, but worth picking up in routine maintenance.

### Low: Public repository with write-scoped Actions
The repository is `public` (`visibility: public`). Combined with the broad `contents: write`/`pull-requests: write` permissions in `pr-review.yml`, this is a standard risk pattern for public repos accepting external PRs (GitHub does sandbox `GITHUB_TOKEN` to read-only for fork-originated `pull_request` runs by default, which mitigates the worst case, but it's worth explicitly confirming this repo never intends to accept outside contributions before relying on that default).

---

## 4. Architectural Recommendations

### State management
`Board.jsx` currently owns both the pure game logic (`WINNING_LINES`, `calculateWinner`) and all UI rendering/state in a single file. This works at the current scale but will not scale cleanly if the game grows (e.g., move history, undo/redo, AI opponent, scoreboard).

**Recommendation:** Extract the pure logic into `src/gameLogic.js` (`WINNING_LINES`, `calculateWinner`, and a `getGameStatus(squares)` helper) so it can be unit-tested independently of React and reused if a second UI (e.g., a CLI or a different view) is ever added. Optionally, move the `squares`/`xIsNext` state and handlers into a `useTicTacToe()` custom hook, leaving `Board` as a thin presentational component.

### Component isolation
`Board` currently renders the status line, the 3×3 grid, *and* each individual square inline in one component/function. There is no `Square` sub-component.

**Recommendation:** Extract a `Square` component (`{ value, onClick, disabled, label }`) and a `GameStatus` component. This makes each piece independently testable, easier to visually restyle, and sets up naturally for future features like highlighting the winning line (which needs per-square knowledge of "is this square part of the winning line").

### Winning-line highlighting (UX + a11y gap)
`calculateWinner` currently returns only the winning symbol (`'X'`/`'O'`), not *which* three indices won. There is no visual or programmatic indication of the winning line beyond the status text.

**Recommendation:** Have `calculateWinner` return `{ winner, line }` (or `null`), and use `line` to apply a `winning` class/`aria-current` to the three relevant squares. This is both a UX improvement and a straightforward accessibility win (sighted users currently must infer the winning line themselves).

### Styling
There is no stylesheet in the project; the only styling is a single inline `style` object for the grid layout, and several `className`s that do nothing (see §1). This makes it hard to add hover/focus/disabled visual states, theming, or responsive layout.

**Recommendation:** Introduce a real stylesheet (CSS Modules, e.g. `Board.module.css`, or a single `src/index.css` imported in `main.jsx`) and move the inline grid style there. Add explicit `:focus-visible` styling for keyboard users and a `:disabled` state so "game over" is visually obvious, not just structurally enforced.

### Typing
The project has no TypeScript and no PropTypes. For a codebase this size it's optional, but as components are extracted (`Square`, `GameStatus`, `useTicTacToe`) prop contracts will become worth enforcing.

**Recommendation:** Consider incrementally adopting TypeScript (Vite has first-class support) once the component split above happens — it's a natural moment to introduce types cheaply.

---

## Summary of Recommended Next Actions (priority order)

1. Add branch protection to `main` (require CI status check + review).
2. Replace or remove the hardcoded "Approved for Auto-Merge" review comment in `pr-review.yml`; gate merges on a real signal.
3. Add an ESLint config + `lint` step to `ci.yml`.
4. Scope down workflow permissions to least-privilege, per job.
5. Extract `gameLogic.js` and a `Square` component; add winning-line data to `calculateWinner`.
6. Fill the test gaps in §2 (O's vertical/diagonal wins, mid-game reset, keyboard nav, a11y live-region assertions).
7. Add a real stylesheet and remove/implement the currently-dead `className`s.
8. Relocate or remove `seed-linear.mjs` now that its one-time job is done.
