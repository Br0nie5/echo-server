#!/bin/sh

export NODE_ENV="production"

# Set defaults only if not already defined in the environment
export SERVER_NAME="${SERVER_NAME:-Docker Production}"

export HTTP_PORT="${HTTP_PORT:-4000}"

export SERVER_URL="${SERVER_URL:-http://localhost:${HTTP_PORT}}"

export HAS_AUTHENTICATION="${HAS_AUTHENTICATION:-true}"

export LOGS_DIR_PATH="${LOGS_DIR_PATH:-/watched_logs}"

export LOGS_CRON_SCHEDULE_REGEX="${LOGS_CRON_SCHEDULE_REGEX:-*/30 * * * *}"
export LOGS_CRON_WATCHED_LOGS_CATEGORIES="${LOGS_CRON_WATCHED_LOGS_CATEGORIES:-ERROR,WARNING}"
export LOGS_CRON_TELEGRAM_CHAT_ID="${LOGS_CRON_TELEGRAM_CHAT_ID:-}"
export LOGS_CRON_TELEGRAM_BASE_URL="${LOGS_CRON_TELEGRAM_BASE_URL:-}"

# Optional: mount a cert/key into the container and set these to serve over HTTPS
export TLS_CERT_PATH="${TLS_CERT_PATH:-}"
export TLS_KEY_PATH="${TLS_KEY_PATH:-}"

mkdir -p "$LOGS_DIR_PATH"

# Generate env.json files
write_env_json() {
  cat > "$1" <<EOF
{
  "SERVER_NAME": "${SERVER_NAME}",
  "SERVER_URL": "${SERVER_URL}",
  "HAS_AUTHENTICATION": "${HAS_AUTHENTICATION}"
}
EOF
}

ENV_FILE="/app/echo_frontend/dist/env.production.json"

touch "$ENV_FILE"
write_env_json "$ENV_FILE"

exec "$@"