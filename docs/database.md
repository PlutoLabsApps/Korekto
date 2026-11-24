# Database

PostgreSQL 18 runs as the `db` service in Docker Compose. The app talks to it through [Drizzle ORM](https://orm.drizzle.team/) and the `postgres` driver.

| Path                         | Purpose                                       |
| ---------------------------- | --------------------------------------------- |
| `server/db/schema.ts`        | Table definitions                             |
| `server/db/migrations/`      | Generated SQL migrations and schema snapshots |
| `server/utils/db.ts`         | `useDb()` connection pool                     |
| `server/utils/migrations.ts` | Applies migrations when the server starts     |
| `drizzle.config.ts`          | drizzle-kit configuration                     |

## Local setup

```bash
cp .env.example .env
docker compose up -d db
npm run dev
```

The server applies pending migrations on startup. Check `http://localhost:3000/api/health`; it returns `{"status":"ok","database":"ok"}` when the database is reachable.

If port 5432 is already taken, set `DB_PORT` (e.g. `5433`) and use the same port in `NUXT_DATABASE_URL`.

Useful commands:

```bash
docker compose ps                                     # db should be "healthy"
docker compose exec db psql -U korekto -d korekto     # SQL console
npm run db:studio                                     # browser UI at https://local.drizzle.studio
docker compose stop db                                # stop, keep data
docker compose down -v                                # delete containers and all local data
```

## Configuration

| Variable            | Default   | Notes                                                       |
| ------------------- | --------- | ----------------------------------------------------------- |
| `NUXT_DATABASE_URL` | none      | Used by `npm run dev` and drizzle-kit. Compose overrides it |
| `POSTGRES_USER`     | `korekto` |                                                             |
| `POSTGRES_PASSWORD` | `korekto` | Required in production                                      |
| `POSTGRES_DB`       | `korekto` |                                                             |
| `DB_PORT`           | `5432`    | Host port, local development only                           |
| `NUXT_LOG_LEVEL`    | `info`    | `silent`, `error`, `warn`, `info`, `debug`, `trace`         |

Inside Compose the app connects to `postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@db:5432/$POSTGRES_DB`. Use a hex password (`openssl rand -hex 32`) so it needs no URL escaping.

Postgres sets the user and password only when it creates an empty data volume. Changing `POSTGRES_PASSWORD` later does not change the existing password; see [Rotate the database password](deployment.md#rotate-secrets).

## Changing the schema

1. Edit `server/db/schema.ts`. Use camelCase property names; columns are stored as snake_case.
2. Run `npm run db:generate`. Review the generated SQL in `server/db/migrations/`.
3. Restart `npm run dev` (or run `npm run db:migrate`) to apply it locally.
4. Commit the schema change and the generated files in `server/db/migrations/` together.

Example:

```ts
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow().notNull(),
})
```

Querying:

```ts
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'

const user = await useDb().query.users.findFirst({ where: eq(users.email, email) })
```

Rules:

- Never edit or delete a migration that is already on `main`. Fix mistakes with a new migration.
- If two branches both add a migration, the second one to merge deletes its own unmerged migration, rebases on `main` and runs `npm run db:generate` again.
- When drizzle-kit asks whether a column was renamed or replaced, answer carefully. A wrong answer generates `DROP COLUMN`.
- Prefer additive changes (new tables, new nullable or defaulted columns). They keep older releases compatible for rollback.
- `drizzle-kit push` is for throwaway experiments only. It changes the database without creating a migration.

### Destructive migrations

CI runs `npm run db:check`, which fails when a migration contains `DROP TABLE`, `DROP COLUMN`, `DROP SCHEMA`, `DROP TYPE`, `DROP VIEW`, `RENAME COLUMN`, `RENAME TO`, `TRUNCATE`, `DELETE FROM` or `SET DATA TYPE`. To allow one intentionally, add a line with the reason at the top of that migration file:

```sql
-- allow-destructive: name replaced by full_name, data copied in 0004
ALTER TABLE "users" DROP COLUMN "name";
```

Take a backup before deploying it.

## Production

- The image contains `server/db/migrations/`. Each deployment starts the new app container, which applies pending migrations before serving requests.
- If migrations fail or `NUXT_DATABASE_URL` is missing, the process exits with code 1, the health check fails and the deployment stops. In development the error is only logged.
- The `db` container publishes no ports; only the app container can reach it on the Compose network.
- Data lives in the `korekto_db-data` Docker volume on the server and survives redeployments.

Manual backup and restore:

```bash
cd /opt/korekto
docker compose -f compose.yaml -f compose.prod.yaml exec -T db pg_dump -U korekto -d korekto > korekto.sql
docker compose -f compose.yaml -f compose.prod.yaml exec -T db psql -U korekto -d korekto < korekto.sql
```

Restore into an empty database. Do not copy the volume directory while Postgres is running.

## Logs

The server logs to stdout through `useLogger(tag)` from `server/utils/logger.ts`:

```ts
const log = useLogger('auth')
log.info('User registered', { userId })
log.error('Sending email failed', error)
```

Locally, logs appear in the `npm run dev` terminal. In Docker they are collected by Docker:

```bash
docker compose logs -f app      # locally
docker compose -f compose.yaml -f compose.prod.yaml logs -f app db   # on the server
```

Set `NUXT_LOG_LEVEL=debug` and restart the app for more detail.

## Troubleshooting

- **`Migrations failed` / health returns 503:** check that `db` is healthy (`docker compose ps`) and that `NUXT_DATABASE_URL` matches `POSTGRES_*` and `DB_PORT`.
- **`password authentication failed`:** the volume was created with a different password. Locally, run `docker compose down -v` to start fresh. In production, change the password as described in the deployment guide.
- **Port already in use:** another Postgres is running on the host. Set `DB_PORT` to a free port.
