-- One-call bulk reorder for drag-and-drop in the admin.
-- SECURITY INVOKER (default): RLS still applies, so only authenticated
-- users can actually change rows.

CREATE OR REPLACE FUNCTION public.reorder_menu_items(item_ids uuid[])
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.menu_items m
  SET sort_order = u.ord
  FROM unnest(item_ids) WITH ORDINALITY AS u(id, ord)
  WHERE m.id = u.id;
$$;

REVOKE ALL ON FUNCTION public.reorder_menu_items(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_menu_items(uuid[]) TO authenticated;
