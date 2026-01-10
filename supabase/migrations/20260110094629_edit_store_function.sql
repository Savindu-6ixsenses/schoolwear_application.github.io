drop policy "Enable admin to access for all data" on "public"."stores";

create or replace view "public"."v_store_design_summary" as  SELECT s.store_code,
    s.store_name,
    s.start_date AS required_date,
    d."Design_Name" AS design_name,
    d."Design_Id" AS design_id,
    count(DISTINCT spd.sage_code) AS product_count,
    string_agg(DISTINCT p."Category", ', '::text ORDER BY p."Category") AS categories,
    s.status
   FROM (((public.stores s
     LEFT JOIN public.designs d ON (((s.store_code)::text = (d.store_code)::text)))
     LEFT JOIN public.stores_products_designs_2 spd ON ((((spd."Store_Code")::text = (s.store_code)::text) AND (spd."Design_ID" = d."Design_Id"))))
     LEFT JOIN public.new_all_products_4 p ON ((p."SAGE Code" = spd.sage_code)))
  GROUP BY s.store_code, s.store_name, s.start_date, s.status, d."Design_Name", d."Design_Id";



  create policy "Enable admin to do all for all data"
  on "public"."stores"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public."Roles")))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public."Roles")))));



