drop view if exists "public"."v_store_design_summary";

alter table "public"."designs" add column "store_design_index" integer;

alter table "public"."new_all_products_4" alter column "color_code" set default 'XX'::text;

alter table "public"."new_all_products_4" alter column "color_code" set not null;

alter table "public"."stores_products_designs_2" add column "product_name" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.reorder_design_index_per_store()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  affected_store text;
BEGIN
  -- For DELETE, only OLD is available
  affected_store := OLD.store_code;

  -- Recalculate contiguous index per store ordered by created_at
  WITH ordered AS (
    SELECT
      d."Design_Id",
      ROW_NUMBER() OVER (
        PARTITION BY d.store_code
        ORDER BY d.created_at ASC
      ) AS new_index
    FROM public.designs d
    WHERE d.store_code = affected_store
  )
  UPDATE public.designs d
  SET store_design_index = o.new_index
  FROM ordered o
  WHERE d."Design_Id" = o."Design_Id";

  RETURN NULL; -- AFTER trigger
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_store_design_index()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.store_design_index := (
    SELECT COALESCE(MAX(store_design_index), 0) + 1
    FROM public.designs
    WHERE store_code = NEW.store_code
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_added_products_json(store_code_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  result jsonb := '{}'::jsonb;
  rec record;
  key text;
BEGIN
  FOR rec IN
    SELECT
      sp."Design_ID",
      sp."sage_code" AS sage_code,
      np."Product Name"::text AS productName,
      sp."product_name",
      sp.size_variations,
      np."Category",
      d."Design_Guideline",
      sp."naming_method",
      sp."naming_fields",
      sp.product_status::text
    FROM public.stores_products_designs_2 sp
    LEFT JOIN public.new_all_products_4 np 
      ON np."SAGE Code" = sp."sage_code"
    LEFT JOIN public.designs d 
      ON d."Design_Id" = sp."Design_ID"   -- adjust cast here if needed
    WHERE sp."Store_Code" = store_code_input
    ORDER BY d."created_at"
  LOOP
    -- use text key for JSON
    key := rec."Design_ID"::text;

    result := jsonb_set(
      result,
      ARRAY[key],
      COALESCE(result -> key, '[]'::jsonb) ||
      to_jsonb(
        jsonb_build_object(
          'sage_code',        rec.sage_code,
          'productName',      rec.productName,
          'newProductName',   rec.product_name,
          'sizeVariations',   rec.size_variations,
          'category',         rec."Category",
          'designGuideline',  rec."Design_Guideline",
          'naming_method',    rec."naming_method",
          'naming_fields',    rec."naming_fields",
          'product_status',   rec.product_status
        )
      )
    );
  END LOOP;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_products_to_create_v2(in_store_code text, in_design_code uuid DEFAULT NULL::uuid)
 RETURNS TABLE("SAGE Code" text, "Product Name" text, "Brand Name" text, "Product Description" text, "Product Weight" real, "Category" text, "Product Code/SKU" text, size_variations text, naming_method smallint, naming_fields jsonb, product_status text, color_code text)
 LANGUAGE plpgsql
AS $function$
begin
  return query
    select
      -- p."Product ID",
      p."SAGE Code"::text,
      spd."product_name"::text,
      p."Brand Name"::text,
      p."Product Description"::text,
      p."Product Weight"::real,
      p."Category"::text,
      p."Product Code/SKU"::text,
      spd.size_variations,
      spd.naming_method,
      spd.naming_fields,
      spd.product_status::text,
      p."color_code"
    from
      stores_products_designs_2 spd 
      -- left join new_all_products_4 p on spd."Product_ID" = p."Product ID"
      left join new_all_products_4 p on spd."sage_code" = p."SAGE Code"
    where spd."Store_Code" = in_store_code 
    and spd."Design_ID" = in_design_code
    order by p."Category", p."created_at" ,p."Product Name";
end;
$function$
;

create or replace view "public"."v_designs" as  SELECT d."Design_Id" AS design_id,
    d."Design_Guideline" AS design_guideline,
    g.design_description,
    d."Image_URL" AS image_url,
    d.height,
    d.width,
    d."Design_Name" AS design_name,
    d.store_code,
    n.notes,
    d.store_design_index
   FROM ((public.designs d
     JOIN public.design_guidelines g ON ((g.design_guideline = (d."Design_Guideline")::text)))
     LEFT JOIN public.notes n ON ((n.design_id = d."Design_Id")));


create or replace view "public"."v_store_design_summary" as  SELECT s.store_code,
    s.store_name,
    s.start_date AS required_date,
    d."Design_Name" AS design_name,
    d."Design_Id" AS design_id,
    count(DISTINCT spd.sage_code) AS product_count,
    string_agg(DISTINCT p."Category", ', '::text ORDER BY p."Category") AS categories,
    s.status
   FROM (((public.designs d
     JOIN public.stores s ON (((s.store_code)::text = (d.store_code)::text)))
     LEFT JOIN public.stores_products_designs_2 spd ON ((((spd."Store_Code")::text = (d.store_code)::text) AND (spd."Design_ID" = d."Design_Id"))))
     LEFT JOIN public.new_all_products_4 p ON ((p."SAGE Code" = spd.sage_code)))
  GROUP BY s.store_code, s.store_name, s.start_date, s.status, d."Design_Name", d."Design_Id";


CREATE TRIGGER trg_reorder_design_index AFTER DELETE ON public.designs FOR EACH ROW EXECUTE FUNCTION public.reorder_design_index_per_store();

CREATE TRIGGER trigger_set_store_design_index BEFORE INSERT ON public.designs FOR EACH ROW EXECUTE FUNCTION public.set_store_design_index();


