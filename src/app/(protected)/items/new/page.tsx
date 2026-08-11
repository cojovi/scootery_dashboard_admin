import Link from "next/link";
import { ItemForm } from "@/components/ItemForm";
import { ITEM_TYPES, ITEM_TYPE_META, isItemType } from "@/lib/types";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const itemType = type && isItemType(type) ? type : null;

  if (!itemType) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/" className="text-sm font-semibold text-[var(--coral)]">
            ← Back to items
          </Link>
          <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)]">
            Add Item
          </h2>
          <p className="mt-1 text-sm text-black/55">
            What kind of item are you adding to the TV?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {ITEM_TYPES.map((t) => (
            <Link
              key={t}
              href={`/items/new?type=${t}`}
              className="group rounded-xl border border-black/10 bg-white p-5 shadow-sm transition hover:border-[var(--coral)] hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-[var(--navy)] group-hover:text-[var(--coral)]">
                {ITEM_TYPE_META[t].label}
              </h3>
              <p className="mt-1.5 text-sm text-black/55">
                {ITEM_TYPE_META[t].blurb}
              </p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/items/new"
          className="text-sm font-semibold text-[var(--coral)]"
        >
          ← Choose a different type
        </Link>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)]">
          Add {ITEM_TYPE_META[itemType].label}
        </h2>
        <p className="mt-1 text-sm text-black/55">
          {ITEM_TYPE_META[itemType].blurb}
        </p>
      </div>
      <ItemForm mode="create" itemType={itemType} />
    </div>
  );
}
