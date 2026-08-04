import { readFileSync } from "node:fs";

// This function reads the [REPRO] lines from /probe. It checks that the copy
// keeps the cookie. It throws an error when a pass that saw the cookie lost it
// in the copy. The test then fails. The test passes on a good version. The test
// fails on a version with the bug.
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
        `new Headers(await headers()) lost the cookie: ${JSON.stringify(p)}`,
      );
    }
  }
}
