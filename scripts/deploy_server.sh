#!/bin/bash

# Builds and pushes the multi-arch Echo image to ghcr.io.
# Used both locally (`npm run deploy:server -- <tag>`) and by the CD workflow, which only
# passes release versions (1.2.3).
#
# Usage: deploy_server.sh <tag>
#   tag  Any valid docker tag: a release (1.2.3), `latest`, or anything for testing (test-pr123).
#        A stable release (1.2.3) also gets `latest` if it is the highest stable version among
#        the git tags, so releasing a fix (1.1.1) for an older line never takes `latest`
#        from 2.0.0. Pre-releases (1.2.3-rc.1) and any other tag are pushed as-is.

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

# ── Variables ──────────────────────────────────────────────────────────────────

SCRIPT_PATH=$(realpath "$0")
ROOT_DIR="$(dirname "$SCRIPT_PATH")/.."

IMAGE="ghcr.io/br0nie5/echo"
TAG="${1:-}"

cd "$ROOT_DIR"

# ── Tags ───────────────────────────────────────────────────────────────────────

if [[ ! "$TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
    echo "Usage: $0 <tag> (e.g. 1.2.3, latest, test-pr123)" >&2
    exit 1
fi

is_highest_stable_version() {
    local highest
    highest=$( (git tag --list; echo "$TAG") | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)
    [[ "$highest" == "$TAG" ]]
}

TAGS=(-t "$IMAGE:$TAG")

if [[ "$TAG" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    if is_highest_stable_version; then
        TAGS+=(-t "$IMAGE:latest")
    else
        echo "$TAG is not the highest stable version, not tagging latest"
    fi
fi

# ── Build & push ───────────────────────────────────────────────────────────────

npm run build

docker buildx build --platform linux/amd64,linux/arm64 "${TAGS[@]}" . --push
