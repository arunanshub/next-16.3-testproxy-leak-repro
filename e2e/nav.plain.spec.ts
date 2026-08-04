import { test } from "@playwright/test";
import { assertCookiePreserved } from "./_assert";

// Plain run. testProxy is off. This is the production shape. This test passes on
// all versions.
test("new Headers(headers()) preserves the cookie (plain)", async ({
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
