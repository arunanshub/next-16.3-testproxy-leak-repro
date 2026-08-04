# Unbounded server-side memory growth with `cacheComponents` + `testProxy` (E2E test mode) — regressed `16.3.0-preview.9` → `16.3.0-preview.10`

### Summary

With `cacheComponents: true` and `experimental.testProxy: true`, a Server Component that performs an internal server-side streamed `fetch()` causes the dev server to leak memory **without bound** under Playwright test-mode traffic (`next/experimental/testmode/playwright` + `fetchLoopback: true`). RSS climbs roughly linearly (~100 MB/s in our app) and never reclaims, so the server degrades until requests stall and (locally) the process OOMs — a 16 GB machine froze twice.

The suite that exercises this path passes on **`16.3.0-preview.9`** and fails on **`16.3.0-preview.10`** and **`16.3.0`**. Nothing in our app changed across the bump — only the `next` version. This looks related to the App Router render-layer change from web streams to native Node.js streams (PR #94311) that landed in that window, and may be the dev/testmode-mode sibling of #92287.

### Environment

- `next`: green on `16.3.0-preview.9`; broken on `16.3.0-preview.10` and `16.3.0`
- `react` / `react-dom`: `19.2.8` (unchanged across the bump)
- Node: 22.x (CI) and 24/26 (local); OS: Linux (GitHub `ubuntu-latest`) and WSL2
- Turbopack (`next dev`)
- Relevant config:
  ```ts
  // next.config.ts
  const nextConfig: NextConfig = {
    reactCompiler: true,
    cacheComponents: true,
    partialPrefetching: true,
    experimental: {
      authInterrupts: true,
      testProxy: process.env.NEXT_PUBLIC_E2E_MODE ? true : undefined,
    },
  };
  ```

### What we observe

We measured the `next-server` worker RSS while a single Playwright test-mode test drove an authenticated flow:

| elapsed | worker RSS |
|--------:|-----------:|
|  5 s    | 1.76 GB    |
| 30 s    | 4.62 GB    |
| 60 s    | 7.18 GB    |
| 90 s    | 9.37 GB    |

Growth is linear and monotonic; no new HTTP requests are logged while it climbs, and RSS is never reclaimed after responses complete. The shape matches #92287 (`cacheComponents` + internal streamed `fetch()` retaining arrayBuffers/external memory), but our trigger is **`next dev` + `testProxy`**, not `output: standalone`.

Downstream user-visible symptom in our app: after a successful login, the first `/rpc` call (a streamed ConnectRPC POST over `fetch`) fails, the client falls back to a redirect to `/auth`, and the app never settles on an authenticated page — every authenticated E2E test then burns its full timeout and the job hits its 30-minute limit.

### Why `fetch` is involved (our app specifics, for context)

Our backend transport is HTTP/2 in production and **switches to a `fetch`-based transport only in E2E mode**, specifically so `testProxy` can intercept it. So the leak is invisible in production and only appears under `testProxy`. The minimal repro below removes ConnectRPC entirely and uses a plain internal `fetch()` to a streamed route.

### Minimal reproduction

See the `repro/` directory. It is a fresh App Router app with:

- `cacheComponents: true`, `partialPrefetching: true`, `testProxy` gated on `NEXT_PUBLIC_E2E_MODE`,
- a Server Component page that does `await fetch('<self>/api/stream', { cache: 'no-store' })` against a streamed route,
- a `next/experimental/testmode/playwright` test with `fetchLoopback: true` that navigates to the page in a loop,
- a script that samples the `next-server` worker RSS during the run.

Steps:

```bash
pnpm install
pnpm dlx playwright install chromium
# green baseline:
pnpm add next@16.3.0-preview.9 && pnpm test:leak   # RSS stays flat
# regression:
pnpm add next@16.3.0-preview.10 && pnpm test:leak  # RSS climbs without bound
```

> ⚠️ Run in CI or on a machine with plenty of RAM and a hard memory cap — on the broken versions this exhausts memory and can freeze the host.

Expected: RSS is flat on `preview.9` and grows unbounded on `preview.10` / `16.3.0`.

### Suspected cause

The web-streams → native-Node-streams render-layer change (PR #94311), which landed between `preview.9` and `preview.10`. It is the largest render-path change in that window and fits a "fetch response body / stream buffer is never released" leak.

### Related

- #92287 (`output: standalone` + `cacheComponents` + internal streamed `fetch()` → unbounded arrayBuffers / OOM) — likely the same underlying stream/response-handling bug, different mode.
