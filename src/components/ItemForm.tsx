"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ITEM_TYPE_META, type ItemType, type MenuItem } from "@/lib/types";
import { createItem, updateItem } from "@/lib/menu-actions";

type Props =
  | { mode: "create"; itemType: ItemType; item?: undefined }
  | { mode: "edit"; item: MenuItem };

export function ItemForm(props: Props) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const item = props.mode === "edit" ? props.item : null;
  const itemType: ItemType =
    props.mode === "create" ? props.itemType : props.item.item_type;
  const meta = ITEM_TYPE_META[itemType];
  const imageOptional = itemType === "social_post";

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        if (props.mode === "create") {
          await createItem(formData);
        } else {
          await updateItem(props.item.id, formData);
        }
      } catch (err) {
        if (isRedirectError(err)) throw err;
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5">
      <input type="hidden" name="item_type" value={itemType} />
      {item ? (
        <input type="hidden" name="existing_image_url" value={item.image_url} />
      ) : null}

      <label className="flex flex-col gap-1 text-sm font-medium">
        {meta.nameLabel}
        <input
          name="name"
          required
          defaultValue={item?.name ?? ""}
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-[var(--coral)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {meta.descriptionLabel}
        <textarea
          name="description"
          rows={4}
          defaultValue={item?.description ?? ""}
          className="rounded-md border border-black/15 bg-white px-3 py-2 outline-none focus:border-[var(--coral)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {meta.imageLabel}{" "}
        {props.mode === "create"
          ? imageOptional
            ? "(optional)"
            : "(required)"
          : "(optional replace)"}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required={props.mode === "create" && !imageOptional}
          className="rounded-md border border-black/15 bg-white px-3 py-2"
        />
      </label>

      {item && item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="h-40 w-40 rounded-lg object-cover"
        />
      ) : null}

      <label className="flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-3 text-sm font-medium">
        <input
          type="checkbox"
          name="enabled"
          defaultChecked={item?.enabled ?? true}
          className="size-4 accent-[var(--coral)]"
        />
        <span>
          Enabled on TV
          <span className="mt-0.5 block font-normal text-black/50">
            Uncheck to hide this item from the signage without deleting it.
          </span>
        </span>
      </label>

      {itemType === "menu" ? (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={item?.featured ?? false}
            className="size-4"
          />
          Today&apos;s Special (featured cinematic slide)
        </label>
      ) : null}

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--coral)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending
          ? "Saving…"
          : props.mode === "create"
            ? `Add ${meta.label}`
            : "Save changes"}
      </button>
    </form>
  );
}
