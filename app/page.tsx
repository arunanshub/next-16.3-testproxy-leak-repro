// Dynamic Server Component that performs an internal, uncached, *streamed*
// server-side fetch on every request. Under cacheComponents + testProxy this
// fetch's response memory is never released on the broken versions.
//
// `instant = false` marks the segment as allowed to block, so the uncached
// fetch can run directly in the render body (mirrors the real app's page).
export const instant = false;

export default async function Page() {
  // Fetch a *separate* backend origin (:4000), like the real app hitting its
  // control-tower backend — not the Next server fetching itself.
  const res = await fetch("http://localhost:4000/stream", {
    cache: "no-store",
  });
  const text = await res.text();

  return (
    <main>
      <h1 data-testid="loaded">loaded {text.length} bytes</h1>
    </main>
  );
}
