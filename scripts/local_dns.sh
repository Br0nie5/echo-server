#!/bin/bash

# Makes the hosts of the deployments of examples/ resolve to this machine, or stops doing so, by
# adding or removing a block of its own in the hosts file. Asks for the sudo password.
#
# Usage: npm run dns:enable
#        npm run dns:disable
#
# Only this machine is concerned: to reach an example from another device, override the names in
# the DNS of your network instead.

set -eEuo pipefail
shopt -s inherit_errexit
IFS=$'\n\t'

HOSTS_FILE="/etc/hosts"
BLOCK_START="# echo-server examples start"
BLOCK_END="# echo-server examples end"
EXAMPLES_HOSTS="testing.cc local.testing.cc"

action="${1:-}"

if [[ "$action" != "enable" && "$action" != "disable" ]]; then
  echo "Usage: $0 enable|disable" >&2
  exit 1
fi

hosts=$(sed "/^$BLOCK_START\$/,/^$BLOCK_END\$/d" "$HOSTS_FILE")

if [[ "$action" == "enable" ]]; then
  hosts=$(printf '%s\n%s\n%s\n%s' "$hosts" "$BLOCK_START" "127.0.0.1 $EXAMPLES_HOSTS" "$BLOCK_END")
fi

printf '%s\n' "$hosts" | sudo tee "$HOSTS_FILE" >/dev/null

# macOS keeps the answers it already gave.
if [[ "$(uname)" == "Darwin" ]]; then
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder
fi

if [[ "$action" == "enable" ]]; then
  echo "$EXAMPLES_HOSTS now resolve to this machine."
else
  echo "$EXAMPLES_HOSTS are resolved by your DNS again."
fi
