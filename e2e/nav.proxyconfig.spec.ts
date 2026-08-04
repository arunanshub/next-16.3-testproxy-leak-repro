import { test } from "@playwright/test";
import { assertCookiePreserved } from "./_assert";

// testProxy is on (NEXT_PUBLIC_E2E_MODE=true). The test runs under plain
// Playwright, not the test-mode runtime. This shows whether the testProxy config
// alone causes the bug, or whether the test-mode runtime is necessary.
test("new Headers(headers()) preserves the cookie (testProxy config, plain runtime)", async ({
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
