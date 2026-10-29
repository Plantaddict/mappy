import Link from "next/link";
import { getCurrentSeller } from "@/lib/auth";

export default async function Nav() {
  const seller = await getCurrentSeller();
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="serif text-2xl font-semibold tracking-wide">
          mappy
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/studio" className="btn-ghost">Studio</Link>
          <Link href="/pricing" className="btn-ghost">For sellers</Link>
          {seller ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Log in</Link>
              <Link href="/signup" className="btn-primary">Start selling</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
