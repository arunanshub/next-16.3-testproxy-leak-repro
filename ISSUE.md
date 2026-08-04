# `new Headers(await headers())` returns an empty Headers with `testProxy` on (16.3)

## What happens

Set `experimental.testProxy: true`. In Next 16.3, `await headers()` then returns a `ReadonlyHeaders` that you cannot copy. `.get()` and `.forEach()` work on it. But `new Headers(x)` returns an empty `Headers`. The copy loses every header, including `Cookie`.

The `testProxy` config alone causes this. The Playwright test-mode runtime (`next/experimental/testmode/playwright`) is not necessary. A plain Playwright run against a server with `testProxy` on shows the same result. With `testProxy` off, the copy works. A production build does not set `testProxy`, so a production build is not affected.

## Why it matters

Server auth libraries copy the request headers with `new Headers()`. better-auth runs `new Headers(passedHeaders)` in `api.getSession`, then reads the `Cookie` header from the copy. The copy is empty. So `api.getSession` finds no cookie and returns `null`. An authenticated E2E user then appears logged out. This broke a full E2E suite after an upgrade to 16.3.

## Reproduce

Repo: https://github.com/arunanshub/next-16.3-testmode-headers-copy

```bash
pnpm install
pnpm exec playwright install --with-deps chromium
pnpm e2e:proxyconfig   # testProxy on, plain Playwright. viaConstructor = 0.
pnpm e2e:plain         # testProxy off. viaConstructor = full length.
```

Minimal read, in a page or a route that runs with `testProxy` on, with a `Cookie` on the request:

```ts
import { headers } from "next/headers";

const h = await headers();
h.get("cookie")?.length;               // 414
new Headers(h).get("cookie")?.length;  //   0
```

## Expected

`new Headers(await headers())` copies every header. This is the WHATWG behavior.

## Actual

With `testProxy` on, the copy is empty.

## Likely cause

`new Headers(init)` has a fast path when `init` is `instanceof Headers`. This path copies an internal field. It does not use the public iterator. Next returns a `HeadersAdapter` from `await headers()`. This adapter is `instanceof Headers` and is fully iterable.

We tested each init type with `testProxy` on:

- `new Headers({ ...record })` works.
- `new Headers([[name, value]])` works.
- `new Headers(new Headers(...))` works.
- `new Headers(headersAdapter)` returns empty.

So the constructor is not broadly broken. Only the copy of the `HeadersAdapter` fails. The fast path reads an internal field that the adapter does not provide in the `testProxy` environment. The public API (`.get`, `.forEach`, iteration, `instanceof`) still works. The `forEach` workaround uses the public API, so it is not affected.

`testProxy` loads `@mswjs/interceptors`. This changed in `preview.10` (#96059). It appears to change the internal Headers contract, likely a second Headers realm. This is a strong inference from the source, not yet traced line by line.

## Results

Cookie length that the copy reads. A value of `0` means the copy lost the cookie.

| Next | `testProxy` off | `testProxy` on |
|---|---|---|
| `16.3.0` | 414 | 0 |
| `16.3.0-preview.10` | 414 | 0 |
| `16.3.0-preview.9` | 414 | 414 |

## Versions

- With the bug: `16.3.0` and `16.3.0-preview.10`.
- Without the bug: `16.3.0-preview.9`.
- react and react-dom: `19.2.8`.

The bug started between `preview.9` and `preview.10`. This is likely related to the vendored test-mode interceptor change in that range (#96059) and to the open report #96521.

## Workaround

Copy the headers with `forEach` before you pass them to a library.
