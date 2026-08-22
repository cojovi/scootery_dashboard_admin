-- Wix-hosted images (still ~70 of 73 rows, pre-dating the Supabase Storage
-- migration) carry Wix's own thumbnail transform in the URL — literal
-- w_49,h_49 / w_147,h_196 sizing plus a blur_2 param — meant for tiny list
-- thumbnails, not a TV card. The web client has always rewritten this
-- client-side (index.html hiResUrl()) before rendering; get_signage_payload()
-- did not, so the native client (which has no equivalent rewrite) was
-- rendering raw 49x49 blurred Wix thumbnails stretched across a TV-sized
-- card. Move the rewrite into the payload itself so every client — web
-- included, its own hiResUrl() call becomes a harmless no-op on an
-- already-rewritten URL — gets a correctly sized image without needing to
-- know Wix's URL scheme at all.

CREATE OR REPLACE FUNCTION public.hi_res_image_url(url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN url IS NULL OR url NOT LIKE '%wixstatic.com%' THEN url
    ELSE regexp_replace(url, '/v1/fill/[^/]+/', '/v1/fill/w_800,h_800,al_c,q_90,enc_auto/')
  END;
$$;

REVOKE ALL ON FUNCTION public.hi_res_image_url(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hi_res_image_url(text) TO anon, authenticated;

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
  SELECT jsonb_build_object('name', name, 'description', coalesce(description, ''), 'image', public.hi_res_image_url(image_url))
  INTO featured_item
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'menu' AND featured = true
  ORDER BY sort_order
  LIMIT 1;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', public.hi_res_image_url(image_url)
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO menu_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'menu' AND featured = false;

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', public.hi_res_image_url(image_url)
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO photo_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'employee_photo';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', public.hi_res_image_url(image_url)
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO eotm_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'employee_of_month';

  SELECT coalesce(jsonb_agg(jsonb_build_object(
           'name', name, 'description', coalesce(description, ''), 'image', public.hi_res_image_url(image_url)
         ) ORDER BY sort_order), '[]'::jsonb)
  INTO social_arr
  FROM public.menu_items
  WHERE enabled = true AND item_type = 'social_post';

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
