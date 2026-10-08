#!/bin/bash

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

# ── Variables ──────────────────────────────────────────────────────────────────

SCRIPT_PATH=$(realpath "$0")

SCRIPTS_DIR=$(dirname "$SCRIPT_PATH")

ROOT_DIR="$SCRIPTS_DIR/.."
BACKEND_DIR="$ROOT_DIR/echo_backend"

# ── Export ────────────────────────────────────────────────────────

run() {
    export NODE_ENV="production"
    set -a
    source "$BACKEND_DIR/.env.production"
    set +a

    # The export only boots the server to read its routes: TLS is useless here, and the cert paths in
    # .env.production are relative to echo_backend, so they would not resolve from this working directory.
    unset TLS_CERT_PATH TLS_KEY_PATH

    tsx $SCRIPTS_DIR/export_open_api.ts
}

# ── Entry point ───────────────────────────────────────────────────────────────

run
