alter table "public"."stores_products_designs_2" drop constraint "stores_products_designs_2_sage_code_fkey";

drop function if exists "public"."get_products_to_create_v2"(in_store_code text, in_design_code uuid);

alter table "public"."stores_products_designs_2" alter column "product_status" drop default;

alter type "public"."Product_Status" rename to "Product_Status__old_version_to_be_dropped";

create type "public"."Product_Status" as enum ('added', 'modify', 'new', 'rejected', 'removed');

alter table "public"."stores_products_designs_2" alter column product_status type "public"."Product_Status" using product_status::text::"public"."Product_Status";

alter table "public"."stores_products_designs_2" alter column "product_status" set default 'new'::public."Product_Status";

drop type "public"."Product_Status__old_version_to_be_dropped";

alter table "public"."new_all_products_4" add column "Type" text;

alter table "public"."stores" add column "maximum_offset" bigint;

alter table "public"."stores_products_designs_2" add column "created_at" timestamp with time zone default now();

alter table "public"."stores_products_designs_2" add constraint "stores_products_designs_2_sage_code_fkey" FOREIGN KEY (sage_code) REFERENCES public.new_all_products_4("SAGE Code") ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."stores_products_designs_2" validate constraint "stores_products_designs_2_sage_code_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.backup_size_variations()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Check if the status is changing from 'Added' to 'Modified'
    -- IMPORTANT: Ensure 'Added' and 'Modified' match the exact labels in your public.Product_Status enum
    IF OLD.product_status = 'added' AND NEW.product_status = 'modify' THEN
        NEW.notes := OLD.size_variations;
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_product_status_added()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Only act if size_variations and notes are unchanged
  IF NEW.size_variations IS NOT DISTINCT FROM OLD.notes
     AND OLD.product_status NOT IN ('new', 'rejected') THEN
    NEW.product_status := 'added';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_filtered_store_products_v2(in_store_code text, in_design_id uuid DEFAULT NULL::uuid, search_query text DEFAULT NULL::text, category_list text[] DEFAULT NULL::text[], in_page_size integer DEFAULT 20, in_page integer DEFAULT 1)
 RETURNS TABLE("TotalCount" bigint, "SAGE Code" text, "Product Name" text, "Brand Name" text, "Design_ID" uuid, size_variations text, naming_method smallint, naming_fields jsonb, product_status text, "Product Code/SKU" text, "Category" text, is_added boolean, "XS" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
 LANGUAGE plpgsql
AS $function$BEGIN
  RETURN QUERY
  WITH filtered_products AS (
    SELECT
      p."SAGE Code",
      p."Product Name",
      p."Brand Name",
      spd."Design_ID",       -- uuid
      spd.size_variations,
      spd.naming_method,
      spd.naming_fields,
      spd.product_status::text,
      p."Product Code/SKU",
      p."Category",
      CASE
        WHEN spd."Store_Code" IS NULL THEN FALSE
        WHEN spd.product_status='removed' THEN FALSE
        ELSE TRUE
      END AS is_added,
      p."XS",
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    FROM new_all_products_4 p
    LEFT JOIN stores_products_designs_2 spd
      ON p."SAGE Code" = spd."sage_code"
     AND spd."Store_Code" = in_store_code
     -- only filter by design when a design id is provided
     AND (in_design_id IS NULL OR spd."Design_ID" = in_design_id)
    LEFT JOIN stores s
      ON s.store_code = in_store_code
    WHERE
      p."Brand Name" IS NOT NULL
      AND (
        search_query IS NULL
        OR trim(search_query) = ''
        OR p."SAGE Code" ILIKE '%' || trim(search_query) || '%'
        OR p."Product Name" ILIKE '%' || trim(search_query) || '%'
      )
      AND (
        category_list IS NULL
        OR p."Category" = ANY (category_list)
      )
  )
  SELECT
    (SELECT COUNT(*) FROM filtered_products) AS "TotalCount",
    fp.*
  FROM filtered_products fp
  ORDER BY is_added DESC, fp."Product Name"
  LIMIT in_page_size
  OFFSET (in_page - 1) * in_page_size;
END;$function$
;

CREATE OR REPLACE FUNCTION public.get_products_to_create_v2(in_store_code text, in_design_code uuid DEFAULT NULL::uuid)
 RETURNS TABLE("SAGE Code" text, "Product Name" text, "Brand Name" text, "Product Description" text, "Product Weight" real, "Category" text, "Product Code/SKU" text, size_variations text, naming_method smallint, naming_fields jsonb, product_status text, color_code text, type text)
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
      p."color_code",
      p."Type"
    from
      stores_products_designs_2 spd 
      -- left join new_all_products_4 p on spd."Product_ID" = p."Product ID"
      left join new_all_products_4 p on spd."sage_code" = p."SAGE Code"
    where spd."Store_Code" = in_store_code 
    and spd."Design_ID" = in_design_code
    order by p."Category", spd."created_at" asc,p."Product Name";
end;
$function$
;

CREATE TRIGGER trigger_backup_old_sizes BEFORE UPDATE ON public.stores_products_designs_2 FOR EACH ROW EXECUTE FUNCTION public.backup_size_variations();

CREATE TRIGGER trigger_set_product_status_added BEFORE UPDATE ON public.stores_products_designs_2 FOR EACH ROW EXECUTE FUNCTION public.set_product_status_added();


