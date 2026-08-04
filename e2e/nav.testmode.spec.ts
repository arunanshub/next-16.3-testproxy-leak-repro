import { test } from "next/experimental/testmode/playwright";
import { assertCookiePreserved } from "./_assert";

// The full test-mode harness, like an E2E suite. testProxy is on. The test runs
// under next/experimental/testmode/playwright. This test fails on preview.10 and
// 16.3.0.
test.use({ nextOptions: { fetchLoopback: true } });

test("new Headers(headers()) preserves the cookie (testmode)", async ({
  page,
  context,
}) => {
  await context.addCookies([
    { name: "session_token", value: "a".repeat(400), domain: "localhost", path: "/" },
  ]);
  await page.goto("/");
  await page.getByRole("link", { name: "go to probe" }).click();
  await page.getByTestId("result").waitFor({ state: "visible" });
  await page.waitForTimeout(500);
  assertCookiePreserved();
});
