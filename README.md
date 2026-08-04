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

## The CI is RED where the bug is — on purpose

Each test **asserts the correct behavior**: `new Headers(headers())` must keep
the cookie. So a cell goes **red exactly where the bug is**. The red is the
repro. Three cells isolate the trigger:

| cell | testProxy config | test runtime | this is… |
|---|---|---|---|
| `plain` | off | plain Playwright | the production shape |
| `proxyconfig` | on | plain Playwright | config on, runtime off |
| `testmode` | on | testmode | the real app's E2E shape |

Confirmed (cookie length; `new Headers()` of `0` = lost):

| next | plain | proxyconfig | testmode |
|---|---|---|---|
| 16.3.0 | 414 (green) | **0 (red)** | **0 (red)** |
| 16.3.0-preview.10 | 414 (green) | **0 (red)** | **0 (red)** |
| 16.3.0-preview.9 | 414 (green) | 414 (green) | 414 (green) |

So the bug regressed **`preview.9` -> `preview.10`**, and the trigger is the
**`experimental.testProxy` config itself** — the `proxyconfig` cell reproduces
it with plain Playwright, so the testmode runtime is not required. Production
never enables `testProxy`, so production is not affected.

## Run it

```bash
pnpm install
pnpm exec playwright install --with-deps chromium

pnpm e2e:plain         # production shape — expected green
pnpm e2e:proxyconfig   # testProxy config, plain runtime
pnpm e2e:testmode      # real app shape — expected red on 16.3
```

`/probe` reads the cookie three ways and writes `[REPRO]` to `/tmp/repro.log`
for every render pass. The test reads that file and fails if any pass that saw
the cookie lost it in the `new Headers()` copy.

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
