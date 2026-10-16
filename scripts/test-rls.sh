#!/usr/bin/env bash
# Spins up a throwaway local Postgres cluster, applies auth stub + all migrations,
# and runs supabase/tests/rls.sql (cross-user isolation). Requires postgres binaries (brew postgresql@15+).
set -euo pipefail
export LC_ALL=C LANG=C
cd "$(dirname "$0")/.."
PGBIN="${PGBIN:-$(dirname "$(command -v initdb || echo /opt/homebrew/opt/postgresql@15/bin/initdb)")}"
DIR="$(mktemp -d)"; PORT="${PGPORT_TEST:-54329}"
cleanup() { "$PGBIN/pg_ctl" -D "$DIR/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT
"$PGBIN/initdb" -D "$DIR/data" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
"$PGBIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
PSQL=("$PGBIN/psql" -h "$DIR" -p "$PORT" -U postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -c "create database app" >/dev/null
PSQL+=(-d app)
"${PSQL[@]}" -f supabase/tests/auth_stub.sql
for f in supabase/migrations/*.sql; do echo "applying $f"; "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f supabase/tests/rls.sql
echo "RLS TESTS PASSED"
