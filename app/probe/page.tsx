import { headers } from "next/headers";

// Reads the request Cookie three ways, exactly like the real app's page that
// reads the session. It logs the result server-side with a [REPRO] tag, so the
// CI can see the values from *every* render pass (prefetch prerender and
// runtime), not only the final DOM.
//
// `instant = false` matches the real app: the segment may block, so the dynamic
// read runs directly in the render body.
export const instant = false;

export default async function Probe() {
  const h = await headers();

  const manual = new Headers();
  h.forEach((value, key) => manual.set(key, value));

  const result = {
    direct: (h.get("cookie") ?? "").length,
    viaConstructor: (new Headers(h).get("cookie") ?? "").length,
    viaForEach: (manual.get("cookie") ?? "").length,
  };

  // eslint-disable-next-line no-console
  console.error("[REPRO]", JSON.stringify(result));

  return <pre data-testid="result">{JSON.stringify(result)}</pre>;
}
