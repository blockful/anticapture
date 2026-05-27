#!/usr/bin/env bash
set -euo pipefail

PG_BIN="$(dirname "$(ls /usr/lib/postgresql/*/bin/postgres | head -n1)")"
export PATH="$PG_BIN:$PATH"

: "${PGDATA:=/var/lib/postgresql/data}"
: "${ENVIO_PG_HOST:=127.0.0.1}"
: "${ENVIO_PG_PORT:=5432}"
: "${ENVIO_PG_USER:=postgres}"
: "${ENVIO_PG_PASSWORD:=postgres}"
: "${ENVIO_PG_DATABASE:=envio}"
: "${ENVIO_PG_SSL_MODE:=disable}"

mkdir -p "$PGDATA"
chown -R postgres:postgres "$PGDATA"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[bundled] Initialising Postgres data dir at $PGDATA"
  su postgres -c "initdb -D $PGDATA --auth=trust --username=$ENVIO_PG_USER"
  echo "listen_addresses = '127.0.0.1'" >>"$PGDATA/postgresql.conf"
  echo "shared_buffers = 512MB"        >>"$PGDATA/postgresql.conf"
  echo "synchronous_commit = off"      >>"$PGDATA/postgresql.conf"
  echo "fsync = off"                   >>"$PGDATA/postgresql.conf"
  echo "full_page_writes = off"        >>"$PGDATA/postgresql.conf"
fi

echo "[bundled] Starting Postgres on 127.0.0.1:$ENVIO_PG_PORT"
su postgres -c "pg_ctl -D $PGDATA -l /tmp/postgres.log -w start"

until pg_isready -h 127.0.0.1 -p "$ENVIO_PG_PORT" -U "$ENVIO_PG_USER" >/dev/null 2>&1; do
  sleep 1
done

if ! su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname = '$ENVIO_PG_DATABASE'\"" | grep -q 1; then
  echo "[bundled] Creating database $ENVIO_PG_DATABASE"
  su postgres -c "createdb $ENVIO_PG_DATABASE"
fi

shutdown_pg() {
  echo "[bundled] Stopping Postgres"
  su postgres -c "pg_ctl -D $PGDATA -m fast stop" || true
}
trap shutdown_pg EXIT INT TERM

echo "[bundled] Starting envio"
exec npm run start
