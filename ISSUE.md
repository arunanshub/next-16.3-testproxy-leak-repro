# `new Headers(await headers())` returns an empty Headers in 16.3

## What happens

In Next 16.3, `await headers()` returns a `ReadonlyHeaders`. `.get()` and
`.forEach()` on it work. But `new Headers(x)` copies it to an **empty**
`Headers`. All entries are lost, including `Cookie`.

## Why it matters

Server auth libraries copy the request headers this way. better-auth does
`new Headers(passedHeaders)` before it reads the `Cookie` header
(`better-auth/dist/api/dispatch.mjs`). The copy is empty, so it finds no cookie,
and `api.getSession` returns null. The user looks logged out, even with a valid
session cookie on the request.

## Reproduce

Clone this repo, then:

```bash
pnpm install
pnpm check:plain
```

Or the minimal case, in a Server Component or a Route Handler, with a request
that has a `Cookie` header:

```ts
import { headers } from "next/headers";

const h = await headers();
h.get("cookie")?.length;               // e.g. 5285  (present)
new Headers(h).get("cookie")?.length;  //      0     (lost)
```

## Expected

`new Headers(await headers())` copies all entries. This is the WHATWG `Headers`
constructor behavior.

## Actual

The copy is empty. Every header is lost.

## Versions

- Bad: `16.3.0` and `16.3.0-preview.10`.
- Good: `16.3.0-preview.9`.
- react / react-dom `19.2.8`.

See the CI in this repo for the full version x mode table.

## Workaround

Copy the entries by hand with `.forEach()` before you pass them to a library.
