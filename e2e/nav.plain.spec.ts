import { test } from "@playwright/test";

// Same navigation, but WITHOUT the Next testmode harness. If the bug appears
// here too, then testmode is not required and the trigger is the render model
// (partialPrefetching prerender) — which production also runs.

test("navigate to /probe with a session cookie (plain)", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "session_token",
      value: "a".repeat(400),
      url: "http://localhost:3000",
    },
  ]);

  await page.goto("/");
  await page.waitForTimeout(3000);

  await page.getByRole("link", { name: "go to probe" }).click();
  await page.getByTestId("result").waitFor({ state: "visible" });
  const dom = await page.getByTestId("result").textContent();
  // eslint-disable-next-line no-console
  console.log("[REPRO-DOM plain]", dom);
});
