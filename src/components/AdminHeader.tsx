import { signOut } from "@/lib/menu-actions";
import Link from "next/link";

export function AdminHeader({ email }: { email?: string | null }) {
  return (
    <header className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--coral)]">
            Scootery
          </p>
          <h1 className="text-xl font-bold text-[var(--navy)]">Menu Admin</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 font-semibold text-[var(--navy)] hover:bg-black/5"
          >
            Items
          </Link>
          <Link
            href="/items/new"
            className="rounded-md px-3 py-1.5 font-semibold text-[var(--navy)] hover:bg-black/5"
          >
            Add
          </Link>
          <Link
            href="/preview"
            className="rounded-md px-3 py-1.5 font-semibold text-[var(--navy)] hover:bg-black/5"
          >
            Live preview
          </Link>
          {email ? (
            <span className="hidden text-xs text-black/50 sm:inline">{email}</span>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-black/15 px-3 py-1.5 font-semibold"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
