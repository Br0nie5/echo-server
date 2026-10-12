#!/bin/bash

# Builds and pushes the multi-arch Echo image to ghcr.io.
# Used both locally (`npm run deploy:server -- <tag>`) and by the CD workflow, which only
# passes release versions (1.2.3).
# The image is built by a buildx builder of its own, removed when the script ends, whatever
# the outcome, so no BuildKit container is left running.
#
# Usage: deploy_server.sh <tag>
#   tag  Any valid docker tag but `latest`: a version (1.2.3, 1.2.3-rc.1) or anything for
#        testing (dev, nightly, issue-531-this-problem).
#        A version is published once: the script stops when the registry already has it.
#        Any other tag is replaced by each deployment.
#        `latest` is never asked for: a stable version (1.2.3) also gets it if it is the
#        highest stable version among the git tags, so releasing a fix (1.1.1) for an older
#        line never takes `latest` from 2.0.0.

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

# ── Variables ──────────────────────────────────────────────────────────────────

SCRIPT_PATH=$(realpath "$0")
ROOT_DIR="$(dirname "$SCRIPT_PATH")/.."

IMAGE="ghcr.io/br0nie5/echo"
TAG="${1:-}"
BUILDER_NAME="echo-deploy"

STABLE_VERSION_PATTERN='^[0-9]+\.[0-9]+\.[0-9]+$'
VERSION_PATTERN='^[0-9]+\.[0-9]+\.[0-9]+(-.+)?$'

cd "$ROOT_DIR"

# ── Tags ───────────────────────────────────────────────────────────────────────

if [[ ! "$TAG" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]]; then
    echo "Usage: $0 <tag> (e.g. 1.2.3, dev, issue-531-this-problem)" >&2
    exit 1
fi

if [[ "$TAG" == "latest" ]]; then
    echo "latest is only given to the highest stable version: deploy that version instead" >&2
    exit 1
fi

is_tag_published() {
    local inspection
    if inspection=$(docker buildx imagetools inspect "$IMAGE:$TAG" 2>&1); then
        return 0
    fi
    if [[ "$inspection" == "ERROR: $IMAGE:$TAG: not found" ]]; then
        return 1
    fi
    echo "Could not check whether $IMAGE:$TAG is already published:" >&2
    echo "$inspection" >&2
    exit 1
}

if [[ "$TAG" =~ $VERSION_PATTERN ]] && is_tag_published; then
    echo "$IMAGE:$TAG is already published, a version is never replaced" >&2
    exit 1
fi

is_highest_stable_version() {
    local highest
    highest=$( (git tag --list; echo "$TAG") | grep -E "$STABLE_VERSION_PATTERN" | sort -V | tail -n 1)
    [[ "$highest" == "$TAG" ]]
}

TAGS=(-t "$IMAGE:$TAG")

if [[ "$TAG" =~ $STABLE_VERSION_PATTERN ]]; then
    if is_highest_stable_version; then
        TAGS+=(-t "$IMAGE:latest")
    else
        echo "$TAG is not the highest stable version, not tagging latest"
    fi
fi

# ── Build & push ───────────────────────────────────────────────────────────────

remove_builder() {
    # --keep-state keeps the build cache, which the builder of the next deployment reuses
    docker buildx rm --keep-state "$BUILDER_NAME" > /dev/null 2>&1 || true
}

npm run build

# A deployment killed before its trap ran leaves its builder behind, and `create` refuses an existing name
remove_builder
trap remove_builder EXIT

docker buildx create --name "$BUILDER_NAME" --driver docker-container > /dev/null

docker buildx build --builder "$BUILDER_NAME" --platform linux/amd64,linux/arm64 "${TAGS[@]}" . --push
