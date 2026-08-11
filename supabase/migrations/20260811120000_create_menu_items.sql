-- Scootery menu_items + storage for admin portal / TV signage

CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS menu_items_enabled_sort_idx
  ON public.menu_items (enabled, sort_order);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS menu_items_set_updated_at ON public.menu_items;
CREATE TRIGGER menu_items_set_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Keep at most one featured item by clearing others before insert/update
CREATE OR REPLACE FUNCTION public.clear_other_featured()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.featured IS TRUE THEN
    UPDATE public.menu_items
    SET featured = false
    WHERE id IS DISTINCT FROM NEW.id
      AND featured = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS menu_items_clear_other_featured ON public.menu_items;
CREATE TRIGGER menu_items_clear_other_featured
  BEFORE INSERT OR UPDATE OF featured ON public.menu_items
  FOR EACH ROW
  WHEN (NEW.featured = true)
  EXECUTE FUNCTION public.clear_other_featured();

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- New Supabase projects no longer expose public tables to the Data API by
-- default. Grant only the operations each client role needs; RLS below still
-- controls which rows are accessible.
GRANT SELECT ON TABLE public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.menu_items TO authenticated;

DROP POLICY IF EXISTS "Public can read enabled menu items" ON public.menu_items;
CREATE POLICY "Public can read enabled menu items"
  ON public.menu_items
  FOR SELECT
  TO anon
  USING (enabled = true);

DROP POLICY IF EXISTS "Authenticated can read all menu items" ON public.menu_items;
CREATE POLICY "Authenticated can read all menu items"
  ON public.menu_items
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated can insert menu items" ON public.menu_items;
CREATE POLICY "Authenticated can insert menu items"
  ON public.menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update menu items" ON public.menu_items;
CREATE POLICY "Authenticated can update menu items"
  ON public.menu_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete menu items" ON public.menu_items;
CREATE POLICY "Authenticated can delete menu items"
  ON public.menu_items
  FOR DELETE
  TO authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read menu images" ON storage.objects;
CREATE POLICY "Public read menu images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated upload menu images" ON storage.objects;
CREATE POLICY "Authenticated upload menu images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated update menu images" ON storage.objects;
CREATE POLICY "Authenticated update menu images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-images')
  WITH CHECK (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Authenticated delete menu images" ON storage.objects;
CREATE POLICY "Authenticated delete menu images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-images');
