"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ITEM_TYPE_META, type MenuItem } from "@/lib/types";
import {
  clearFeatured,
  deleteItem,
  moveItem,
  reorderItems,
  setFeatured,
  toggleEnabled,
} from "@/lib/menu-actions";

function SortableRow({
  item,
  index,
  count,
  pending,
  startTransition,
}: {
  item: MenuItem;
  index: number;
  count: number;
  pending: boolean;
  startTransition: (fn: () => Promise<void>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center ${
        item.enabled ? "" : "bg-black/[0.03] opacity-80"
      } ${isDragging ? "relative z-10 bg-white shadow-lg ring-2 ring-[var(--coral)]/40" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${item.name}`}
        className="flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center self-center rounded-md text-black/35 hover:bg-black/5 hover:text-[var(--navy)] active:cursor-grabbing"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="2" y="3" width="12" height="2" rx="1" />
          <rect x="2" y="7" width="12" height="2" rx="1" />
          <rect x="2" y="11" width="12" height="2" rx="1" />
        </svg>
      </button>

      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="h-20 w-20 shrink-0 rounded-lg object-cover bg-[var(--navy)]/10"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)]/10 text-xs font-semibold text-[var(--navy)]/50">
          No image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-semibold text-[var(--navy)]">
            {item.name}
          </h2>
          {item.item_type !== "menu" ? (
            <span className="rounded-full bg-[var(--navy)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--navy)]">
              {ITEM_TYPE_META[item.item_type].label}
            </span>
          ) : null}
          {item.featured ? (
            <span className="rounded-full bg-[var(--coral)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--coral)]">
              Today&apos;s Special
            </span>
          ) : null}
          {!item.enabled ? (
            <span className="rounded-full bg-black/8 px-2 py-0.5 text-xs font-semibold text-black/60">
              Hidden from TV
            </span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Live on TV
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-black/60">
          {item.description}
        </p>
        <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--navy)]">
          <input
            type="checkbox"
            className="size-4 accent-[var(--coral)]"
            checked={item.enabled}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.checked;
              startTransition(async () => {
                await toggleEnabled(item.id, next);
              });
            }}
          />
          Enabled on TV
          <span className="font-normal text-black/45">
            (uncheck to hide without deleting)
          </span>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending || index === 0}
          onClick={() =>
            startTransition(async () => {
              await moveItem(item.id, "up");
            })
          }
          className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Up
        </button>
        <button
          type="button"
          disabled={pending || index === count - 1}
          onClick={() =>
            startTransition(async () => {
              await moveItem(item.id, "down");
            })
          }
          className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-40"
        >
          Down
        </button>
        {item.item_type === "menu" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                if (item.featured) await clearFeatured(item.id);
                else await setFeatured(item.id);
              })
            }
            className="rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-semibold"
          >
            {item.featured ? "Unfeature" : "Feature"}
          </button>
        ) : null}
        <Link
          href={`/items/${item.id}`}
          className="rounded-md bg-[var(--navy)] px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              !confirm(
                `Permanently delete “${item.name}”?\n\nThis removes the item and its uploaded image. Prefer unchecking “Enabled on TV” if you only want to hide it.`,
              )
            ) {
              return;
            }
            startTransition(async () => {
              await deleteItem(item.id, item.image_url);
            });
          }}
          className="rounded-md border border-[var(--coral)]/40 px-2.5 py-1.5 text-xs font-semibold text-[var(--coral)]"
        >
          Delete forever
        </button>
      </div>
    </li>
  );
}

export function MenuItemList({ items }: { items: MenuItem[] }) {
  const [pending, startTransition] = useTransition();
  const [list, setList] = useState(items);

  // Keep local order in sync when the server list changes (add/delete/refresh)
  useEffect(() => {
    setList(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = list.findIndex((item) => item.id === active.id);
    const newIndex = list.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(list, oldIndex, newIndex);
    setList(next);
    startTransition(async () => {
      await reorderItems(next.map((item) => item.id));
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={list.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-black/8">
            {list.map((item, index) => (
              <SortableRow
                key={item.id}
                item={item}
                index={index}
                count={list.length}
                pending={pending}
                startTransition={startTransition}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {list.length === 0 ? (
        <p className="p-8 text-center text-sm text-black/50">
          No items yet. Add the first one to get started.
        </p>
      ) : null}
    </div>
  );
}
