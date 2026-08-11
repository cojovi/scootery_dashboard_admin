#!/usr/bin/env node
/**
 * Seed menu_items from scripts/menu-seed-data.json
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/seed-menu.mjs
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const dataPath = new URL("./menu-seed-data.json", import.meta.url);
const rows = JSON.parse(fs.readFileSync(dataPath, "utf8"));

async function main() {
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delError } = await supabase
    .from("menu_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) throw delError;

  const { error } = await supabase.from("menu_items").insert(rows);
  if (error) throw error;

  console.log(`Seeded ${rows.length} menu items.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
