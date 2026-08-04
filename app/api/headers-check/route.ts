import { headers } from "next/headers";

// Minimal repro of the Next 16.3 header-copy bug.
//
// `await headers()` returns a ReadonlyHeaders. Reading it with `.get()` works.
// Copying it with `new Headers(x)` returns an EMPTY Headers. This is the exact
// pattern that better-auth (and other server libraries) use to read request
// cookies, so the request Cookie is lost and the session read returns null.
export async function GET() {
  const h = await headers();

  // Read directly — this works.
  const direct = h.get("cookie") ?? "";

  // Copy with the WHATWG constructor — this is what better-auth does.
  const viaConstructor = new Headers(h).get("cookie") ?? "";

  // Copy by hand with forEach — the workaround.
  const manual = new Headers();
  h.forEach((value, key) => manual.set(key, value));
  const viaForEach = manual.get("cookie") ?? "";

  return Response.json({
    direct: direct.length,
    viaConstructor: viaConstructor.length,
    viaForEach: viaForEach.length,
    // The bug: the cookie is present, but the constructor copy lost it.
    bug: direct.length > 0 && viaConstructor.length === 0,
  });
}
