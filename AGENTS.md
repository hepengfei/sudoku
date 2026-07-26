# AGENTS.md

This file is the repository-level operating contract for coding agents. It
applies to the whole repository. A more deeply nested `AGENTS.md` may add or
override rules for its own subtree.

## Project intent

Build a Sudoku application that is easy to run, test, and extend. Keep puzzle
rules and solving logic independent from presentation and persistence so that
the same core can support different interfaces later.

The repository is currently in its bootstrap stage. Do not invent commands,
dependencies, features, or architecture that are not present in the checkout.

## Working protocol

1. Read this file, `README.md`, and the files relevant to the requested change.
2. Inspect `git status` before editing. Preserve user changes and unrelated
   work.
3. Make the smallest coherent change that satisfies the request. Avoid
   opportunistic refactors, dependency upgrades, generated files, and broad
   formatting changes.
4. Add or update tests for behavior changes.
5. Run the narrowest relevant checks first, then the full repository checks.
6. Report what changed, what was verified, and any remaining limitation.

Do not commit, push, publish, delete data, or change remote state unless the
user explicitly asks for it.

## Repository shape

No implementation layout has been selected yet. When adding the first
implementation, keep these boundaries explicit even if the language uses
different directory names:

- **domain**: board representation, candidates, validation, solving, and puzzle
  generation;
- **application**: game state and use cases such as starting, editing, checking,
  resetting, saving, and loading a puzzle;
- **interface**: terminal, web, desktop, or mobile presentation;
- **infrastructure**: storage, network access, telemetry, and platform adapters;
- **tests**: unit tests beside or near their code, with integration/end-to-end
  tests clearly separated.

The domain layer must not import interface or infrastructure code.

## Harness contract

The first implementation change must provide stable, non-interactive repository
entry points for automation:

- `./scripts/setup` — install or verify required dependencies;
- `./scripts/check` — run formatting, linting, static analysis, and other fast
  validation;
- `./scripts/test` — run the complete automated test suite.

Each script must:

- be executable and safe to run repeatedly;
- resolve paths relative to the repository root;
- fail fast and return a non-zero exit status on failure;
- avoid prompts and machine-specific absolute paths;
- print actionable errors without hiding the underlying tool output.

If the chosen ecosystem has a conventional task runner, its commands may be
the implementation behind these scripts. Keep the scripts as the canonical CI
and agent interface, and document any additional run/build commands in
`README.md`.

Until implementation and scripts exist, documentation-only changes are
verified by inspecting the rendered Markdown and `git diff --check`.

## Sudoku invariants

Unless a feature explicitly defines a variant, use standard Sudoku rules:

- the board is 9×9 and contains digits 1–9 or an empty cell;
- each row, column, and 3×3 box contains each digit at most once;
- givens are immutable during play;
- parsing and validation reject malformed boards with clear errors;
- solving code distinguishes invalid, unsatisfiable, uniquely solvable, and
  multiply solvable puzzles when the calling feature needs that distinction;
- puzzle generation must verify uniqueness before presenting a generated
  puzzle as a standard playable puzzle.

Prefer deterministic behavior in tests. Any randomized generator must accept an
injectable seed or random source.

## Code quality

- Follow the formatter and linter selected by the repository; do not hand-style
  around them.
- Prefer small, single-purpose modules and explicit data flow.
- Keep domain logic pure where practical and isolate side effects at
  boundaries.
- Use names that express Sudoku concepts rather than abbreviations.
- Return structured errors from reusable code; format user-facing messages at
  the interface boundary.
- Add dependencies only when they materially reduce complexity. Document why a
  new runtime dependency is needed.
- Never commit secrets, credentials, local environment files, editor state,
  build output, dependency caches, or OS metadata.

## Testing expectations

At minimum, cover:

- board parsing and serialization;
- duplicate detection in every row, column, and box;
- immutable givens;
- candidate calculation;
- completed-board validation;
- solver behavior for valid, invalid, and unsatisfiable inputs;
- uniqueness checks if generation or puzzle import relies on uniqueness.

Every bug fix should include a regression test that fails before the fix. Tests
must not depend on network access, wall-clock timing, or unseeded randomness
unless the test is explicitly an integration test and is isolated accordingly.

## Documentation and completion

Update `README.md` whenever setup, commands, supported interfaces, or user-facing
behavior changes. Record architectural decisions only when a real decision has
been made.

A change is complete when:

- requested behavior is implemented without unrelated changes;
- relevant tests and checks pass;
- documentation matches the checkout;
- `git diff --check` is clean;
- the final handoff names the verification performed and any check that could
  not be run.
