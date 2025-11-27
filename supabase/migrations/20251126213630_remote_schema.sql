drop extension if exists "pg_net";

drop policy "Enable read access for all users" on "public"."products_table";

drop policy "Enable insert for authenticated users only" on "public"."stores_products_designs";

drop policy "Enable read access for all users" on "public"."stores_products_designs";

revoke delete on table "public"."All_Products" from "anon";

revoke insert on table "public"."All_Products" from "anon";

revoke references on table "public"."All_Products" from "anon";

revoke select on table "public"."All_Products" from "anon";

revoke trigger on table "public"."All_Products" from "anon";

revoke truncate on table "public"."All_Products" from "anon";

revoke update on table "public"."All_Products" from "anon";

revoke delete on table "public"."All_Products" from "authenticated";

revoke insert on table "public"."All_Products" from "authenticated";

revoke references on table "public"."All_Products" from "authenticated";

revoke select on table "public"."All_Products" from "authenticated";

revoke trigger on table "public"."All_Products" from "authenticated";

revoke truncate on table "public"."All_Products" from "authenticated";

revoke update on table "public"."All_Products" from "authenticated";

revoke delete on table "public"."All_Products" from "service_role";

revoke insert on table "public"."All_Products" from "service_role";

revoke references on table "public"."All_Products" from "service_role";

revoke select on table "public"."All_Products" from "service_role";

revoke trigger on table "public"."All_Products" from "service_role";

revoke truncate on table "public"."All_Products" from "service_role";

revoke update on table "public"."All_Products" from "service_role";

revoke delete on table "public"."New_All_Products_1" from "anon";

revoke insert on table "public"."New_All_Products_1" from "anon";

revoke references on table "public"."New_All_Products_1" from "anon";

revoke select on table "public"."New_All_Products_1" from "anon";

revoke trigger on table "public"."New_All_Products_1" from "anon";

revoke truncate on table "public"."New_All_Products_1" from "anon";

revoke update on table "public"."New_All_Products_1" from "anon";

revoke delete on table "public"."New_All_Products_1" from "authenticated";

revoke insert on table "public"."New_All_Products_1" from "authenticated";

revoke references on table "public"."New_All_Products_1" from "authenticated";

revoke select on table "public"."New_All_Products_1" from "authenticated";

revoke trigger on table "public"."New_All_Products_1" from "authenticated";

revoke truncate on table "public"."New_All_Products_1" from "authenticated";

revoke update on table "public"."New_All_Products_1" from "authenticated";

revoke delete on table "public"."New_All_Products_1" from "service_role";

revoke insert on table "public"."New_All_Products_1" from "service_role";

revoke references on table "public"."New_All_Products_1" from "service_role";

revoke select on table "public"."New_All_Products_1" from "service_role";

revoke trigger on table "public"."New_All_Products_1" from "service_role";

revoke truncate on table "public"."New_All_Products_1" from "service_role";

revoke update on table "public"."New_All_Products_1" from "service_role";

revoke delete on table "public"."Products_Designs" from "anon";

revoke insert on table "public"."Products_Designs" from "anon";

revoke references on table "public"."Products_Designs" from "anon";

revoke select on table "public"."Products_Designs" from "anon";

revoke trigger on table "public"."Products_Designs" from "anon";

revoke truncate on table "public"."Products_Designs" from "anon";

revoke update on table "public"."Products_Designs" from "anon";

revoke delete on table "public"."Products_Designs" from "authenticated";

revoke insert on table "public"."Products_Designs" from "authenticated";

revoke references on table "public"."Products_Designs" from "authenticated";

revoke select on table "public"."Products_Designs" from "authenticated";

revoke trigger on table "public"."Products_Designs" from "authenticated";

revoke truncate on table "public"."Products_Designs" from "authenticated";

revoke update on table "public"."Products_Designs" from "authenticated";

revoke delete on table "public"."Products_Designs" from "service_role";

revoke insert on table "public"."Products_Designs" from "service_role";

revoke references on table "public"."Products_Designs" from "service_role";

revoke select on table "public"."Products_Designs" from "service_role";

revoke trigger on table "public"."Products_Designs" from "service_role";

revoke truncate on table "public"."Products_Designs" from "service_role";

revoke update on table "public"."Products_Designs" from "service_role";

revoke delete on table "public"."Stores_Products" from "anon";

revoke insert on table "public"."Stores_Products" from "anon";

revoke references on table "public"."Stores_Products" from "anon";

revoke select on table "public"."Stores_Products" from "anon";

revoke trigger on table "public"."Stores_Products" from "anon";

revoke truncate on table "public"."Stores_Products" from "anon";

revoke update on table "public"."Stores_Products" from "anon";

revoke delete on table "public"."Stores_Products" from "authenticated";

revoke insert on table "public"."Stores_Products" from "authenticated";

revoke references on table "public"."Stores_Products" from "authenticated";

revoke select on table "public"."Stores_Products" from "authenticated";

revoke trigger on table "public"."Stores_Products" from "authenticated";

revoke truncate on table "public"."Stores_Products" from "authenticated";

revoke update on table "public"."Stores_Products" from "authenticated";

revoke delete on table "public"."Stores_Products" from "service_role";

revoke insert on table "public"."Stores_Products" from "service_role";

revoke references on table "public"."Stores_Products" from "service_role";

revoke select on table "public"."Stores_Products" from "service_role";

revoke trigger on table "public"."Stores_Products" from "service_role";

revoke truncate on table "public"."Stores_Products" from "service_role";

revoke update on table "public"."Stores_Products" from "service_role";

revoke delete on table "public"."new_all_products_1" from "anon";

revoke insert on table "public"."new_all_products_1" from "anon";

revoke references on table "public"."new_all_products_1" from "anon";

revoke select on table "public"."new_all_products_1" from "anon";

revoke trigger on table "public"."new_all_products_1" from "anon";

revoke truncate on table "public"."new_all_products_1" from "anon";

revoke update on table "public"."new_all_products_1" from "anon";

revoke delete on table "public"."new_all_products_1" from "authenticated";

revoke insert on table "public"."new_all_products_1" from "authenticated";

revoke references on table "public"."new_all_products_1" from "authenticated";

revoke select on table "public"."new_all_products_1" from "authenticated";

revoke trigger on table "public"."new_all_products_1" from "authenticated";

revoke truncate on table "public"."new_all_products_1" from "authenticated";

revoke update on table "public"."new_all_products_1" from "authenticated";

revoke delete on table "public"."new_all_products_1" from "service_role";

revoke insert on table "public"."new_all_products_1" from "service_role";

revoke references on table "public"."new_all_products_1" from "service_role";

revoke select on table "public"."new_all_products_1" from "service_role";

revoke trigger on table "public"."new_all_products_1" from "service_role";

revoke truncate on table "public"."new_all_products_1" from "service_role";

revoke update on table "public"."new_all_products_1" from "service_role";

revoke delete on table "public"."new_all_products_2" from "anon";

revoke insert on table "public"."new_all_products_2" from "anon";

revoke references on table "public"."new_all_products_2" from "anon";

revoke select on table "public"."new_all_products_2" from "anon";

revoke trigger on table "public"."new_all_products_2" from "anon";

revoke truncate on table "public"."new_all_products_2" from "anon";

revoke update on table "public"."new_all_products_2" from "anon";

revoke delete on table "public"."new_all_products_2" from "authenticated";

revoke insert on table "public"."new_all_products_2" from "authenticated";

revoke references on table "public"."new_all_products_2" from "authenticated";

revoke select on table "public"."new_all_products_2" from "authenticated";

revoke trigger on table "public"."new_all_products_2" from "authenticated";

revoke truncate on table "public"."new_all_products_2" from "authenticated";

revoke update on table "public"."new_all_products_2" from "authenticated";

revoke delete on table "public"."new_all_products_2" from "service_role";

revoke insert on table "public"."new_all_products_2" from "service_role";

revoke references on table "public"."new_all_products_2" from "service_role";

revoke select on table "public"."new_all_products_2" from "service_role";

revoke trigger on table "public"."new_all_products_2" from "service_role";

revoke truncate on table "public"."new_all_products_2" from "service_role";

revoke update on table "public"."new_all_products_2" from "service_role";

revoke delete on table "public"."new_all_products_3" from "anon";

revoke insert on table "public"."new_all_products_3" from "anon";

revoke references on table "public"."new_all_products_3" from "anon";

revoke select on table "public"."new_all_products_3" from "anon";

revoke trigger on table "public"."new_all_products_3" from "anon";

revoke truncate on table "public"."new_all_products_3" from "anon";

revoke update on table "public"."new_all_products_3" from "anon";

revoke delete on table "public"."new_all_products_3" from "authenticated";

revoke insert on table "public"."new_all_products_3" from "authenticated";

revoke references on table "public"."new_all_products_3" from "authenticated";

revoke select on table "public"."new_all_products_3" from "authenticated";

revoke trigger on table "public"."new_all_products_3" from "authenticated";

revoke truncate on table "public"."new_all_products_3" from "authenticated";

revoke update on table "public"."new_all_products_3" from "authenticated";

revoke delete on table "public"."new_all_products_3" from "service_role";

revoke insert on table "public"."new_all_products_3" from "service_role";

revoke references on table "public"."new_all_products_3" from "service_role";

revoke select on table "public"."new_all_products_3" from "service_role";

revoke trigger on table "public"."new_all_products_3" from "service_role";

revoke truncate on table "public"."new_all_products_3" from "service_role";

revoke update on table "public"."new_all_products_3" from "service_role";

revoke delete on table "public"."products_table" from "anon";

revoke insert on table "public"."products_table" from "anon";

revoke references on table "public"."products_table" from "anon";

revoke select on table "public"."products_table" from "anon";

revoke trigger on table "public"."products_table" from "anon";

revoke truncate on table "public"."products_table" from "anon";

revoke update on table "public"."products_table" from "anon";

revoke delete on table "public"."products_table" from "authenticated";

revoke insert on table "public"."products_table" from "authenticated";

revoke references on table "public"."products_table" from "authenticated";

revoke select on table "public"."products_table" from "authenticated";

revoke trigger on table "public"."products_table" from "authenticated";

revoke truncate on table "public"."products_table" from "authenticated";

revoke update on table "public"."products_table" from "authenticated";

revoke delete on table "public"."products_table" from "service_role";

revoke insert on table "public"."products_table" from "service_role";

revoke references on table "public"."products_table" from "service_role";

revoke select on table "public"."products_table" from "service_role";

revoke trigger on table "public"."products_table" from "service_role";

revoke truncate on table "public"."products_table" from "service_role";

revoke update on table "public"."products_table" from "service_role";

revoke delete on table "public"."stores_products_designs" from "anon";

revoke insert on table "public"."stores_products_designs" from "anon";

revoke references on table "public"."stores_products_designs" from "anon";

revoke select on table "public"."stores_products_designs" from "anon";

revoke trigger on table "public"."stores_products_designs" from "anon";

revoke truncate on table "public"."stores_products_designs" from "anon";

revoke update on table "public"."stores_products_designs" from "anon";

revoke delete on table "public"."stores_products_designs" from "authenticated";

revoke insert on table "public"."stores_products_designs" from "authenticated";

revoke references on table "public"."stores_products_designs" from "authenticated";

revoke select on table "public"."stores_products_designs" from "authenticated";

revoke trigger on table "public"."stores_products_designs" from "authenticated";

revoke truncate on table "public"."stores_products_designs" from "authenticated";

revoke update on table "public"."stores_products_designs" from "authenticated";

revoke delete on table "public"."stores_products_designs" from "service_role";

revoke insert on table "public"."stores_products_designs" from "service_role";

revoke references on table "public"."stores_products_designs" from "service_role";

revoke select on table "public"."stores_products_designs" from "service_role";

revoke trigger on table "public"."stores_products_designs" from "service_role";

revoke truncate on table "public"."stores_products_designs" from "service_role";

revoke update on table "public"."stores_products_designs" from "service_role";

alter table "public"."All_Products" drop constraint "All_Products_Enum_key";

alter table "public"."New_All_Products_1" drop constraint "New_All_Products_1_Product ID_key";

alter table "public"."Products_Designs" drop constraint "Products_Designs_Design_id_fkey";

alter table "public"."Products_Designs" drop constraint "Products_Designs_Product_id_fkey";

alter table "public"."Stores_Products" drop constraint "Stores_Products_Product_Sage_Code_fkey";

alter table "public"."Stores_Products" drop constraint "Stores_Products_Store_Code_fkey";

alter table "public"."designs" drop constraint "designs_Design_Name_check";

alter table "public"."new_all_products_1" drop constraint "new_all_products_1_Product ID_key";

alter table "public"."new_all_products_3" drop constraint "new_all_products_3_Product ID_key";

alter table "public"."products_table" drop constraint "Products_Table_SAGE Code_key";

alter table "public"."stores_products_designs" drop constraint "Stores_Products_Designs_Product_Sage_Code_fkey";

alter table "public"."stores_products_designs" drop constraint "Stores_Products_Designs_Store_Code_fkey";

drop function if exists "public"."get_filtered_store_products_v2"(in_store_code text, in_design_id text, search_query text, category_list text[], in_page_size integer, in_page integer);

drop view if exists "public"."v_store_design_summary";

alter table "public"."All_Products" drop constraint "All_Products_pkey";

alter table "public"."Products_Designs" drop constraint "Products_Designs_pkey";

alter table "public"."new_all_products_3" drop constraint "new_all_products_3_pkey";

alter table "public"."products_table" drop constraint "Products_Table_pkey";

alter table "public"."stores_products_designs" drop constraint "Stores_Products_Designs_pkey";

drop index if exists "public"."All_Products_Enum_key";

drop index if exists "public"."All_Products_pkey";

drop index if exists "public"."New_All_Products_1_Product ID_key";

drop index if exists "public"."Products_Designs_pkey";

drop index if exists "public"."Products_Table_SAGE Code_key";

drop index if exists "public"."Products_Table_pkey";

drop index if exists "public"."Stores_Products_Designs_pkey";

drop index if exists "public"."new_all_products_1_Product ID_key";

drop index if exists "public"."new_all_products_3_Product ID_key";

drop index if exists "public"."new_all_products_3_pkey";

drop index if exists "public"."stores_products_designs_2_pkey";

drop table "public"."All_Products";

drop table "public"."New_All_Products_1";

drop table "public"."Products_Designs";

drop table "public"."Stores_Products";

drop table "public"."new_all_products_1";

drop table "public"."new_all_products_2";

drop table "public"."new_all_products_3";

drop table "public"."products_table";

drop table "public"."stores_products_designs";

alter table "public"."stores_products_designs_2" alter column "Design_ID" set data type uuid using "Design_ID"::uuid;

CREATE UNIQUE INDEX stores_products_designs_2_pkey ON public.stores_products_designs_2 USING btree ("Store_Code", "Design_ID", sage_code);

alter table "public"."stores_products_designs_2" add constraint "stores_products_designs_2_Design_ID_fkey" FOREIGN KEY ("Design_ID") REFERENCES public.designs("Design_Id") ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."stores_products_designs_2" validate constraint "stores_products_designs_2_Design_ID_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_filtered_store_products_v2(in_store_code text, in_design_id uuid DEFAULT NULL::uuid, search_query text DEFAULT NULL::text, category_list text[] DEFAULT NULL::text[], in_page_size integer DEFAULT 20, in_page integer DEFAULT 1)
 RETURNS TABLE("TotalCount" bigint, "SAGE Code" text, "Product Name" text, "Brand Name" text, "Design_ID" uuid, size_variations text, naming_method smallint, naming_fields jsonb, product_status text, "Product Code/SKU" text, "Category" text, is_added boolean, "XS" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH filtered_products AS (
    SELECT
      p."SAGE Code",
      p."Product Name",
      p."Brand Name",
      spd."Design_ID",              -- uuid
      spd.size_variations,
      spd.naming_method,
      spd.naming_fields,
      spd.product_status::text,
      p."Product Code/SKU",
      p."Category",
      spd."Store_Code" IS NOT NULL AS is_added,
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

create or replace view "public"."v_store_design_summary" as  SELECT s.store_code,
    s.store_name,
    s.start_date AS required_date,
    spd."Design_ID" AS design_id,
    count(DISTINCT spd.sage_code) AS product_count,
    string_agg(DISTINCT p."Category", ', '::text ORDER BY p."Category") AS categories,
    s.status
   FROM ((public.stores_products_designs_2 spd
     RIGHT JOIN public.stores s ON (((s.store_code)::text = (spd."Store_Code")::text)))
     LEFT JOIN public.new_all_products_4 p ON ((p."SAGE Code" = spd.sage_code)))
  GROUP BY s.store_code, s.store_name, s.end_date, spd."Design_ID";


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "list_all_buckets"
  on "storage"."buckets"
  as permissive
  for select
  to public
using (true);



  create policy "Upload_images2 1wf9cnf_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "Upload_images2 1wf9cnf_1"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "Upload_images2 1wf9cnf_2"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'design-logo-images'::text));



  create policy "Upload_images2 1wf9cnf_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "logs_report_policy f1lxup_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'logs-reports'::text));



  create policy "logs_report_policy f1lxup_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'logs-reports'::text));



  create policy "logs_report_policy f1lxup_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'logs-reports'::text));



  create policy "logs_report_policy f1lxup_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'logs-reports'::text));



  create policy "upload_images 1va6avm_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'uploads'::text));



  create policy "upload_images 1va6avm_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'uploads'::text));



  create policy "upload_images 1va6avm_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'uploads'::text));



  create policy "upload_images 1wf9cnf_0"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'design-logo-images'::text));



  create policy "upload_images 1wf9cnf_1"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "upload_images 1wf9cnf_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "upload_images 1wf9cnf_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'design-logo-images'::text));



  create policy "upload_images_1 1va6avm_1"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'uploads'::text));



  create policy "upload_images_1 1va6avm_2"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'uploads'::text));



  create policy "upload_images_1 1va6avm_3"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'uploads'::text));



