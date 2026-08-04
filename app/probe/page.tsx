import { headers } from "next/headers";
import { appendFileSync } from "node:fs";

// This page reads the request Cookie in three ways. It writes one line for each
// render pass to /tmp/repro.log. The test reads the file to find the pass that
// lost the cookie.
//
// `instant = false` lets this segment block. The header read then runs in the
// render body.
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
  // Write the result to a file. The CI reads /tmp/repro.log after each run.
  // A file does not depend on how the test runner forwards the server output.
  try {
    appendFileSync("/tmp/repro.log", line + "\n");
  } catch {
    // Ignore a write error.
  }

  return <pre data-testid="result">{JSON.stringify(result)}</pre>;
}
