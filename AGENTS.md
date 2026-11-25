# Korekto

Nuxt 4 app for AI-assisted grading with mandatory teacher review. TypeScript (strict), Vue 3, Tailwind 4, PostgreSQL + Drizzle, nuxt-auth-utils, @nuxtjs/i18n (cs, en), Zod, Vitest.

## Commands

```bash
docker compose up -d db   # local PostgreSQL
npm run dev               # http://localhost:3000, applies pending migrations on startup
```

Run before every PR (CI runs the same):

```bash
npm run format:check && npm run lint && npm run db:check && npm run typecheck && npm run test && npm run build
```

Database: `npm run db:generate` (create a migration from the schema), `npm run db:migrate`, `npm run db:studio`.

## Structure

- `app/`: pages, components, middleware (frontend; everything here ships to the browser)
- `server/api/`: endpoints; the file name sets the route (`auth/login.post.ts` → `POST /api/auth/login`)
- `server/utils/`: server helpers, auto-imported in `server/`
- `server/db/schema.ts`: all tables; `server/db/migrations/`: generated migrations
- `shared/`: code used by both `app/` and `server/` (constants, Zod schemas, types)
- `i18n/locales/`: `cs.json` and `en.json`
- `docs/`: database, deployment and object storage guides

## Rules

- **Shared values:** limits, enums and Zod schemas used by both UI and API live in `shared/utils/` as the single source of truth. Never put secrets or database code in `shared/`.
- **Text:** never hardcode user-facing text. Add the key to both `cs.json` and `en.json`; a test fails if the files differ. Zod schemas and API errors use message keys (`validation.*`, `errors.*`), which the frontend translates.
- **Endpoints:** validate input with `readValidatedJson(event, schema)`. Protect with `requireUser(event)` or `requireRole(event, 'teacher' | 'student')`. Return users only through `toPublicUser` and never return `passwordHash`.
- **Permissions:** check them on the server. Hiding UI is not access control.
- **Database:** change `server/db/schema.ts`, run `npm run db:generate`, review the SQL, and commit it together with the schema. Never edit a migration that is already on `main`. Destructive statements need `-- allow-destructive: <reason>` at the top of the migration. See `docs/database.md`.
- **Files:** store every application file in Hetzner Object Storage through `server/utils/object-storage.ts`, never on local disk. See `docs/object-storage.md`.
- **Logging:** use `useLogger(tag)`. Never log passwords, tokens or personal data beyond IDs.
- **Config:** add new environment variables to `.env.example`, `nuxt.config.ts` `runtimeConfig` and the relevant doc. Secrets never go in Git.
- **Comments:** keep them minimal. Add one short line only where something is non-obvious.

## Git

- Short-lived branches (`feature/<name>`), pull requests into `main`.
- Conventional commits: `feat(auth): …`, `fix: …`, `docs(db): …`, `test: …`, `ci: …`.
- Keep commits focused. All checks must pass before requesting review.
