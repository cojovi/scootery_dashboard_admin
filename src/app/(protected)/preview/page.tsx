import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MenuItem } from "@/lib/types";

export default async function PreviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true });

  const items = (data ?? []) as MenuItem[];
  const menuItems = items.filter((item) => item.item_type === "menu");
  const featured = menuItems.find((item) => item.featured) ?? null;
  const gridItems = menuItems.filter((item) => !item.featured);
  const employeePhotos = items.filter(
    (item) => item.item_type === "employee_photo",
  );
  const employeeOfMonth = items.filter(
    (item) => item.item_type === "employee_of_month",
  );
  const socialPosts = items.filter((item) => item.item_type === "social_post");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/" className="text-sm font-semibold text-[var(--coral)]">
          ← Back to items
        </Link>
        <h2 className="mt-2 text-2xl font-extrabold text-[var(--navy)]">
          Live TV preview
        </h2>
        <p className="mt-1 text-sm text-black/55">
          Enabled content the public signage will show.
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {error.message}
        </p>
      ) : null}

      {featured ? (
        <section className="overflow-hidden rounded-xl bg-[var(--navy)] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
            Today&apos;s Special
          </p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={featured.image_url}
              alt={featured.name}
              className="h-40 w-40 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-2xl font-bold">{featured.name}</h3>
              <p className="mt-2 text-sm text-white/75">{featured.description}</p>
            </div>
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-black/20 px-4 py-6 text-sm text-black/50">
          No featured special selected.
        </p>
      )}

      <section>
        <h3 className="mb-3 text-lg font-bold text-[var(--navy)]">
          Menu items ({gridItems.length})
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gridItems.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="aspect-square w-full object-cover"
              />
              <div className="p-3">
                <h4 className="font-bold text-[var(--navy)]">{item.name}</h4>
                <p className="mt-1 line-clamp-3 text-xs text-black/60">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {employeeOfMonth.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-bold text-[var(--navy)]">
            Employee of the Month
          </h3>
          {employeeOfMonth.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-4 rounded-xl bg-[var(--navy)] p-6 text-white sm:flex-row sm:items-center"
            >
              <img
                src={item.image_url}
                alt={item.name}
                className="h-32 w-32 rounded-full border-4 border-[var(--coral)] object-cover"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--coral)]">
                  Employee of the Month
                </p>
                <h4 className="mt-1 text-xl font-bold">{item.name}</h4>
                <p className="mt-1 text-sm text-white/75">{item.description}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {employeePhotos.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-bold text-[var(--navy)]">
            Employee photos ({employeePhotos.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {employeePhotos.map((item) => (
              <figure
                key={item.id}
                className="rounded-md border border-black/10 bg-white p-2 pb-3 shadow-sm"
              >
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="mt-2 text-center text-xs font-semibold text-[var(--navy)]">
                  {item.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {socialPosts.length > 0 ? (
        <section>
          <h3 className="mb-3 text-lg font-bold text-[var(--navy)]">
            Social media posts ({socialPosts.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {socialPosts.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <h4 className="font-bold text-[var(--navy)]">{item.name}</h4>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="mt-3 max-h-56 w-full rounded-lg object-contain bg-black/5"
                  />
                ) : null}
                <p className="mt-3 text-sm italic text-black/70">
                  “{item.description}”
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-black/50">No enabled items to preview.</p>
      ) : null}
    </div>
  );
}
