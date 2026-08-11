import { signOut } from "@/lib/menu-actions";
import Link from "next/link";

export function AdminHeader({ email }: { email?: string | null }) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2.5 sm:py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--coral)] sm:text-xs">
            Scootery
          </p>
          <h1 className="text-lg font-bold text-[var(--navy)] sm:text-xl">
            Menu Admin
          </h1>
        </div>
        <nav className="-mx-1 flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap px-1 pb-1 text-sm sm:mx-0 sm:w-auto sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0">
          <Link
            href="/"
            className="flex min-h-11 items-center rounded-md px-3 font-semibold text-[var(--navy)] hover:bg-black/5 active:bg-black/10"
          >
            Items
          </Link>
          <Link
            href="/items/new"
            className="flex min-h-11 items-center rounded-md px-3 font-semibold text-[var(--navy)] hover:bg-black/5 active:bg-black/10"
          >
            Add
          </Link>
          <Link
            href="/preview"
            className="flex min-h-11 items-center rounded-md px-3 font-semibold text-[var(--navy)] hover:bg-black/5 active:bg-black/10"
          >
            Live preview
          </Link>
          {email ? (
            <span className="hidden text-xs text-black/50 lg:inline">
              {email}
            </span>
          ) : null}
          <form action={signOut} className="ml-auto sm:ml-0">
            <button
              type="submit"
              className="flex min-h-11 items-center rounded-md border border-black/15 px-3 font-semibold active:bg-black/5"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
