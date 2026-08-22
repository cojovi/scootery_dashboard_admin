-- Single source of truth for TV slide construction.
--
-- The signage client used to fetch raw rows and rebuild the 3/2/3/3/2 grid
-- pattern, the crew-photo chunking, and the interleave-gap math itself in
-- JavaScript (index.html: distributeItems / chunkArray / interleaveSlides).
-- That logic now lives here so any client (the web TV, and the upcoming
-- native Android TV app) gets an already-ordered slide list and just
-- renders by `type` — no duplicated grouping logic to keep in sync.
--
-- Mirrors scootery_dashboard/index.html exactly as of commit a7406d2:
--   - featured menu item -> a single leading "cinematic" slide
--   - remaining menu items, in sort_order -> "grid" slides via [3,2,3,3,2]
--   - employee_photo rows, in sort_order, chunked by 3 -> "crew" slides
--   - employee_of_month rows -> one "eotm" slide each
--   - social_post rows -> one "social" slide each
--   - crew/eotm/social slides spread evenly among the grid slides
--
-- SECURITY INVOKER (default): runs as whatever role calls it, so the
-- existing "Public can read enabled menu items" RLS policy still applies.
-- The explicit enabled = true filters below are redundant with that policy
-- by design (defense in depth), not a substitute for it.

CREATE OR REPLACE FUNCTION public.get_signage_payload()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $$
DECLARE
  featured_item jsonb;
  menu_arr jsonb;
  photo_arr jsonb;
  eotm_arr jsonb;
  social_arr jsonb;
  pattern int[] := ARRAY[3,2,3,3,2];
  menu_slides jsonb := '[]'::jsonb;
  extra_slides jsonb := '[]'::jsonb;
  slides jsonb := '[]'::jsonb;
  n int;
  n_extra int;
  i int;
  p int;
  sz int;
  gap int;
  e int;
  grp jsonb;
  r record;
BEGIN
  SELECT jsonb_build_object('name', name, 'description', coalesce(description, ''), 'image', image_url)
  INTO featured_item
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'menu' AND featured = true
  ORDER BY sort_order
  LIMIT 1;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', image_url
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO menu_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'menu' AND featured = false;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', image_url
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO photo_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'employee_photo';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', image_url
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO eotm_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'employee_of_month';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', image_url
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO social_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'social_post';

  -- Chunk menu items into grid slides via the repeating 3/2/3/3/2 pattern
  n := jsonb_array_length(menu_arr);
  i := 0;
  p := 0;
  WHILE i < n LOOP
    sz := LEAST(pattern[(p % 5) + 1], n - i);
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
    INTO grp
    FROM jsonb_array_elements(menu_arr) WITH ORDINALITY AS t(elem, ord)
    WHERE ord > i AND ord <= i + sz;
    menu_slides := menu_slides || jsonb_build_array(jsonb_build_object('type', 'grid', 'items', grp));
    i := i + sz;
    p := p + 1;
  END LOOP;

  -- Crew slides: employee photos chunked by 3
  n := jsonb_array_length(photo_arr);
  i := 0;
  WHILE i < n LOOP
    sz := LEAST(3, n - i);
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
    INTO grp
    FROM jsonb_array_elements(photo_arr) WITH ORDINALITY AS t(elem, ord)
    WHERE ord > i AND ord <= i + sz;
    extra_slides := extra_slides || jsonb_build_array(jsonb_build_object('type', 'crew', 'items', grp));
    i := i + sz;
  END LOOP;

  FOR r IN SELECT * FROM jsonb_array_elements(eotm_arr) LOOP
    extra_slides := extra_slides || jsonb_build_array(jsonb_build_object('type', 'eotm', 'item', r.value));
  END LOOP;

  FOR r IN SELECT * FROM jsonb_array_elements(social_arr) LOOP
    extra_slides := extra_slides || jsonb_build_array(jsonb_build_object('type', 'social', 'item', r.value));
  END LOOP;

  -- Interleave extra slides evenly among the grid slides
  n := jsonb_array_length(menu_slides);
  n_extra := jsonb_array_length(extra_slides);
  IF n_extra = 0 THEN
    slides := menu_slides;
  ELSIF n = 0 THEN
    slides := extra_slides;
  ELSE
    gap := GREATEST(1, CEIL(n::numeric / (n_extra + 1)));
    e := 0;
    FOR i IN 1..n LOOP
      slides := slides || jsonb_build_array(menu_slides -> (i - 1));
      IF i % gap = 0 AND e < n_extra THEN
        slides := slides || jsonb_build_array(extra_slides -> e);
        e := e + 1;
      END IF;
    END LOOP;
    WHILE e < n_extra LOOP
      slides := slides || jsonb_build_array(extra_slides -> e);
      e := e + 1;
    END LOOP;
  END IF;

  IF featured_item IS NOT NULL THEN
    slides := jsonb_build_array(jsonb_build_object('type', 'cinematic', 'item', featured_item)) || slides;
  END IF;

  RETURN jsonb_build_object('slides', slides, 'generated_at', now());
END;
$$;

REVOKE ALL ON FUNCTION public.get_signage_payload() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_signage_payload() TO anon, authenticated;
