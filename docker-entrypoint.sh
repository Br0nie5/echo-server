#!/bin/sh

set -eu

warn() {
  echo "$1" >&2
}

# Stops the container when the directory variable named $1, whose value is $2, is not the directory
# $3 the image creates for it.
refuse_if_not_image_directory() {
  if [ "${2%/}" != "$3" ]; then
    warn "$1 must not be set to \"$2\": the image creates \"$3\" for it, remove the variable and mount your volume there instead."
    exit 1
  fi
}

if [ "${NODE_ENV:-production}" != "production" ]; then
  warn "NODE_ENV shouldn't have been set to \"$NODE_ENV\", setting it back to \"production\"."
fi
export NODE_ENV="production"

refuse_if_not_image_directory LOGS_DIR_PATH "$LOGS_DIR_PATH" /watched_logs
refuse_if_not_image_directory SERVER_LOGS_DIR_PATH "$SERVER_LOGS_DIR_PATH" /server_logs

# Set defaults only if not already defined in the environment
export SERVER_NAME="${SERVER_NAME:-Echo}"

export HAS_AUTHENTICATION="${HAS_AUTHENTICATION:-true}"

export HAS_DOCUMENTATION_ROUTE="${HAS_DOCUMENTATION_ROUTE:-false}"

export SAVE_SELF_REPORTS_TO_FILE="${SAVE_SELF_REPORTS_TO_FILE:-false}"
export SELF_REPORTS_RETENTION_DAYS="${SELF_REPORTS_RETENTION_DAYS:-10}"

export LOGS_INITIAL_DATE_DAYS_AGO="${LOGS_INITIAL_DATE_DAYS_AGO:-2}"
export LOGS_MINIMAL_DATE_DAYS_AGO="${LOGS_MINIMAL_DATE_DAYS_AGO:-14}"

export LOGS_NOTIFIER_SCHEDULE="${LOGS_NOTIFIER_SCHEDULE:-*/30 * * * *}"
export LOGS_NOTIFIER_WATCHED_LOGS_LEVELS="${LOGS_NOTIFIER_WATCHED_LOGS_LEVELS:-ERROR,WARNING}"
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
