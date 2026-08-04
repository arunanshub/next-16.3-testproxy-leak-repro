import { Suspense } from "react";
import { headers } from "next/headers";

// The same check as /api/headers-check, but in a Server Component render.
// This is the context where the real app first saw the bug (a page that reads
// the session). The dynamic read sits inside <Suspense> so it is valid under
// cacheComponents.
async function HeaderCheck() {
  const h = await headers();

  const manual = new Headers();
  h.forEach((value, key) => manual.set(key, value));

  const result = {
    direct: (h.get("cookie") ?? "").length,
    viaConstructor: (new Headers(h).get("cookie") ?? "").length,
    viaForEach: (manual.get("cookie") ?? "").length,
  };

  return <pre data-testid="result">{JSON.stringify(result, null, 2)}</pre>;
}

export default function Page() {
  return (
    <main>
      <h1>new Headers(await headers()) copy check</h1>
      <Suspense fallback={<p>loading</p>}>
        <HeaderCheck />
      </Suspense>
    </main>
  );
}
