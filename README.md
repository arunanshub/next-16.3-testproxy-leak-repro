# Minimal repro: unbounded memory with `cacheComponents` + `testProxy`

A Server Component does an internal, uncached, **streamed** `fetch()`. With
`cacheComponents: true` and `experimental.testProxy: true`, driving it under
Playwright test-mode (`fetchLoopback: true`) leaks the dev server's memory
without bound on `next@16.3.0-preview.10` and `16.3.0`, but not on
`16.3.0-preview.9`.

> ⚠️ **Runs the host out of memory on the broken versions.** Use CI (the
> included workflow) or a machine with lots of RAM. `scripts/run-leak.sh` caps
> the heap at 4 GB so the worker OOMs instead of freezing the host — but the WSL
> host still froze for us before the cap, so prefer CI.

## Run

```bash
pnpm install
pnpm exec playwright install chromium

# GREEN baseline — RSS stays flat:
pnpm add next@16.3.0-preview.9
pnpm test:leak

# REGRESSION — RSS climbs without bound (watch the [rss] lines):
pnpm add next@16.3.0-preview.10
pnpm test:leak
```

Or push to GitHub and let `.github/workflows/repro.yml` run all three versions.

## What to look for

`pnpm test:leak` prints the `next-server` worker RSS every 5s:

- `16.3.0-preview.9`: flat (~a few hundred MB), test passes fast.
- `16.3.0-preview.10` / `16.3.0`: RSS grows ~linearly and never drops;
  navigations slow down and the run stalls / OOMs.

## Files

- `next.config.ts` — `cacheComponents`, `partialPrefetching`, `testProxy` (E2E-gated)
- `app/page.tsx` — Server Component doing the internal streamed `fetch()`
- `app/api/stream/route.ts` — the streamed route it fetches
- `e2e/leak.spec.ts` — test-mode test, `fetchLoopback: true`, navigates in a loop
- `playwright.config.ts` — starts `next dev` with `NEXT_PUBLIC_E2E_MODE=true`
- `scripts/run-leak.sh` — runs the test and samples worker RSS
