import Link from "next/link";

// Home page. The prefetching Link makes Next prerender /probe's App Shell in a
// prefetch pass (this is the pass we suspect mangles the headers object). The
// test then clicks through to /probe for the runtime render.
export default function Home() {
  return (
    <main>
      <h1>home</h1>
      <Link href="/probe" prefetch={true}>
        go to probe
      </Link>
    </main>
  );
}
