#!/usr/bin/env bash
# Runs the Playwright test-mode test while sampling the next-server worker RSS.
# On the broken versions RSS climbs without bound, so cap the heap to fail fast
# instead of freezing the host.
set -u

# Sample the next-server worker RSS every 5s in the background.
(
  for i in $(seq 1 40); do
    pid=$(pgrep -f "next-server" | head -1)
    if [ -n "${pid:-}" ]; then
      rss=$(ps -o rss= -p "$pid" 2>/dev/null | awk '{print int($1/1024)}')
      echo "[rss] t=$((i * 5))s worker=$pid rss=${rss}MB avail=$(free -m 2>/dev/null | awk 'NR==2{print $7}')MB"
    fi
    sleep 5
  done
) &
PROBE=$!

# Cap the heap so a runaway OOMs the worker instead of the whole machine.
export NODE_OPTIONS="--max-old-space-size=4096"
npx playwright test
CODE=$?

kill "$PROBE" 2>/dev/null || true
exit $CODE
