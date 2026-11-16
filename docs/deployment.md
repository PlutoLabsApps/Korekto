# Deploying Korekto to Hetzner

The deployment uses GitHub Actions, GitHub Container Registry (GHCR), Docker Compose, and Caddy. CI must pass on `main` before the automatic deployment starts. Caddy obtains and renews the HTTPS certificate; the Nuxt container is not exposed publicly.

## Architecture

- GitHub Actions runs formatting, linting, type checking, tests, a production build, and a critical-vulnerability audit.
- The release job builds `linux/amd64` and `linux/arm64` images and pushes `ghcr.io/plutolabsapps/korekto:<full-commit-sha>` plus `latest`.
- The server keeps its configuration in `/opt/korekto/.env` and runs `compose.yaml` with `compose.prod.yaml`.
- Caddy listens on ports 80 and 443 and proxies requests to `app:3000` over the private Compose network.
- The deployment checks `https://<APP_DOMAIN>/api/health` and fails if it does not return `{ "status": "ok" }`.

## 1. Prepare DNS and the server

Use a current Ubuntu LTS server on Hetzner. Create a DNS `A` record for your domain pointing to the server. Add an `AAAA` record only if IPv6 is correctly configured.

Allow inbound TCP ports 22, 80, and 443, plus UDP 443 for HTTP/3, in the Hetzner firewall. Keep SSH restricted to trusted addresses where practical.

Install Docker Engine and the Compose plugin by following the [official Docker Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Use Docker Compose 2.24.4 or newer because the production override uses `!reset` and `!override` to remove local-only settings. Also install `curl` and `tar`.

Create a deployment user and application directory:

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
sudo install -d -o deploy -g deploy /opt/korekto
```

Membership in `docker` grants effective root access to the host. Use a dedicated user, protect its SSH key, and do not share it for general administration. Log in again as `deploy` and confirm `docker compose version` works without `sudo`.

Configure SSH key authentication for `deploy`. Disable password authentication after confirming that the key works.

## 2. Add GitHub repository secrets

Open **Settings → Secrets and variables → Actions → New repository secret**. Add these secrets:

| Secret                     | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| `ENV_FILE`                 | The complete multiline contents of the production `.env` file |
| `HETZNER_HOST`             | Server IP address or SSH hostname                             |
| `HETZNER_USERNAME`         | `deploy`                                                      |
| `HETZNER_SSH_KEY`          | Private SSH key for `deploy`, including its header and footer |
| `HETZNER_SSH_PORT`         | SSH port; optional, defaults to `22`                          |
| `HETZNER_HOST_FINGERPRINT` | SHA256 fingerprint of the server's ED25519 host key           |
| `GHCR_USERNAME`            | GitHub user or organization used to read GHCR                 |
| `GHCR_READ_TOKEN`          | GitHub token with `read:packages` for the GHCR image          |

Obtain the host fingerprint from a trusted network and verify it through a second channel before use:

```bash
ssh-keyscan -t ed25519 -p 22 YOUR_SERVER_IP 2>/dev/null | ssh-keygen -lf -
```

Copy the `SHA256:...` value. The workflow verifies this fingerprint instead of blindly trusting the SSH host.

For a private GHCR package, use a classic personal access token with `read:packages`. Restrict its lifetime and rotate it regularly. GitHub's temporary workflow token publishes the image; the separate token only lets the server pull it.

## 3. Create the production environment

Start with `.env.example`, without committing the result:

```dotenv
APP_IMAGE=ghcr.io/plutolabsapps/korekto:latest
APP_DOMAIN=korekto.example.com
ACME_EMAIL=admin@example.com

NUXT_PUBLIC_SITE_NAME=Korekto
NUXT_PUBLIC_SITE_URL=https://korekto.example.com
```

Replace the domain and email. `ACME_EMAIL` receives certificate notices from Let's Encrypt. Add future application secrets to this same multiline `ENV_FILE` secret; never put real values in `.env.example` or Git.

Each deployment replaces `APP_IMAGE` with the full commit SHA being released. Public Nuxt values are read at runtime, so rebuilding just to change them is unnecessary.

## 4. Run the first deployment

Push or merge the desired commit into `main`. In **Actions**, wait for **CI** and then **Deploy** to finish. The first start can take a few minutes while Caddy requests the certificate.

Verify:

```bash
curl -fsS https://korekto.example.com/api/health
```

Expected response:

```json
{ "status": "ok" }
```

For an intentional release outside the normal CI trigger, use **Actions → Deploy → Run workflow** on `main`. The `production` GitHub environment can also be configured with required reviewers for an additional approval gate.

## Updates, logs, and status

Normal updates require no server commands: merge to `main` and let CI/CD finish.

On the server:

```bash
cd /opt/korekto
docker compose -f compose.yaml -f compose.prod.yaml ps
docker compose -f compose.yaml -f compose.prod.yaml logs -f app
docker compose -f compose.yaml -f compose.prod.yaml logs -f caddy
```

Do not print `.env` in shared terminals or logs. Caddy certificates persist in the `korekto_caddy_data` volume.

## Rollback

Every release has an immutable full-SHA image tag. Find the previous commit in GitHub Actions or GHCR, then select it on the server:

```bash
cd /opt/korekto
sed -i 's|^APP_IMAGE=.*$|APP_IMAGE=ghcr.io/plutolabsapps/korekto:PREVIOUS_FULL_COMMIT_SHA|' .env
docker compose -f compose.yaml -f compose.prod.yaml pull app
docker compose -f compose.yaml -f compose.prod.yaml up -d
curl -fsS "https://$(sed -n 's/^APP_DOMAIN=//p' .env | tail -n 1)/api/health"
```

A later `main` deployment replaces `APP_IMAGE` again. This foundation has no database migrations. When migrations are added, a release is not safely reversible until its backward-compatible database rollback procedure is also documented.

## Rotate secrets

- **Application values:** update `ENV_FILE`; the next deployment replaces `/opt/korekto/.env` with mode `600`.
- **GHCR pull token:** create a replacement token, update `GHCR_READ_TOKEN`, deploy, verify the pull, then revoke the old token.
- **SSH key:** add the new public key to `deploy`'s `authorized_keys`, update `HETZNER_SSH_KEY`, run a manual deployment, then remove the old public key.
- **Host key changed:** verify the new fingerprint out of band before updating `HETZNER_HOST_FINGERPRINT`. Never bypass host verification to make a deployment pass.

## Troubleshooting

- **Certificate errors:** confirm DNS points to this server and ports 80/443 are reachable, then inspect Caddy logs.
- **Image pull denied:** check GHCR package permissions, `GHCR_USERNAME`, and the token's `read:packages` scope.
- **Health check timeout:** inspect both services with the commands above. The failed release remains visible in Actions with the last 100 log lines.
- **SSH fingerprint mismatch:** investigate the host identity first; update the secret only after confirming an intentional host-key change.
