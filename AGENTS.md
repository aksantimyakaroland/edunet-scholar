# Edunet Scholar — AGENTS.md

## Commands
- `npm run dev` — start dev (turbo)
- `npm run build` — full build (turbo, includes typecheck via Next.js)
- `npm run lint` — turbo lint (ESLint)
- `npm run format` — Prettier all `*.{ts,tsx,md}`
- `npm install` at root (npm workspaces, don't cd into apps/web)

## Architecture
- **Monorepo** (npm workspaces): `apps/web` (Next.js 16 App Router) + `packages/*`
- Route groups: `(auth)/` (login, register), `(dashboard)/` (educhat, edubook, eduplan)
- `proxy.ts` (Next.js 16, replaces middleware) — route protection via Supabase Auth
- Pages are server components; interactive parts use `"use client"` components
- State: Zustand stores in `stores/`; hooks in `hooks/`

## Packages
| Package | Entry | Purpose |
|---|---|---|
| `@edunet/database` | `packages/database/src/index.ts` | Supabase client + typed DB schema |
| `@edunet/ai` | `packages/ai/src/index.ts` | Gemma API client (model `gemma-4-31b-it`) |
| `@edunet/shared` | `packages/shared/src/index.ts` | Routes, module defs, constants |

- Import workspace packages as `@edunet/*` (resolved via npm workspaces + `transpilePackages` in `next.config.ts`)
- Import within `apps/web` as `@/` → `src/`

## Design System
- **Skill**: `frontend-design` (`.agents/skills/frontend-design/`, loaded via `skill` tool)
- Token palette defined in `globals.css` (CSS custom properties, Tailwind v4 via `@import "tailwindcss"`)
- Fonts: `DM Sans` (headings), `Inter` (body), `JetBrains Mono` (code) — loaded via `@fontsource/*` in root layout
- `shadcn/ui` components in `@/components/ui/` (uses `@base-ui/react`, not Radix — no `asChild` prop)
- Accent: `#5B5BD6` (violet-blue); sidebar: dark navy `#1A1C2E`

## Key Modules
| Route | Entry Component | Hook |
|---|---|---|
| `/educhat` | `ChatInterface` | `use-chat` (streaming, abort) |
| `/edubook` | `EduBookPanel` | `use-documents` |
| `/eduplan` | `EduPlanPanel` | `use-tasks`, `use-goals` |

- Chat API: `POST /api/chat` (SSE stream via `@edunet/ai` GemmaClient)
- Current hooks use local state (not persisted to Supabase yet)

## Env Vars (required)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMMA_API_KEY
```
Copy from `envkeys` or configure in Vercel dashboard.

## DB Migrations
- `supabase/migrations/001_schema.sql` — 6 tables (workspaces, documents, chat_sessions, messages, tasks, goals) + RLS policies + autoupdate triggers
- Apply via Supabase SQL Editor (not automated yet)

## Quirks / Gotchas
- Next.js 16: use `proxy.ts` (not `middleware.ts`) with exported `proxy` function
- `shadcn/ui` v4: components use `@base-ui/react`, not Radix. `asChild` does not exist; pass `className` directly to the trigger component
- `.env` at root is gitignored; `.env.local.example` has placeholder values. Real keys live in `envkeys` (also gitignored)
- Tailwind v4: uses `@import "tailwindcss"` not `@tailwind` directives; config in `globals.css` `@theme` block
