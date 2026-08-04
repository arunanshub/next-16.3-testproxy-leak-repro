# `new Headers(await headers())` returns an empty Headers with `testProxy` on (Next 16.3)

## Summary

Next 16.3 has a bug. When you set `experimental.testProxy: true`, `await headers()` returns a `Headers` object that you cannot copy.

You can read a value with `.get()`. But `new Headers(x)` returns an empty object. The copy loses every header, including `Cookie`.

With `testProxy` off, the copy works. A production build does not set `testProxy`. So production is not affected.

## Why this matters

Server auth libraries copy the request headers with `new Headers()`. For example, better-auth runs `new Headers(passedHeaders)` in `api.getSession`, then reads the `Cookie` header from the copy. The copy is empty. So better-auth finds no cookie, and the session read returns `null`. The user appears logged out.

## How it works

`app/probe/page.tsx` reads the request `Cookie` in three ways:

1. `direct`: `headers().get("cookie")`
2. `viaConstructor`: `new Headers(headers()).get("cookie")`
3. `viaForEach`: a manual copy with `forEach`

The page writes each result to `/tmp/repro.log`. It writes one line for each render pass.

Each test asserts that the copy keeps the cookie. A test fails when a copy loses the cookie. So a test passes on a good version and fails on a version with the bug.

## Cells

The CI runs three cells for each Next version:

| cell | `testProxy` | test runtime | this represents |
|---|---|---|---|
| `plain` | off | Playwright | a production build |
| `proxyconfig` | on | Playwright | `testProxy` on, no test-mode runtime |
| `testmode` | on | Next test mode | an E2E suite |

## Results

Each cell reads the cookie. A value of `0` means the copy lost the cookie.

| Next | plain | proxyconfig | testmode |
|---|---|---|---|
| `16.3.0` | 414 | 0 | 0 |
| `16.3.0-preview.10` | 414 | 0 | 0 |
| `16.3.0-preview.9` | 414 | 414 | 414 |

The bug is present from `16.3.0-preview.10`. Version `16.3.0-preview.9` does not have the bug.

The `proxyconfig` cell also has the bug. This cell uses plain Playwright. So the Next test-mode runtime is not necessary. The `testProxy` config alone causes the bug.

## Run it

```bash
pnpm install
pnpm exec playwright install --with-deps chromium

pnpm e2e:plain         # production shape. This test passes.
pnpm e2e:proxyconfig   # testProxy on, plain runtime. This test fails on 16.3.
pnpm e2e:testmode      # E2E shape. This test fails on 16.3.
```

## Expected and actual

- Expected: `new Headers(await headers())` copies every header. This is the WHATWG behavior.
- Actual: with `testProxy` on, the copy is empty.

## Workaround

Copy the headers with `forEach` before you pass them to a library:

```ts
const source = await headers();
const safe = new Headers();
source.forEach((value, key) => safe.set(key, value));
// Use `safe` in place of `source`.
```
