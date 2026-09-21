#!/bin/bash

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

# ── Variables ──────────────────────────────────────────────────────────────────

SCRIPT_PATH=$(realpath "$0")

SCRIPTS_DIR=$(dirname "$SCRIPT_PATH")

ROOT_DIR="$SCRIPTS_DIR/.."
BACKEND_DIR="$ROOT_DIR/echo_backend"
UTILITIES_DIR="$ROOT_DIR/echo_utilities"

# ── Helpers ──────────────────────────────────────────────────────────────────

safe_mv() {
    mkdir -p "$(dirname "$2")"
    mv "$1" "$2"
}

fix_import() {
    # `-i.bak` is the only in-place form that works with both BSD (macOS) and GNU (CI) sed
    sed -i.bak "s|\./logCategory\(\.js\)\{0,1\}'|./logCategory.js'|g" "$1"
    rm "$1.bak"
}

# ── Clean / Move generated files ──────────────────────────────

remove_generated_files() {
    find "$1" -type d -name '__generated__' -exec rm -rf {} +
}

transfer_files() {
    "safe_mv"  "$ROOT_DIR/__generated__/types/echoError.ts"     "$UTILITIES_DIR/src/shared/types/__generated__/echoError.ts"

    "safe_mv"  "$ROOT_DIR/__generated__/types/logCategory.ts"   "$UTILITIES_DIR/src/modules/logs/types/__generated__/logCategory.ts"
    "safe_mv"  "$ROOT_DIR/__generated__/types/log.ts"           "$UTILITIES_DIR/src/modules/logs/types/__generated__/log.ts"
    fix_import "$UTILITIES_DIR/src/modules/logs/types/__generated__/log.ts"
    "safe_mv"  "$ROOT_DIR/__generated__/types/getLogsParams.ts" "$UTILITIES_DIR/src/modules/logs/types/__generated__/getLogsParams.ts"
    fix_import "$UTILITIES_DIR/src/modules/logs/types/__generated__/getLogsParams.ts"

    "safe_mv" "$ROOT_DIR/__generated__/types/authToken.ts"     "$UTILITIES_DIR/src/modules/auth/types/__generated__/authToken.ts"
    "safe_mv" "$ROOT_DIR/__generated__/types/loginRequest.ts"  "$UTILITIES_DIR/src/modules/auth/types/__generated__/loginRequest.ts"
    "safe_mv" "$ROOT_DIR/__generated__/types/signUpRequest.ts"  "$UTILITIES_DIR/src/modules/auth/types/__generated__/signUpRequest.ts"
}

# ── Full pipeline ─────────────────────────────────────────────────

run() {
    export NODE_ENV="production"
    set -a
    source "$BACKEND_DIR/.env.production"
    set +a

    # The export only boots the server to read its routes: TLS is useless here, and the cert paths in
    # .env.production are relative to echo_backend, so they would not resolve from this working directory.
    unset TLS_CERT_PATH TLS_KEY_PATH

    tsx $SCRIPTS_DIR/export_open_api.ts

    remove_generated_files "$UTILITIES_DIR/src"

    npx orval

    transfer_files

    rm -rf "$ROOT_DIR/__generated__/"

    npm run lint --workspace=@echo/utilities
    npm run format --workspace=@echo/utilities
    npm run build --workspace=@echo/utilities
}

# ── Entry point ───────────────────────────────────────────────────────────────

run
