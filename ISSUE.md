# `new Headers(await headers())` returns an empty Headers under testmode in 16.3

## What happens

When `experimental.testProxy` is enabled, Next 16.3 makes `await headers()`
return a `ReadonlyHeaders` that breaks when copied. `.get()` and `.forEach()` on
it work. But `new Headers(x)` returns an **empty** `Headers`. Every entry is
lost, including `Cookie`.

The `testProxy` config alone is enough. The Playwright testmode runtime
(`next/experimental/testmode/playwright`) is **not** required — a plain
Playwright run against a server with `testProxy` on reproduces it too. With
`testProxy` off, the copy works. So a normal production build (no `testProxy`)
is not affected.

## Why it matters

Server auth libraries copy the request headers this way. better-auth does
`new Headers(passedHeaders)` before it reads the `Cookie` header. Under testmode
the copy is empty, so `api.getSession` returns null, and an authenticated E2E
user is treated as logged out. This broke a whole E2E suite on the 16.3 upgrade.

## Reproduce

This repo. `/probe` reads the request cookie three ways and prints `[REPRO]`.

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
pnpm e2e:testmode   # bug: viaConstructor = 0
pnpm e2e:plain      # no bug: viaConstructor = full length
```

Cookie length by mode and version (`new Headers()` of `0` = lost):

| next | plain (no testProxy) | testProxy on |
|---|---|---|
| 16.3.0 | 414 | **0** |
| 16.3.0-preview.10 | 414 | **0** |
| 16.3.0-preview.9 | 414 | 414 |

"testProxy on" holds whether or not the Playwright testmode runtime is used.

Minimal read, in a page or route that runs under testmode, with a `Cookie` on
the request:

```ts
import { headers } from "next/headers";

const h = await headers();
h.get("cookie")?.length;               // 414
new Headers(h).get("cookie")?.length;  //   0  <- lost
```

## Expected

`new Headers(await headers())` copies all entries. This is the WHATWG behavior.

## Actual

The copy is empty under testmode.

## Versions

- Bad: `16.3.0` and `16.3.0-preview.10`.
- Good: `16.3.0-preview.9`.
- react / react-dom `19.2.8`.

The regression window is `preview.9` -> `preview.10`. This is likely related to
the vendored testmode interceptor change in that window (#96059), and to the
open testmode report #96521.

## Workaround

Copy the entries by hand with `.forEach()` before you pass them to a library.
