#!/bin/sh

set -eu

export NODE_ENV="production"

# Set defaults only if not already defined in the environment
export SERVER_NAME="${SERVER_NAME:-Docker Production}"

export SERVER_URL="${SERVER_URL:-http://localhost:${HTTP_PORT}}"

export HAS_AUTHENTICATION="${HAS_AUTHENTICATION:-true}"

export LOGS_INITIAL_DATE_DAYS_AGO="${LOGS_INITIAL_DATE_DAYS_AGO:-2}"
export LOGS_MINIMAL_DATE_DAYS_AGO="${LOGS_MINIMAL_DATE_DAYS_AGO:-14}"

export LOGS_NOTIFIER_SCHEDULE="${LOGS_NOTIFIER_SCHEDULE:-*/30 * * * *}"
export LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES="${LOGS_NOTIFIER_WATCHED_LOGS_CATEGORIES:-ERROR,WARNING}"
export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export LOGS_NOTIFIER_TIMEZONE="${LOGS_NOTIFIER_TIMEZONE:-UTC}"

# Optional: mount a cert/key into the container and set these to serve over HTTPS
export TLS_CERT_PATH="${TLS_CERT_PATH:-}"
export TLS_KEY_PATH="${TLS_KEY_PATH:-}"

# Node.js writes the runtime env of the frontend, so that a value holding a quote or a backslash
# still gives valid JSON.
node -e '
  const variableNames = [
    "SERVER_NAME",
    "HAS_AUTHENTICATION",
    "LOGS_INITIAL_DATE_DAYS_AGO",
    "LOGS_MINIMAL_DATE_DAYS_AGO"
  ]
  const frontendEnv = Object.fromEntries(variableNames.map((name) => [name, process.env[name]]))
  require("node:fs").writeFileSync(process.argv[1], JSON.stringify(frontendEnv, null, 2) + "\n")
' /app/echo_frontend/dist/env.production.json

exec "$@"
