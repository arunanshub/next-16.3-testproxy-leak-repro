// A streamed JSON route. The Server Component fetches this internally; the
// streamed response body is what leaks on the broken versions.
// (Route Handlers are dynamic by default under cacheComponents; no `dynamic`
// route-segment export — it errors under cacheComponents.)
export async function GET() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let n = 0; n < 200; n++) {
        controller.enqueue(encoder.encode(JSON.stringify({ n }) + "\n"));
        await new Promise((r) => setTimeout(r, 2));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
