#!/bin/bash

# Builds the Echo image and runs it locally for manual testing (TLS and self logs enabled).
#
# Usage: npm run start:docker

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

SCRIPT_PATH=$(realpath "$0")
ROOT_DIR="$(dirname "$SCRIPT_PATH")/.."

cd "$ROOT_DIR"

npm run build:docker

# Self logs need a writable /watched_logs/server. Docker can't create a mount point nested inside an
# already read-only mount, so that directory must exist in the read-only source beforehand.
mkdir -p ./test_logs/server

docker run \
  --name echo \
  -p 4000:4000 \
  -e SERVER_NAME="Echo" \
  -e SERVER_URL="https://localhost:4000" \
  -e TLS_CERT_PATH=/certs/localhost-cert.pem \
  -e TLS_KEY_PATH=/certs/localhost-key.pem \
  -e SELF_LOGS_ENABLED=true \
  -v ./test_logs:/watched_logs:ro \
  -v ./self_logs:/watched_logs/server \
  -v ./data:/app/data \
  -v ./certs:/certs:ro \
  echo
