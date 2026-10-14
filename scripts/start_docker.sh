#!/bin/bash

# Builds the Echo image and runs one of the deployments of examples/ with it, for manual testing.
#
# Usage: npm run start:docker                    asks which example to run
#        npm run start:docker -- <example>       runs that one (the name of its directory)
#
# The example is stopped and its containers removed when this script ends (Ctrl+C).

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

SCRIPT_PATH=$(realpath "$0")
ROOT_DIR="$(dirname "$SCRIPT_PATH")/.."
EXAMPLES_DIR="$ROOT_DIR/examples"
COMPOSE_FILE_NAME="compose.yaml"
LOCAL_IMAGE="echo:dev"

cd "$ROOT_DIR"

example_names=()
for example_compose_file in "$EXAMPLES_DIR"/*/"$COMPOSE_FILE_NAME"; do
  example_names+=("$(basename "$(dirname "$example_compose_file")")")
done

example_name="${1:-}"

if [[ -z "$example_name" ]]; then
  PS3="Example to start: "
  select example_name in "${example_names[@]}"; do
    if [[ -n "$example_name" ]]; then
      break
    fi
  done
fi

compose_file="$EXAMPLES_DIR/$example_name/$COMPOSE_FILE_NAME"

if [[ ! -f "$compose_file" ]]; then
  echo "Unknown example \"$example_name\". Available: ${example_names[*]}" >&2
  exit 1
fi

npm run build
docker build -t "$LOCAL_IMAGE" .

example_url=$(sed -n 's/^# URL: //p' "$compose_file")

echo
echo "Starting $example_name: $example_url"
if [[ "$example_url" != *localhost* ]]; then
  echo "Its host must resolve to this machine: npm run dns:enable"
fi
echo

stop_example() {
  docker compose -f "$compose_file" down --volumes
}
trap stop_example EXIT

ECHO_IMAGE="$LOCAL_IMAGE" docker compose -f "$compose_file" up --force-recreate
