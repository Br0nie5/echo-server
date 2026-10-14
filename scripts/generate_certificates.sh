#!/bin/bash

# Creates the self-signed test certificate of certs/, at the root of the repository, valid for
# testing.cc, its subdomains and localhost, for a hundred years. It replaces the previous one. The
# deployments of examples/ serve HTTPS with it, and so can a server started with npm start.
#
# Usage: npm run certs:generate
#
# Never use it outside local testing: its private key is committed to this repository.

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

SCRIPT_PATH=$(realpath "$0")
CERTS_DIR="$(dirname "$SCRIPT_PATH")/../certs"
CERTIFICATE_FILE="$CERTS_DIR/testing.cc-cert.pem"
KEY_FILE="$CERTS_DIR/testing.cc-key.pem"
VALIDITY_DAYS=36500

mkdir -p "$CERTS_DIR"

openssl req -x509 -newkey rsa:2048 -nodes \
  -days "$VALIDITY_DAYS" \
  -subj "/CN=testing.cc" \
  -addext "subjectAltName=DNS:testing.cc,DNS:*.testing.cc,DNS:localhost,IP:127.0.0.1" \
  -keyout "$KEY_FILE" \
  -out "$CERTIFICATE_FILE"

# openssl leaves the key to its owner alone, while the user of the Echo container (uid 1000) reads
# it through a bind mount.
chmod 644 "$KEY_FILE"

echo "Certificate written to $CERTS_DIR"
