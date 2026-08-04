import Link from "next/link";

// The home page. The Link prefetches /probe. The test then opens /probe.
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
