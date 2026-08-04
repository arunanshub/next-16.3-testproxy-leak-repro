// Dynamic Server Component that performs an internal, uncached, *streamed*
// server-side fetch on every request. Under cacheComponents + testProxy this
// fetch's response memory is never released on the broken versions.
//
// `instant = false` marks the segment as allowed to block, so the uncached
// fetch can run directly in the render body (mirrors the real app's page).
export const instant = false;

export default async function Page() {
  const port = process.env.PORT ?? "3000";
  const res = await fetch(`http://localhost:${port}/api/stream`, {
    cache: "no-store",
  });
  const text = await res.text();

  return (
    <main>
      <h1 data-testid="loaded">loaded {text.length} bytes</h1>
    </main>
  );
}
