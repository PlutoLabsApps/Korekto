# Korekto

Korekto is a Nuxt application for AI-assisted assessment with mandatory teacher review. This repository currently contains the application foundation and deployment stack; the product workflow is being delivered according to the iteration roadmap.

## Local development

Requirements: Node.js 22.22.3+ (or another version allowed by `package.json`) and npm.

```bash
cp .env.example .env
npm ci
npm run dev
```

Open http://localhost:3000.

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

The production override adds Caddy, automatic HTTPS, persistent certificate volumes, and a private application network. See [the Hetzner deployment guide](docs/deployment.md) for server setup, repository secrets, releases, logs, rollback, and secret rotation.

## Contributing

Use short-lived feature branches such as `feature/class-management` and open a pull request into `main`. Keep changes focused and run all quality checks before requesting review. Main-branch deployments start only after CI succeeds.

The starter stack includes Nuxt 4, Vue, TypeScript, Tailwind CSS, Pinia, VueUse, Lucide (`@lucide/vue`), Zod, Nuxt Image, Vitest, ESLint, and Prettier. Product integrations such as the database and AI provider will be selected during their architecture tasks rather than being fixed by this scaffold.
