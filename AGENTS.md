# Edunet Scholar — AGENTS.md

## Commands
- `npm run dev` — start dev (turbo)
- `npm run build` — full build (turbo)
- `npm run lint` — turbo lint (ESLint)
- `npm run format` — Prettier all `*.{ts,tsx,md}`
- `npm install` at root (npm workspaces, don't cd into apps/web)

## Architecture
- **Monorepo** (npm workspaces): `apps/web` (Next.js 16 App Router) + `packages/*`
- Route groups: `(auth)/` (login, register), `(dashboard)/` (educhat, edubook, eduplan)
- `apps/web/src/proxy.ts` replaces `middleware.ts` — route protection via Supabase Auth
- Pages are server components; interactive parts use `"use client"` components
- State: Zustand stores in `stores/`; hooks in `hooks/` call stores + fetch
- `@tanstack/react-query` in deps but unused — no QueryClient in the app
- Import workspace packages as `@edunet/*` (resolved via npm workspaces + `transpilePackages` in `next.config.ts`)
- Import within `apps/web` as `@/` → `src/`

## Packages
| Package | Entry | Notes |
|---|---|---|
| `@edunet/database` | `packages/database/src/index.ts` | Supabase client + typed DB schema |
| `@edunet/ai` | `packages/ai/src/index.ts` | `GemmaClient` — hits Google AI Studio `v1beta` API with model `gemma-4-31b-it` |
| `@edunet/shared` | `packages/shared/src/index.ts` | Routes, module defs, constants (`ROUTES`, `MODULES`, `APP_NAME`) |

## Design System
- **Skill**: `frontend-design` (`.agents/skills/frontend-design/`, loaded via `skill` tool)
- Tailwind v4 via `@import "tailwindcss"` (not `@tailwind` directives) + `@import "tw-animate-css"` + `@import "shadcn/tailwind.css"` in `globals.css`
- Tokens: `@theme inline` block in `globals.css` (accent `#5B5BD6`, sidebar `#1A1C2E`)
- Fonts: `DM Sans` (headings), `Inter` (body), `JetBrains Mono` (code) — loaded via `@fontsource/*` in `layout.tsx`
- `shadcn/ui` v4 (`style: "base-nova"`) in `@/components/ui/` — uses `@base-ui/react`, **not** Radix. No `asChild` prop; pass `className` directly to trigger components
- PostCSS: `@tailwindcss/postcss` plugin (no `tailwind.config` file)

## Key Modules
| Route | Entry Component | Hook(s) |
|---|---|---|
| `/` | redirects to `/educhat` | — |
| `/educhat` | `ChatInterface` | `useChat` (streaming, abort, clear) |
| `/edubook` | `EduBookPanel` | `useDocuments` (list, upload, delete) |
| `/eduplan` | `EduPlanPanel` | `useTasks` (subjects, CRUD, reorder via dnd-kit) |

- Chat API: `POST /api/chat` — SSE stream via `GemmaClient.streamChat()` (Google AI Studio)
- All hooks use local state (no realtime, no persistence to Supabase beyond API calls)
- DB has a `goals` table but no UI or hook for it yet

## Env Vars (required)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMMA_API_KEY
```
Copy from `envkeys` (gitignored) or configure in Vercel dashboard.

## DB Migrations
- 2 files in `supabase/migrations/`: `001_schema.sql` (6 tables: workspaces, documents, chat_sessions, messages, tasks, goals) + `003_eduplan.sql` (subjects table + task columns like `parent_id`, `subject_id`, `sort_order`, `estimated_hours`). No migration `002`.
- Apply via Supabase SQL Editor (no CLI config, no `supabase/config.toml`).
- `@edunet/database` types in `packages/database/src/types.ts` are **out of sync**: no `Subject` type, no `parent_id`/`subject_id`/`sort_order`/`estimated_hours` on `Task`.

## Quirks / Gotchas
- Next.js 16: use `proxy.ts` (not `middleware.ts`) with exported `proxy` function and `config.matcher`
- `shadcn/ui` v4 `@base-ui/react`: no `asChild` prop. Pass `className` directly to the trigger component
- Supabase SSR helpers at `@/lib/supabase/server.ts` (Server Component) and `@/lib/supabase/client.ts` (browser)
- `.env` at root is gitignored; `.env.local.example` has placeholder values. Real keys in `envkeys` (also gitignored)
- `@edunet/database` exports two helpers: `createServerClient` (service/client key, no session persistence) and `createBrowserClient` (anon key, with persistence)
