drop function if exists "public"."get_products_to_create_v2"(in_store_code text, in_design_code uuid);

alter table "public"."new_all_products_4" add column "color_code" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_products_to_create_v2(in_store_code text, in_design_code uuid DEFAULT NULL::uuid)
 RETURNS TABLE("SAGE Code" text, "Product Name" text, "Brand Name" text, "Product Description" text, "Product Weight" real, "Category" text, "Product Code/SKU" text, size_variations text, naming_method smallint, naming_fields jsonb, product_status text, color_code text)
 LANGUAGE plpgsql
AS $function$
begin
  return query
    select
      -- p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
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


