# Repro: `new Headers(await headers())` loses all entries under testmode in 16.3

Under the Next testmode harness (`experimental.testProxy` /
`next/experimental/testmode/playwright`), `await headers()` returns a
`ReadonlyHeaders` that breaks when copied. You can read it with `.get()`. But
`new Headers(x)` copies it to an **empty** `Headers`. Every entry is lost,
including `Cookie`.

Without testmode, the copy works. So a normal request (production) is fine; only
testmode E2E runs hit it.

This is the exact pattern that server auth libraries use to read request
cookies. better-auth does `new Headers(passedHeaders)` inside `api.getSession`
before it parses `Cookie`. Under testmode the copy is empty, so it finds no
cookie and the session read returns null.

## Result

The CI (`.github/workflows/repro.yml`) navigates a browser to `/probe`, which
reads the cookie three ways and records `[REPRO]` for every render pass. It runs
plain and testmode, across three versions:

| next | mode | direct | new Headers() | forEach |
|---|---|---|---|---|
| 16.3.0 | testmode | 414 | **0** | 414 |
| 16.3.0 | plain | 414 | 414 | 414 |
| 16.3.0-preview.10 | testmode | 414 | **0** | 414 |
| 16.3.0-preview.9 | testmode | 414 | 414 | 414 |

So the bug is **testmode-only**, and regressed **`preview.9` -> `preview.10`**.

## Run it

```bash
pnpm install
pnpm exec playwright install --with-deps chromium

pnpm e2e:plain      # browser navigation, no testmode harness
pnpm e2e:testmode   # browser navigation, testmode harness (like the real app)
```

`/probe` reads the cookie three ways and prints `[REPRO]` (also to
`/tmp/repro.log`). A `new Headers()` value of `0` while `direct` is non-zero
means the copy lost the cookie.

## Expected vs actual

- Expected: `new Headers(await headers())` copies all entries (WHATWG behavior).
- Actual (16.3, testmode): the copy is empty.

## Workaround

Copy the headers by hand before you pass them to a library:

```ts
const src = await headers();
const safe = new Headers();
src.forEach((value, key) => safe.set(key, value));
// pass `safe` instead of `src`
```
