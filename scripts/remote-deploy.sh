#!/usr/bin/env bash

set -Eeuo pipefail

run_id=${1:?Missing deployment run ID}
app_dir=/opt/korekto
archive="/tmp/korekto-$run_id.tar.gz"
env_file="/tmp/korekto-$run_id.env"
release_file="/tmp/korekto-$run_id.release"
script_file="/tmp/korekto-$run_id.deploy.sh"

trap 'rm -f "$archive" "$env_file" "$release_file" "$script_file"' EXIT

read_release_value() {
  local key=$1
  sed -n "s/^$key=//p" "$release_file" | tail -n 1
}

app_image=$(read_release_value APP_IMAGE)
ghcr_username=$(read_release_value GHCR_USERNAME)
ghcr_read_token=$(read_release_value GHCR_READ_TOKEN)
test -n "$app_image"
test -n "$ghcr_username"
test -n "$ghcr_read_token"

mkdir -p "$app_dir"
tar -xzf "$archive" -C "$app_dir"
mv "$env_file" "$app_dir/.env"
chmod 600 "$app_dir/.env"
cd "$app_dir"

if grep -q '^APP_IMAGE=' .env; then
  sed -i "s|^APP_IMAGE=.*$|APP_IMAGE=$app_image|" .env
else
  printf 'APP_IMAGE=%s\n' "$app_image" >> .env
fi

printf '%s' "$ghcr_read_token" | docker login ghcr.io --username "$ghcr_username" --password-stdin
docker compose -f compose.yaml -f compose.prod.yaml pull app
docker compose -f compose.yaml -f compose.prod.yaml up -d --remove-orphans
docker compose -f compose.yaml -f compose.prod.yaml ps

app_domain=$(sed -n 's/^APP_DOMAIN=//p' .env | tail -n 1)
test -n "$app_domain"
for ((attempt = 1; attempt <= 30; attempt++)); do
  if curl -fsS --max-time 10 "https://$app_domain/api/health" | grep -q '"status":"ok"'; then
    exit 0
  fi
  sleep 5
done

docker compose -f compose.yaml -f compose.prod.yaml logs --tail=100 app caddy
exit 1
