# Korekto

Korekto is a Nuxt application for AI-assisted assessment with mandatory teacher review. This repository currently contains the application foundation and deployment stack; the product workflow is being delivered according to the iteration roadmap.

## Local development

Requirements: Node.js 22.22.3+ (or another version allowed by `package.json`) and npm.

```bash
cp .env.example .env
npm ci
docker compose up -d db
npm run dev
```

Open http://localhost:3000.

## Database

PostgreSQL runs in Docker and is accessed through Drizzle ORM with `useDb()` from `server/utils/db.ts`. Migrations are applied automatically when the server starts. See [the database guide](docs/database.md) for schema changes, migrations, configuration, logs, and backups.

## File storage

All application files, including images, PDFs, submissions, attachments, and exports, must be stored in Hetzner Object Storage rather than on local or container disk. Server features must use the abstraction in `server/utils/object-storage.ts`.

Fill in the five `NUXT_OBJECT_STORAGE_*` variables in `.env` before using a file-backed feature. See [the Object Storage guide](docs/object-storage.md) for private bucket creation, credentials, local and production setup, usage examples, and the mandatory storage rules for contributors and AI agents.

## Quality checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Use `npm run format` to format files and `npm run test:watch` while developing.

## Docker

Run the application locally in Docker:

```bash
docker compose up --build
```

The application is available at http://localhost:3000 and the readiness endpoint at http://localhost:3000/api/health. Stop it with `docker compose down`.

The production override runs only the application container on the host's loopback interface. See [the Hetzner deployment guide](docs/deployment.md) for server setup, repository secrets, releases, logs, rollback, and secret rotation.

## Contributing

Use short-lived feature branches such as `feature/class-management` and open a pull request into `main`. Keep changes focused and run all quality checks before requesting review. Main-branch deployments start only after CI succeeds.

The starter stack includes Nuxt 4, Vue, TypeScript, Tailwind CSS, Pinia, VueUse, Lucide (`@lucide/vue`), Zod, Nuxt Image, Vitest, ESLint, and Prettier. The database layer uses PostgreSQL with Drizzle ORM. The AI provider will be selected during its architecture task.
