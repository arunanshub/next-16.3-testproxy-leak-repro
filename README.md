# Minimal repro: `new Headers(await headers())` loses all entries in Next 16.3

In Next 16.3, `await headers()` returns a `ReadonlyHeaders`. You can read it
with `.get()`. But `new Headers(x)` copies it to an **empty** `Headers`. Every
entry is lost, including `Cookie`.

This is the exact pattern that server auth libraries use to read request
cookies. For example, better-auth does `new Headers(passedHeaders)` inside
`api.getSession` before it parses the `Cookie` header. The copy is empty, so it
finds no cookie and the session read returns null — even when the request has a
valid session cookie.

## What the repro does

`app/api/headers-check/route.ts` reads the request `Cookie` three ways and
returns the length of each:

- `direct` — `headers().get("cookie")` (works)
- `viaConstructor` — `new Headers(headers()).get("cookie")` (the bug)
- `viaForEach` — a manual `forEach` copy (the workaround)

`app/page.tsx` does the same in a Server Component render.

## Run it

```bash
pnpm install
pnpm exec playwright install --with-deps chromium

pnpm check:plain     # baseline: a plain curl request (runtime pass only)
pnpm e2e:plain       # browser navigation, no testmode harness
pnpm e2e:testmode    # browser navigation, testmode harness (like the real app)
```

The curl baseline hits only the runtime render. The browser tests load `/`
(which prefetches `/probe`) and then click through to `/probe`. `/probe` reads
the cookie three ways and prints `[REPRO]` server-side for **every** render pass
(prefetch prerender and runtime). A `viaConstructor` of `0` while `direct` is
non-zero means the copy lost the cookie.

The `plain` vs `testmode` split shows whether the testmode harness is required,
or whether the `partialPrefetching` prerender pass alone triggers it (which
production also runs).

## Expected vs actual

- Expected: `new Headers(await headers())` copies all entries (WHATWG behavior).
- Actual (16.3): the copy is empty.

## Versions

The CI (`.github/workflows/repro.yml`) runs the check across
`16.3.0-preview.9`, `16.3.0-preview.10`, and `16.3.0`, in both plain and
testProxy modes. The job summary shows one table per version. This shows the
regression window and whether `testProxy` matters.

## Workaround

Copy the headers by hand before you pass them to a library:

```ts
const src = await headers();
const safe = new Headers();
src.forEach((value, key) => safe.set(key, value));
// pass `safe` instead of `src`
```
