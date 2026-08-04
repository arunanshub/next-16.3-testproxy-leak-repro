import { test } from "next/experimental/testmode/playwright";

// Runs under the Next testmode harness (testProxy active), like the real app.
test.use({ nextOptions: { fetchLoopback: true } });

test("navigate to /probe with a session cookie (testmode)", async ({
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

  // Load home. The prefetching Link makes Next prerender /probe.
  await page.goto("/");
  await page.waitForTimeout(3000);

  // Click through to /probe for the runtime render.
  await page.getByRole("link", { name: "go to probe" }).click();
  await page.getByTestId("result").waitFor({ state: "visible" });
  const dom = await page.getByTestId("result").textContent();
  // eslint-disable-next-line no-console
  console.log("[REPRO-DOM testmode]", dom);
});
