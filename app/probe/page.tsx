import { headers } from "next/headers";
import { appendFileSync } from "node:fs";

// Reads the request Cookie three ways, exactly like the real app's page that
// reads the session. It records the result for EVERY render pass (prefetch
// prerender and runtime), so the CI can see which pass loses the cookie.
//
// `instant = false` matches the real app: the segment may block, so the dynamic
// read runs directly in the render body.
export const instant = false;

export default async function Probe() {
  const h = await headers();

  const manual = new Headers();
  h.forEach((value, key) => manual.set(key, value));

  const result = {
    direct: (h.get("cookie") ?? "").length,
    viaConstructor: (new Headers(h).get("cookie") ?? "").length,
    viaForEach: (manual.get("cookie") ?? "").length,
  };

  const line = `[REPRO] ${JSON.stringify(result)}`;
  // eslint-disable-next-line no-console
  console.error(line);
  // Also write to a file — reliable capture independent of how the test runner
  // forwards the dev server output. The CI reads /tmp/repro.log after each run.
  try {
    appendFileSync("/tmp/repro.log", line + "\n");
  } catch {
    // best effort
  }

  return <pre data-testid="result">{JSON.stringify(result)}</pre>;
}
