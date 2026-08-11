import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/ItemForm";
import { createClient } from "@/lib/supabase/server";
import { ITEM_TYPE_META, type MenuItem } from "@/lib/types";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const item = data as MenuItem;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm font-semibold text-[var(--coral)]">
          ← Back to items
        </Link>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)]">
          Edit {ITEM_TYPE_META[item.item_type].label}
        </h2>
      </div>
      <ItemForm mode="edit" item={item} />
    </div>
  );
}
