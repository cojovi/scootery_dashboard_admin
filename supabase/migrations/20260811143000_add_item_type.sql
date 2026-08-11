-- Add item_type so the signage can show non-menu content
-- (employee photos, employee of the month, social media posts)

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'menu';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_item_type_check'
  ) THEN
    ALTER TABLE public.menu_items
      ADD CONSTRAINT menu_items_item_type_check
      CHECK (item_type IN ('menu', 'employee_photo', 'employee_of_month', 'social_post'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS menu_items_type_idx ON public.menu_items (item_type);
