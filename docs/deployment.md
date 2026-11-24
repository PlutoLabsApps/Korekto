# Deploying Korekto to Hetzner

The deployment uses GitHub Actions, GitHub Container Registry (GHCR), OpenSSH, and Docker Compose. It manages the Korekto application container and its PostgreSQL database container. Public request handling is managed outside this repository.

## Architecture

- GitHub Actions runs formatting, linting, type checking, tests, a production build, and a critical-vulnerability audit.
- The release job builds `linux/amd64` and `linux/arm64` images and pushes `ghcr.io/plutolabsapps/korekto:<full-commit-sha>` plus `latest`.
- The server keeps its configuration in `/opt/korekto/.env` and runs `compose.yaml` with `compose.prod.yaml`.
- The application container listens on `127.0.0.1:3000` by default. Set `APP_PORT` to change the host port.
- PostgreSQL runs in the `db` container with data in the `korekto_db-data` volume. It publishes no ports. See [the database guide](database.md).
- The app applies pending database migrations on startup and exits if they fail.
- The deployment checks `http://127.0.0.1:<APP_PORT>/api/health` and fails if it does not return `{ "status": "ok" }`. The endpoint returns 503 when the database is unreachable.

## 1. Prepare the server

Use a current Ubuntu LTS server on Hetzner. Install Docker Engine and the Compose plugin by following the [official Docker Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Use Docker Compose 2.24.4 or newer because the production override uses `!reset`. Also install `curl` and `tar`.

Create a deployment user and application directory:

```bash
sudo adduser korekto
sudo usermod -aG docker korekto
sudo install -d -o korekto -g korekto /opt/korekto
```

Membership in `docker` grants effective root access to the host. Use a dedicated user, protect its SSH key, and do not share it for general administration. Log in again as `korekto` and confirm `docker compose version` works without `sudo`.

Configure SSH key authentication for `korekto`. Disable password authentication after confirming that the key works.

## 2. Add GitHub repository secrets

Open **Settings → Secrets and variables → Actions → New repository secret**. Add these secrets:

| Secret                     | Value                                                          |
| -------------------------- | -------------------------------------------------------------- |
| `ENV_FILE`                 | The complete multiline contents of the production `.env` file  |
| `HETZNER_HOST`             | Server IP address or SSH hostname                              |
| `HETZNER_USERNAME`         | `korekto`                                                      |
| `HETZNER_SSH_KEY`          | Private SSH key for `korekto`, including its header and footer |
| `HETZNER_SSH_PORT`         | SSH port; optional, defaults to `22`                           |
| `HETZNER_HOST_FINGERPRINT` | SHA256 fingerprint of the server's Ed25519 host key            |
| `GHCR_USERNAME`            | GitHub user or organization used to read GHCR                  |
| `GHCR_READ_TOKEN`          | GitHub token with `read:packages` for the GHCR image           |

The workflow configures OpenSSH with `HostKeyAlgorithms=ssh-ed25519` and a pinned `known_hosts` entry. Through an already verified SSH session on the server, print the Ed25519 host public-key fingerprint:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub | cut -d ' ' -f2
```

Copy the complete `SHA256:...` value into `HETZNER_HOST_FINGERPRINT`. You can independently confirm the same network key with `ssh-keyscan -t ed25519 -p 22 YOUR_SERVER_IP 2>/dev/null | ssh-keygen -lf -`. The workflow rejects a mismatched fingerprint and will not negotiate ECDSA or RSA host keys.

For a private GHCR package, use a classic personal access token with `read:packages`. Restrict its lifetime and rotate it regularly. GitHub's temporary workflow token publishes the image; the separate token only lets the server pull it.

## 3. Create the production environment

Start with `.env.example`, without committing the result:

```dotenv
APP_IMAGE=ghcr.io/plutolabsapps/korekto:latest
APP_PORT=3000

NUXT_PUBLIC_SITE_NAME=Korekto
NUXT_PUBLIC_SITE_URL=https://korekto.plutolabs.app
NUXT_LOG_LEVEL=info

POSTGRES_PASSWORD=replace-with-openssl-rand-hex-32

NUXT_OBJECT_STORAGE_ENDPOINT=https://fsn1.your-objectstorage.com
NUXT_OBJECT_STORAGE_REGION=fsn1
NUXT_OBJECT_STORAGE_BUCKET=replace-with-your-bucket-name
NUXT_OBJECT_STORAGE_ACCESS_KEY_ID=replace-with-your-access-key
NUXT_OBJECT_STORAGE_SECRET_ACCESS_KEY=replace-with-your-secret-key
```

`POSTGRES_PASSWORD` is required; Compose refuses to start without it. Generate it with `openssl rand -hex 32`. `POSTGRES_USER` and `POSTGRES_DB` default to `korekto`, and Compose builds the app's database URL from these values, so `NUXT_DATABASE_URL` and `DB_PORT` are not needed in production.

All five `NUXT_OBJECT_STORAGE_*` values are required before using file storage. See [the Object Storage guide](object-storage.md) for bucket setup, credential handling, and the complete environment contract. Add these private values to the same multiline `ENV_FILE` secret; never put real values in `.env.example` or Git. Each deployment replaces `APP_IMAGE` with the full commit SHA being released. Public Nuxt values and private Object Storage settings are read at runtime.

## 4. Run the first deployment

Push or merge the desired commit into `main`. In **Actions**, wait for **CI** and then **Deploy** to finish.

Verify on the server:

```bash
curl -fsS http://127.0.0.1:3000/api/health
```

Expected response:

```json
{ "status": "ok", "database": "ok" }
```

For an intentional release outside the normal CI trigger, use **Actions → Deploy → Run workflow** on `main`. The `production` GitHub environment can also be configured with required reviewers for an additional approval gate.

## Updates, logs, and status

Normal updates require no server commands: merge to `main` and let CI/CD finish.

On the server:

```bash
cd /opt/korekto
docker compose -f compose.yaml -f compose.prod.yaml ps
docker compose -f compose.yaml -f compose.prod.yaml logs -f app db
```

The log level is set by `NUXT_LOG_LEVEL` in `ENV_FILE`. A failed deployment prints the last 100 lines of `app` and `db` logs in the Actions run.

Do not print `.env` in shared terminals or logs.

## Rollback

Every release has an immutable full-SHA image tag. Find the previous commit in GitHub Actions or GHCR, then select it on the server:

```bash
cd /opt/korekto
sed -i 's|^APP_IMAGE=.*$|APP_IMAGE=ghcr.io/plutolabsapps/korekto:PREVIOUS_FULL_COMMIT_SHA|' .env
docker compose -f compose.yaml -f compose.prod.yaml pull app
docker compose -f compose.yaml -f compose.prod.yaml up -d
curl -fsS "http://127.0.0.1:$(sed -n 's/^APP_PORT=//p' .env | tail -n 1)/api/health"
```

If `APP_PORT` is omitted, use port `3000` in the verification command. A later `main` deployment replaces `APP_IMAGE` again.

Rolling back the image does not roll back database migrations. It is safe when the migrations added since the previous release are additive. If a release dropped or renamed columns, restore a backup taken before it instead (see [the database guide](database.md#production)), and take a backup before deploying such changes.

## Rotate secrets

- **Application values:** update `ENV_FILE`; the next deployment replaces `/opt/korekto/.env` with mode `600`.
- **Database password:** Postgres keeps the password it was created with, so changing `ENV_FILE` alone breaks the connection. First change it in the database, then update `POSTGRES_PASSWORD` in `ENV_FILE` and deploy:

  ```bash
  cd /opt/korekto
  docker compose -f compose.yaml -f compose.prod.yaml exec db psql -U korekto -d korekto -c "ALTER USER korekto PASSWORD 'NEW_PASSWORD';"
  ```

- **GHCR pull token:** create a replacement token, update `GHCR_READ_TOKEN`, deploy, verify the pull, then revoke the old token.
- **SSH key:** add the new public key to `korekto`'s `authorized_keys`, update `HETZNER_SSH_KEY`, run a manual deployment, then remove the old public key.
- **Host key changed:** verify the new fingerprint out of band before updating `HETZNER_HOST_FINGERPRINT`. Never bypass host verification to make a deployment pass.

## Troubleshooting

- **Application port already in use:** identify the owner with `sudo ss -ltnp '( sport = :3000 )'` and `docker ps --filter publish=3000`. Stop or reconfigure only a service you have confirmed is no longer needed, or set a different `APP_PORT`.
- **Image pull denied:** check GHCR package permissions, `GHCR_USERNAME`, and the token's `read:packages` scope.
- **Health check timeout:** inspect `docker compose -f compose.yaml -f compose.prod.yaml logs app db`. `Migrations failed` or a 503 from `/api/health` points to the database. Confirm that `APP_PORT` in `.env` matches the port used by the health check.
- **SSH fingerprint mismatch:** investigate the host identity first; update the secret only after confirming an intentional host-key change.
