# Web/API gaps and build decisions

This document records why the frontend was built the way it was, given the actual
state of this repository, and what's deliberately deferred.

## 1. Repository state at the start of this work

The repository was **not a git repo**, had **no Python backend**, and its only
content was an untouched `npm create vite` React+TypeScript scaffold (package
name `"diana"`, default `App.tsx`/`App.css`, default assets). None of the
DevMate application services, CLI, or SQLite persistence described in the task
brief existed anywhere in the tree.

Given that, decisions below were made explicitly rather than inferred from
existing code, per the instruction to pick the simplest, safest, most
consistent option and document it.

## 2. Build location: repo root, not `web/`

The spec's default is `web/` alongside a Python backend. Since no backend or
monorepo convention exists here, and the repo root was already an (empty,
unused) Vite scaffold, the frontend was built **in place at the root** rather
than nested under `web/`. Nesting would have required either deleting the
existing scaffold (to avoid two competing `package.json`/`vite.config.ts`
pairs) or leaving it orphaned — both worse than building on what was already
there. If a Python backend is added later, standard practice is to move this
app under `apps/web` or `web/` at that point and update the root accordingly.

## 3. Package manager: npm, not pnpm

The spec's default preference is pnpm, but its own priority order is
"package manager already in use → `packageManager` field → pnpm." The
scaffold shipped with a `package-lock.json` (i.e., npm had already been used
to install it), so npm was kept. `package.json` pins
`"packageManager": "npm@11.16.0"`.

## 4. No real backend: contract-first + MSW mocks

No DevMate HTTP API exists. Per the task's own fallback path ("crie mocks
contratuais... documente lacunas"), this build:

- Authored `openapi/devmate.openapi.json` by hand, covering every endpoint
  listed in the task brief (projects, commits, files, decisions, questions,
  threads, chat runs + SSE events, providers, speech/voices, reading
  sessions, diagnostics).
- Generated `src/lib/api/schema.d.ts` from it via `openapi-typescript`, and
  built `src/lib/api/client.ts` (a typed `openapi-fetch` client) against that
  schema — so every query/mutation in `src/features/*/api/queries.ts` is
  typed against the same contract the mocks implement.
- Implemented every one of those endpoints as an MSW handler
  (`src/mocks/handlers.ts`) with realistic, mutable in-memory state and
  fixtures (`src/mocks/fixtures.ts`) modeled on the task brief's own example
  (`acme-api`, `feature/auth`, commit `a17d3e1`, `docs/auth.md`).
- The `/runs/{runId}/events` SSE endpoint is a **real** `text/event-stream`
  response built from a `ReadableStream` (`src/mocks/streaming.ts`), so the
  browser's native `EventSource` — the same one that will talk to a real
  backend — genuinely streams deltas, tool activity, and citations, and
  responds to cancellation. Nothing about the chat streaming code is aware
  it's talking to a mock.
- Did **not** implement a FastAPI layer over invented application services.
  The task brief allows this ("desde que... não replique regras"), but there
  are no real application services in this repo to call — a hand-written
  FastAPI layer here would just be a second, disconnected implementation of
  business rules that belongs in the (nonexistent) Python backend, which is
  explicitly against the task's own constraints on the frontend not
  duplicating backend logic.

**What a real backend integration needs to do**: implement the same paths/
schemas as `openapi/devmate.openapi.json`, in particular the SSE frame shape
for `RunEvent` (`src/features/chat/streaming/types.ts`) and the `/reading-sessions/.../segments/{index}/audio` binary audio endpoint (currently
mocked with a generated sine-tone WAV in `src/mocks/audio.ts`). Then flip
`VITE_ENABLE_MOCKS=false`.

## 5. Environment files

- `.env.example` — documents public config, no secrets.
- `.env.development` (committed) — sets `VITE_ENABLE_MOCKS=true` as the
  local dev default, since there's no backend to develop against otherwise.
  Playwright's `webServer` just runs `npm run dev`, so this file is also
  what makes `npm run test:e2e` self-contained.
- `.env.test` (committed) — sets an **absolute** `VITE_DEVMATE_API_BASE_URL`
  (`http://localhost/api/v1`). Vitest runs under Node, not a browser, so
  there's no page origin for the API client's relative `fetch("/api/v1/...")`
  calls to resolve against; MSW's node server matches on the same absolute
  base. See `src/lib/api/client.ts`'s comment on why the client re-reads
  `globalThis.fetch` per call instead of capturing it once — the same root
  cause (module-load-time singleton vs. MSW's interceptor timing) needed a
  real code fix, not just a test workaround.

## 6. Known gaps / deferred work

- **Decision/question-kind citations don't navigate.** `SourceReference.kind`
  includes `"decision"` and `"question"` in the contract, but the schema has
  no field identifying _which_ decision/question a citation of that kind
  points to (only document-shaped fields: path/commitHash/line range).
  `SourceCitation` currently only resolves `document`/`document_diff`/`code`
  kinds to a file-viewer target (see `resolveFileViewerTarget`); citations of
  the other two kinds render as inert rather than guessing a target. Fixing
  this needs a contract change (e.g., a `targetId` field) before the frontend
  can do more than that.
- **Diff view is unified only.** The context panel's diff-mode preference
  (`unified`/`split`) is stored and exposed in Settings → General, but only
  `unified` is actually implemented in `DiffViewer`.
- **Color-contrast (WCAG AA) was verified for light mode only**, via
  `@axe-core/playwright` against six real pages (see
  `tests/e2e/accessibility.spec.ts`), which is what caught and fixed two
  under-contrast badge colors (`--success`, `--warning` in
  `src/styles/tokens.css` — see that file's comment for the ratio math).
  Dark-mode tokens were adjusted by the same calculation but not
  independently re-verified with axe against a dark-themed page, since
  Playwright's default Chromium profile is light.
- **Playwright covers Chromium only** (`playwright.config.ts`), per the
  task's local-first/desktop-first framing rather than a full cross-browser
  matrix.
- **No real LLM/TTS provider is wired up** — `anthropic`/`ollama`/`openai`
  and `openai-tts`/`piper-local` are fixture data illustrating the
  local-vs-remote / configured-vs-missing-credentials states the UI must
  render, not live integrations.

## 7. Notable bugs this build's own testing caught and fixed

Left here because they're the kind of thing worth knowing about the codebase,
not because they're still open:

- `apiClient` is a module-level singleton created via `openapi-fetch`, which
  defaults to capturing `globalThis.fetch` **once**, at creation time. Under
  Vitest, that happens before MSW's node interceptor patches the global,
  so every request silently hit the real network. Fixed by passing
  `fetch: (...args) => globalThis.fetch(...args)` so the client re-reads the
  global per call — this also makes it robust to any other tool that patches
  `fetch` after module load.
- The chat run reducer's initial state used `"connecting"` as its default
  status, meant to represent "waiting for the first SSE event" — but that
  value was also the state before the user had sent anything at all, which
  made the composer's `readOnly={isRunning}` lock the textarea from first
  paint. Fixed by adding a distinct `"idle"` status for "no run yet."
- The composer disabled the `<textarea>` outright while a run was in
  flight, which also blocks focus/keydown — silently breaking the
  documented Escape-to-cancel shortcut. Fixed by using `readOnly` instead of
  `disabled` during a run, so the shortcut keeps working.
- `CommitTimeline` and the voice list rendered non-`<li>` children directly
  inside a `<ul>` (virtualized row wrappers, and a card component nested a
  second `<li>` inside a parent one) — both are real WCAG list-structure
  violations, not just Playwright noise; fixed by moving the semantics to
  the actual outermost element in each case.
