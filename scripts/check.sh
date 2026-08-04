#!/usr/bin/env bash
# Start the app in one mode, send one request that has a Cookie header, and read
# the /api/headers-check result. It reports the length of the cookie read three
# ways: direct .get(), new Headers() copy, and forEach copy.
#
# Usage: bash scripts/check.sh <plain|testproxy>
set -uo pipefail

MODE="${1:-plain}"
PORT="${PORT:-3000}"
NEXTV="${NEXTV:-?}"

# A long, unique cookie value so a length is easy to see.
COOKIE="session_token=$(printf 'a%.0s' $(seq 1 300))"

ENV_ARGS=()
if [ "$MODE" = "testproxy" ]; then
  ENV_ARGS=(NEXT_PUBLIC_E2E_MODE=true)
fi

echo ">>> next=$NEXTV mode=$MODE : starting next dev on :$PORT"
env "${ENV_ARGS[@]}" npx next dev -p "$PORT" >"/tmp/server-$MODE.log" 2>&1 &
SRV=$!

# Wait until the route answers.
ok=""
for i in $(seq 1 60); do
  if curl -sf "http://localhost:$PORT/api/headers-check" -H "Cookie: $COOKIE" \
      -o "/tmp/route-$MODE.json" 2>/dev/null; then
    ok=1
    break
  fi
  sleep 2
done

if [ -z "$ok" ]; then
  echo "!!! server did not answer ($MODE). last log lines:"
  tail -25 "/tmp/server-$MODE.log" || true
  kill "$SRV" 2>/dev/null || true
  exit 3
fi

echo "--- /api/headers-check ($MODE) ---"
cat "/tmp/route-$MODE.json"
echo

# Also render the Server Component page (secondary, visual only).
curl -sf "http://localhost:$PORT/" -H "Cookie: $COOKIE" -o "/tmp/page-$MODE.html" 2>/dev/null || true

kill "$SRV" 2>/dev/null || true
wait "$SRV" 2>/dev/null || true

# Print one table row, and add it to the CI job summary.
node - "$MODE" <<'NODE'
const fs = require("fs");
const mode = process.argv[2];
const r = JSON.parse(fs.readFileSync(`/tmp/route-${mode}.json`, "utf8"));
const v = process.env.NEXTV || "?";
const row = `| ${v} | ${mode} | ${r.direct} | ${r.viaConstructor} | ${r.viaForEach} | ${r.bug ? "**YES**" : "no"} |`;
console.log(row);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, row + "\n");
}
if (r.direct === 0) {
  console.error("SETUP ERROR: the request cookie was not seen at all");
  process.exit(2);
}
NODE
