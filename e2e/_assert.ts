import { readFileSync } from "node:fs";

// Reads the [REPRO] lines that /probe wrote for every render pass and asserts
// the correct behavior: `new Headers(headers())` must preserve the Cookie.
// It throws (fails the test) when a pass that saw the cookie lost it in the
// copy. So the test is GREEN on good versions and RED where the bug is — the
// failing assertion is the repro.
export function assertCookiePreserved(logPath = "/tmp/repro.log"): void {
  const raw = readFileSync(logPath, "utf8").trim();
  const passes = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line.replace("[REPRO] ", "")) as {
      direct: number;
      viaConstructor: number;
      viaForEach: number;
    });

  const sawCookie = passes.filter((p) => p.direct > 0);
  if (sawCookie.length === 0) {
    throw new Error("setup problem: no render pass saw the request cookie");
  }

  for (const p of sawCookie) {
    if (p.viaConstructor !== p.direct) {
      throw new Error(
        `BUG: new Headers(await headers()) dropped the cookie — ${JSON.stringify(
          p,
        )}`,
      );
    }
  }
}
