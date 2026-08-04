import { test, expect } from "next/experimental/testmode/playwright";

// fetchLoopback: unmocked server-side fetches pass through to the real target.
// This is the mode the leak appears in.
test.use({ nextOptions: { fetchLoopback: true } });

test("navigating a server-fetch page repeatedly must not leak the server", async ({
  page,
}) => {
  // On preview.9 this loop completes quickly and the server RSS stays flat.
  // On preview.10 / 16.3.0 the server RSS grows without bound (watch the
  // [rss] lines printed by scripts/run-leak.sh); navigations slow down and
  // eventually stall.
  for (let i = 0; i < 40; i++) {
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByTestId("loaded")).toBeVisible();
  }
});
