import { test } from "next/experimental/testmode/playwright";
import { assertCookiePreserved } from "./_assert";

// Testmode: the full test harness, like the real app's E2E suite. testProxy is
// ON and the test runs under next/experimental/testmode/playwright.
// Expected: RED on preview.10 and 16.3.0 (the copy loses the cookie).
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
