import Link from "next/link";
import { MenuItemList } from "@/components/MenuItemList";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem } from "@/lib/types";

export default async function MenuListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort_order", { ascending: true });

  const items = (data ?? []) as MenuItem[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--navy)]">
            Menu items
          </h2>
          <p className="mt-1 text-sm text-black/55">
            {items.length} item{items.length === 1 ? "" : "s"} · uncheck{" "}
            <strong>Enabled on TV</strong> to hide an item without deleting it ·
            changes sync to the TV within about a minute
          </p>
        </div>
        <Link
          href="/items/new"
          className="flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--coral)] px-4 text-sm font-semibold text-white active:brightness-95 sm:w-auto"
        >
          Add Item
        </Link>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load menu items: {error.message}. Apply the Supabase
          migration in <code>supabase/migrations</code> and confirm env vars.
        </p>
      ) : (
        <MenuItemList items={items} />
      )}
    </div>
  );
}
