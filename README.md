# DevMate — Web Frontend

A local-first web UI for DevMate, a repository-aware development assistant. This
repository currently contains **only the frontend** — see
[docs/web-api-gaps.md](docs/web-api-gaps.md) for why, and how the app runs without
a real backend today.

```
                         Application Services
                           ▲              ▲
                           │              │
                          CLI          HTTP API
                                           ▲
                                           │
                                    React Frontend  (this repo)
```

The frontend never talks to an LLM/TTS provider or the filesystem directly — every
action goes through `/api/v1/*`, proxied to a DevMate backend in development and
served same-origin in production.

## Stack

Vite · React 19 · TypeScript (strict) · TanStack Router · TanStack Query · Tailwind
CSS v4 · Base UI · Zod · React Hook Form · react-markdown (sanitized) · Shiki ·
openapi-fetch · Zustand · Vitest · Testing Library · MSW · Playwright.

## Getting started

```bash
npm install
npm run dev
```

Opens on `http://127.0.0.1:5173`. There is no real backend yet, so
`npm run dev` runs against **MSW mocks** by default — see `.env.development`.
Once a real backend exists, point `DEVMATE_API_PROXY_TARGET` at it and set
`VITE_ENABLE_MOCKS=false` in a local, gitignored `.env.development.local`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server (mocks on) |
| `npm run build` | Type-check and build for production |
| `npm run typecheck` | `tsc -b`, no emit |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm run test` / `test:run` | Vitest (watch / single run) |
| `npm run test:coverage` | Vitest with coverage |
| `npm run test:e2e` | Playwright against the dev server |
| `npm run api:generate` | Regenerate `src/lib/api/schema.d.ts` from `openapi/devmate.openapi.json` |
| `npm run check` | format:check → lint → typecheck → test:run → build (the full local gate) |

## Project layout

```
web root
├── openapi/devmate.openapi.json   contract the mocks and typed client are built from
├── src/
│   ├── app/                       router/query-client wiring, providers, theme sync
│   ├── routes/                    file-based routes (TanStack Router)
│   ├── features/                  one folder per domain: api, hooks, components, schemas
│   ├── components/                cross-feature UI (ui primitives, layout, feedback, navigation)
│   ├── lib/                       api client, security, formatting, highlighting, utils
│   ├── stores/                    Zustand — UI-only state (audio player, panel/theme prefs)
│   ├── mocks/                     MSW handlers, fixtures, SSE streaming simulation
│   └── test/                      Vitest setup, MSW node server
├── tests/e2e/                     Playwright specs
└── docs/web-api-gaps.md           backend-absence rationale, decisions, known gaps
```

See [docs/web-api-gaps.md](docs/web-api-gaps.md) for the full list of build-time
decisions (package manager, repo layout, contrast fixes, etc.) and their rationale.
