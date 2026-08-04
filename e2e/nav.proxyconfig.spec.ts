import { test } from "@playwright/test";
import { assertCookiePreserved } from "./_assert";

// Proxy-config: testProxy is ON in next.config (NEXT_PUBLIC_E2E_MODE=true), but
// the test runs under PLAIN Playwright — not the testmode runtime. This isolates
// whether the testProxy *config* alone breaks the copy, or whether the testmode
// *runtime* (next/experimental/testmode/playwright) is required.
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
