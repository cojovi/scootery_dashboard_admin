"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isItemType, type ItemType } from "@/lib/types";

const BUCKET = "menu-images";

function parseItemType(formData: FormData): ItemType {
  const raw = String(formData.get("item_type") || "menu");
  return isItemType(raw) ? raw : "menu";
}

function revalidateMenu() {
  revalidatePath("/");
  revalidatePath("/preview");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function toggleEnabled(id: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ enabled })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMenu();
}

export async function setFeatured(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ featured: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMenu();
}

export async function clearFeatured(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ featured: false })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMenu();
}

export async function moveItem(id: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: items, error } = await supabase
    .from("menu_items")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  if (!items?.length) return;

  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= items.length) return;

  const current = items[index];
  const other = items[swapIndex];

  const { error: e1 } = await supabase
    .from("menu_items")
    .update({ sort_order: other.sort_order })
    .eq("id", current.id);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from("menu_items")
    .update({ sort_order: current.sort_order })
    .eq("id", other.id);
  if (e2) throw new Error(e2.message);

  revalidateMenu();
}

export async function reorderItems(ids: string[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_menu_items", {
    item_ids: ids,
  });
  if (error) throw new Error(error.message);
  revalidateMenu();
}

export async function deleteItem(id: string, imageUrl: string) {
  const supabase = await createClient();

  if (imageUrl.includes(`/${BUCKET}/`)) {
    const marker = `/${BUCKET}/`;
    const path = imageUrl.split(marker)[1]?.split("?")[0];
    if (path) {
      await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)]);
    }
  }

  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateMenu();
}

export async function createItem(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const enabled = formData.get("enabled") === "on";
  const item_type = parseItemType(formData);
  // Featured only applies to menu items (drives the cinematic menu slide)
  const featured = item_type === "menu" && formData.get("featured") === "on";
  const file = formData.get("image") as File | null;
  const imageOptional = item_type === "social_post";

  if (!name) throw new Error("Name is required");
  if ((!file || file.size === 0) && !imageOptional) {
    throw new Error("Image is required");
  }

  const { data: maxRow } = await supabase
    .from("menu_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? -1) + 1;
  const id = crypto.randomUUID();

  let image_url = "";
  let storagePath: string | null = null;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    storagePath = `${id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });
    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    image_url = publicUrl;
  }

  const { error } = await supabase.from("menu_items").insert({
    id,
    name,
    description,
    image_url,
    enabled,
    featured,
    sort_order,
    item_type,
  });
  if (error) {
    if (storagePath) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
    }
    throw new Error(error.message);
  }

  revalidateMenu();
  redirect("/");
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const enabled = formData.get("enabled") === "on";
  const item_type = parseItemType(formData);
  const featured = item_type === "menu" && formData.get("featured") === "on";
  const existingUrl = String(formData.get("existing_image_url") || "");
  const file = formData.get("image") as File | null;

  if (!name) throw new Error("Name is required");

  let image_url = existingUrl;

  if (file && file.size > 0) {
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/jpeg",
      });
    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    image_url = publicUrl;

    if (existingUrl.includes(`/${BUCKET}/`)) {
      const marker = `/${BUCKET}/`;
      const oldPath = existingUrl.split(marker)[1]?.split("?")[0];
      if (oldPath) {
        await supabase.storage
          .from(BUCKET)
          .remove([decodeURIComponent(oldPath)]);
      }
    }
  }

  const { error } = await supabase
    .from("menu_items")
    .update({
      name,
      description,
      image_url,
      enabled,
      featured,
      item_type,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateMenu();
  redirect("/");
}
