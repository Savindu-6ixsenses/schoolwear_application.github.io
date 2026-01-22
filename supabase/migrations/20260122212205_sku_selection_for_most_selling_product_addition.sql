
  create table "public"."most_selling_products" (
    "Sage Code" text not null,
    "Product Name" text,
    "Brand Name" text,
    "Type" bigint
      );


alter table "public"."most_selling_products" enable row level security;

CREATE UNIQUE INDEX most_selling_products_pkey ON public.most_selling_products USING btree ("Sage Code");

alter table "public"."most_selling_products" add constraint "most_selling_products_pkey" PRIMARY KEY using index "most_selling_products_pkey";

grant delete on table "public"."most_selling_products" to "anon";

grant insert on table "public"."most_selling_products" to "anon";

grant references on table "public"."most_selling_products" to "anon";

grant select on table "public"."most_selling_products" to "anon";

grant trigger on table "public"."most_selling_products" to "anon";

grant truncate on table "public"."most_selling_products" to "anon";

grant update on table "public"."most_selling_products" to "anon";

grant delete on table "public"."most_selling_products" to "authenticated";

grant insert on table "public"."most_selling_products" to "authenticated";

grant references on table "public"."most_selling_products" to "authenticated";

grant select on table "public"."most_selling_products" to "authenticated";

grant trigger on table "public"."most_selling_products" to "authenticated";

grant truncate on table "public"."most_selling_products" to "authenticated";

grant update on table "public"."most_selling_products" to "authenticated";

grant delete on table "public"."most_selling_products" to "service_role";

grant insert on table "public"."most_selling_products" to "service_role";

grant references on table "public"."most_selling_products" to "service_role";

grant select on table "public"."most_selling_products" to "service_role";

grant trigger on table "public"."most_selling_products" to "service_role";

grant truncate on table "public"."most_selling_products" to "service_role";

grant update on table "public"."most_selling_products" to "service_role";


  create policy "admin can do all for this table"
  on "public"."most_selling_products"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public."Roles")))))
with check ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = auth.uid()) AND (ur.role = 'admin'::public."Roles")))));



