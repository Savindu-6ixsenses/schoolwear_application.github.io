

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "plpgsql_check" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."Design_Types" AS ENUM (
    'Embroidery & Applique',
    'Screen Printing',
    'Other'
);


ALTER TYPE "public"."Design_Types" OWNER TO "postgres";


CREATE TYPE "public"."Product_Status" AS ENUM (
    'added',
    'modify',
    'new',
    'rejected'
);


ALTER TYPE "public"."Product_Status" OWNER TO "postgres";


COMMENT ON TYPE "public"."Product_Status" IS 'Status of the Product';



CREATE TYPE "public"."Roles" AS ENUM (
    'admin',
    'salesrep',
    'supervisor'
);


ALTER TYPE "public"."Roles" OWNER TO "postgres";


COMMENT ON TYPE "public"."Roles" IS 'Roles of the users';



CREATE TYPE "public"."Size_Variations" AS ENUM (
    'XS',
    'SM',
    'MD',
    'LG',
    'XL',
    'X2',
    'X3'
);


ALTER TYPE "public"."Size_Variations" OWNER TO "postgres";


COMMENT ON TYPE "public"."Size_Variations" IS 'Type Variations of a Product';



CREATE TYPE "public"."Store_Status" AS ENUM (
    'Draft',
    'Pending',
    'Approved',
    'Modify',
    'Disabled'
);


ALTER TYPE "public"."Store_Status" OWNER TO "postgres";


COMMENT ON TYPE "public"."Store_Status" IS 'Stores the current status of the Store';



CREATE OR REPLACE FUNCTION "public"."create_or_replace_store_products_view"("in_store_code" "text", "in_design_id" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Create the view
  execute format('
    create or replace view vw_store_products as
    select
      s.store_code,
      s.store_name,
      s.end_date,
      p."SAGE Code",
      p."Product Name",
      p."Price",
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3",
      spd."Design_Id",
      spd."size_variations",
      spd."Store_Code" is not null as is_added
    from
      products_table p
      left join stores_products_designs spd on p."SAGE Code" = spd."Product_Sage_Code"
      and spd."Store_Code" = %L
      and spd."Design_Id" = %L
      left join stores s on s.store_code = %L
    order by is_added desc, p."Product Name";
  ', in_store_code, in_design_id, in_store_code);
end;
$$;


ALTER FUNCTION "public"."create_or_replace_store_products_view"("in_store_code" "text", "in_design_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_store_if_not_approved"("p_store_code" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_status public."Store_Status";
  v_rows int := 0;
begin
  -- Read status with RLS applied
  select s.status into v_status
  from public.stores s
  where s.store_code = p_store_code;

  if v_status is null then
    raise exception 'Store % not found or not visible due to RLS', p_store_code;
  end if;

  if v_status not in ('Draft'::public."Store_Status",'Pending'::public."Store_Status") then
    raise exception 'Store % is % - only Draft/Pending stores can be deleted', p_store_code, v_status;
  end if;

  delete from public.stores s
  where s.store_code = p_store_code;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  return json_build_object(
    'store_code', p_store_code,
    'deleted', (v_rows > 0)
  );
end;
$$;


ALTER FUNCTION "public"."delete_store_if_not_approved"("p_store_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."discard_store_updates"("p_store_code" "text") RETURNS "json"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  v_ok boolean;
  v_updated int := 0;
  v_deleted int := 0;
begin
  -- Verify store is actually in Modify (DB is the source of truth)
  select public.is_store_in_modify(p_store_code) into v_ok;
  if v_ok is not true then
    raise exception 'Store % is not in Modify status (or not visible due to RLS)', p_store_code;
  end if;

  -- STEP 1: revert rows in 'modify'
  --   - size_variations := notes (if notes has a meaningful value)
  with tgt as (
    select
      "Store_Code",
      "sage_code",
      "Design_ID",
      notes as notes_txt
    from public.stores_products_designs_2
    where "Store_Code" = p_store_code
      and product_status = 'modify'::public."Product_Status"
  )
  update public.stores_products_designs_2 spd
  set
    size_variations = coalesce(nullif(tgt.notes_txt, 'NULL'), spd.size_variations),
    notes = null,  -- won't keep the updates after discarding
    product_status = 'added'
  from tgt
  where spd."Store_Code" = tgt."Store_Code"
    and spd."sage_code" = tgt."sage_code"
    and spd."Design_ID"  = tgt."Design_ID";

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- STEP 2: delete rows never sent to BC
  delete from public.stores_products_designs_2 spd
  where spd."Store_Code" = p_store_code
    and spd.product_status = 'new'::public."Product_Status";

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- STEP 3:Convert the store status
  update public.stores s
  set status = 'Approved'::public."Store_Status"
  where s.store_code = p_store_code;

  return json_build_object(
    'store_code', p_store_code,
    'updated_modify_rows', v_updated,
    'deleted_new_rows', v_deleted
  );
end;
$$;


ALTER FUNCTION "public"."discard_store_updates"("p_store_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_added_products_json"("store_code_input" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
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
$$;


ALTER FUNCTION "public"."get_added_products_json"("store_code_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtered_store_products"("in_store_code" "text", "in_design_id" "text", "search_query" "text" DEFAULT NULL::"text", "category_list" "text"[] DEFAULT NULL::"text"[], "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("Product ID" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Design_ID" "text", "size_variations" "text", "Category" "text", "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
      p."Brand Name"::text,
      spd."Design_ID",
      spd.size_variations,
      p."Category",
      spd."Store_Code" is not null as is_added,
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    from
      new_all_products_3 p
      left join stores_products_designs_2 spd on p."Product ID" = spd."Product_ID"
      and spd."Store_Code" = in_store_code
      and spd."Design_ID" = in_design_id
      left join stores s on s.store_code = in_store_code
    where
      p."Brand Name" is not null -- Exclude rows where "Brand Name" is NULL
      -- Apply search query if provided
      AND (search_query IS NULL OR p."SAGE Code" ILIKE '%' || search_query || '%' OR p."Product Name" ILIKE '%' || search_query || '%')
      -- Apply category filter if provided
      AND (category_list IS NULL OR p."Category" = ANY(category_list))
    order by is_added desc, p."Product Name"
    limit in_page_size
    offset (in_page - 1) * in_page_size;
end;
$$;


ALTER FUNCTION "public"."get_filtered_store_products"("in_store_code" "text", "in_design_id" "text", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_filtered_store_products_v2"("in_store_code" "text", "in_design_id" "uuid" DEFAULT NULL::"uuid", "search_query" "text" DEFAULT NULL::"text", "category_list" "text"[] DEFAULT NULL::"text"[], "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("TotalCount" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Design_ID" "uuid", "size_variations" "text", "naming_method" smallint, "naming_fields" "jsonb", "product_status" "text", "Product Code/SKU" "text", "Category" "text", "is_added" boolean, "XS" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."get_filtered_store_products_v2"("in_store_code" "text", "in_design_id" "uuid", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_to_create"("in_store_code" "text", "in_design_code" "text") RETURNS TABLE("Product ID" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Product Description" "text", "Product Weight" bigint, "Category" "text", "Product Code/SKU" "text", "size_variations" "text")
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
      p."Brand Name"::text,
      p."Product Description"::text,
      p."Product Weight",
      p."Category"::text,
      p."Product Code/SKU"::text,
      spd.size_variations
    from
      stores_products_designs_2 spd 
      left join new_all_products_4 p on spd."Product_ID" = p."Product ID"
    where spd."Store_Code" = in_store_code 
    and spd."Design_ID" = in_design_code
    order by p."Category", p."Product ID";
end;
$$;


ALTER FUNCTION "public"."get_products_to_create"("in_store_code" "text", "in_design_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_products_to_create_v2"("in_store_code" "text", "in_design_code" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Product Description" "text", "Product Weight" real, "Category" "text", "Product Code/SKU" "text", "size_variations" "text", "naming_method" smallint, "naming_fields" "jsonb", "product_status" "text")
    LANGUAGE "plpgsql"
    AS $$
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
      spd.product_status::text
    from
      stores_products_designs_2 spd 
      -- left join new_all_products_4 p on spd."Product_ID" = p."Product ID"
      left join new_all_products_4 p on spd."sage_code" = p."SAGE Code"
    where spd."Store_Code" = in_store_code 
    and spd."Design_ID" = in_design_code
    order by p."Category", p."Product Name";
end;
$$;


ALTER FUNCTION "public"."get_products_to_create_v2"("in_store_code" "text", "in_design_code" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_categories"("storecode" "text") RETURNS TABLE("category" "text")
    LANGUAGE "sql"
    AS $$SELECT DISTINCT p."Category"
    FROM stores_products_designs_2 AS spd
    LEFT JOIN new_all_products_4 AS p ON spd."sage_code" = p."SAGE Code"
    where spd."Store_Code"=storeCode;$$;


ALTER FUNCTION "public"."get_store_categories"("storecode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_products"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("SAGE Code" "text", "Product Name" "text", "Design_Id" character varying, "size_variations" "text", "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      p."SAGE Code"::text,
      p."Product Name"::text,
      spd."Design_Id",
      spd.size_variations,
      spd."Store_Code" is not null as is_added,
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    from
      new_all_products_3 p
      left join stores_products_designs spd on p."SAGE Code" = spd."Product_Sage_Code"
      and spd."Store_Code" = in_store_code
      and spd."Design_Id" = in_design_id
      left join stores s on s.store_code = in_store_code
    where
      p."Brand Name" is not null -- Exclude rows where "Brand Name" is NULL
    order by is_added desc, p."Product Name"
    limit in_page_size
    offset (in_page - 1) * in_page_size;
end;
$$;


ALTER FUNCTION "public"."get_store_products"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_products_2"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("Product ID" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Design_Id" character varying, "size_variations" "text", "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
      p."Brand Name"::text,
      spd."Design_Id",
      spd.size_variations,
      spd."Store_Code" is not null as is_added,
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    from
      new_all_products_3 p
      left join stores_products_designs spd on p."SAGE Code" = spd."Product_Sage_Code"
      and spd."Store_Code" = in_store_code
      and spd."Design_Id" = in_design_id
      left join stores s on s.store_code = in_store_code
    where
      p."Brand Name" is not null -- Exclude rows where "Brand Name" is NULL
    order by is_added desc, p."Product Name"
    limit in_page_size
    offset (in_page - 1) * in_page_size;
end;
$$;


ALTER FUNCTION "public"."get_store_products_2"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_products_3"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("Product ID" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Design_ID" "text", "size_variations" "text", "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
    select
      p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
      p."Brand Name"::text,
      spd."Design_ID",
      spd.size_variations,
      spd."Store_Code" is not null as is_added,
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    from
      new_all_products_3 p
      left join stores_products_designs_2 spd on p."Product ID" = spd."Product_ID"
      and spd."Store_Code" = in_store_code
      and spd."Design_ID" = in_design_id
      left join stores s on s.store_code = in_store_code
    where
      p."Brand Name" is not null -- Exclude rows where "Brand Name" is NULL
    order by is_added desc, p."Product Name"
    limit in_page_size
    offset (in_page - 1) * in_page_size;
end;
$$;


ALTER FUNCTION "public"."get_store_products_3"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_products_4"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer DEFAULT 20, "in_page" integer DEFAULT 1) RETURNS TABLE("Product ID" bigint, "SAGE Code" "text", "Product Name" "text", "Brand Name" "text", "Product Description" "text", "Product Weight" bigint, "Category" "text", "Product Code/SKU" "text", "Design_ID" "text", "size_variations" "text", "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$begin
  return query
    select
      p."Product ID",
      p."SAGE Code"::text,
      p."Product Name"::text,
      p."Brand Name"::text,
      p."Product Description"::text,
      p."Product Weight",
      p."Category"::text,
      p."Product Code/SKU"::text,
      spd."Design_ID",
      spd.size_variations,
      spd."Store_Code" is not null as is_added,
      p."XS",
      p."SM",
      p."MD",
      p."LG",
      p."XL",
      p."X2",
      p."X3"
    from
      new_all_products_3 p
      left join stores_products_designs_2 spd on p."Product ID" = spd."Product_ID"
      and spd."Store_Code" = in_store_code
      and spd."Design_ID" = in_design_id
      left join stores s on s.store_code = in_store_code
    where
      p."Brand Name" is not null -- Exclude rows where "Brand Name" is NULL
    order by is_added desc, p."Product Name"
    limit in_page_size
    offset (in_page - 1) * in_page_size;
end;$$;


ALTER FUNCTION "public"."get_store_products_4"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_store_products_by_design"("in_design_id" "text", "in_page" integer DEFAULT 1, "in_page_size" integer DEFAULT 20) RETURNS TABLE("SAGE Code" "text", "Product Name" "text", "Design_Id" "text", "Price" double precision, "size_variations" "text"[], "is_added" boolean, "SM" boolean, "MD" boolean, "LG" boolean, "XL" boolean, "X2" boolean, "X3" boolean)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select 
    v."SAGE Code",
    v."Product Name",
    v."Price",
    v."Design_Id",
    v.size_variations,
    v.is_added,
    v."SM",
    v."MD",
    v."LG",
    v."XL",
    v."X2",
    v."X3"
  from vw_store_products v
  where (v."Design_Id" = in_design_id or v.is_added = false)
  order by v.is_added desc, v."Product Name"
  limit in_page_size
  offset (in_page - 1) * in_page_size;
end;
$$;


ALTER FUNCTION "public"."get_store_products_by_design"("in_design_id" "text", "in_page" integer, "in_page_size" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.user_roles (user_id)  -- role comes from column default = 'salesrep'
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_store_in_modify"("p_store_code" "text") RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.stores s
    where s.store_code = p_store_code
      and s.status = 'Modify'::public."Store_Status"  -- <-- adjust literal if needed
  );
$$;


ALTER FUNCTION "public"."is_store_in_modify"("p_store_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Color Codes" (
    "Colour" "text" NOT NULL,
    "2-Digit code" "text",
    "3-Digit code" "text"
);


ALTER TABLE "public"."Color Codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."design_guidelines" (
    "id" "uuid" DEFAULT 'f3c14cf5-0219-410a-87d0-9c649f101a65'::"uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "design_guideline" "text" NOT NULL,
    "design_description" "text" NOT NULL,
    "reference_image" "text",
    "design_type" "public"."Design_Types" DEFAULT 'Other'::"public"."Design_Types" NOT NULL
);


ALTER TABLE "public"."design_guidelines" OWNER TO "postgres";


COMMENT ON TABLE "public"."design_guidelines" IS 'This table includes the predefined design guidelines';



COMMENT ON COLUMN "public"."design_guidelines"."design_type" IS 'This have the types of designs that was in this Google Sheet.  https://docs.google.com/spreadsheets/d/10uNGrZ8ueqLZz6zZNrJcCPB-lM-dSiB7Aj5xPiw103o/edit?usp=sharing';



CREATE TABLE IF NOT EXISTS "public"."designs" (
    "Design_Id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "Design_Guideline" character varying NOT NULL,
    "Image_URL" character varying,
    "user_id" "uuid" NOT NULL,
    "height" double precision DEFAULT '7'::double precision,
    "width" double precision DEFAULT '7'::double precision,
    "store_code" character varying NOT NULL,
    "Design_Name" "text" DEFAULT 'custom_design'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."designs" OWNER TO "postgres";


COMMENT ON TABLE "public"."designs" IS 'This table includes the designs.';



COMMENT ON COLUMN "public"."designs"."Design_Name" IS 'Name of the design';



COMMENT ON COLUMN "public"."designs"."created_at" IS 'This column records the time the row created';



CREATE TABLE IF NOT EXISTS "public"."import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"(),
    "source" "text" NOT NULL,
    "total_rows" integer NOT NULL,
    "inserted_rows" integer NOT NULL,
    "failed_rows" integer NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."import_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."import_logs" IS 'This table has the logs of the products that has been added into the new_all_products_4 table';



CREATE TABLE IF NOT EXISTS "public"."new_all_products_4" (
    "Item Type" "text",
    "Product Name" "text",
    "Product Type" "text",
    "Product Code/SKU" "text",
    "SAGE Code" "text" NOT NULL,
    "Brand Name" "text",
    "Product Description" "text",
    "Product Weight" real DEFAULT '1'::real,
    "isCreated" boolean,
    "SM" boolean,
    "MD" boolean,
    "LG" boolean,
    "XL" boolean,
    "X2" boolean,
    "X3" boolean,
    "Category" "text",
    "XS" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" DEFAULT 'f3c14cf5-0219-410a-87d0-9c649f101a65'::"uuid"
);


ALTER TABLE "public"."new_all_products_4" OWNER TO "postgres";


COMMENT ON TABLE "public"."new_all_products_4" IS 'This dataset contains dummy set of products from all the products in the new_all_products_4 and this one simulates the correct version of products that should be there';



COMMENT ON COLUMN "public"."new_all_products_4"."XS" IS 'Extra Small Size';



COMMENT ON COLUMN "public"."new_all_products_4"."created_at" IS 'gives the created time of the product';



COMMENT ON COLUMN "public"."new_all_products_4"."created_by" IS 'This product is created by this user. (User should be an admin user)';



CREATE TABLE IF NOT EXISTS "public"."notes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "notes" character varying,
    "design_id" "uuid" DEFAULT "gen_random_uuid"(),
    "store_code" character varying
);


ALTER TABLE "public"."notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."notes" IS 'This table includes the Notes related with each design. Every Design can have a note.';



ALTER TABLE "public"."notes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."notes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stores" (
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone,
    "store_name" "text" NOT NULL,
    "account_manager" "text",
    "main_client_name" "text",
    "main_client_contact_number" "text",
    "store_address" "text",
    "store_code" character varying NOT NULL,
    "start_date" "text",
    "end_date" "text",
    "status" "public"."Store_Status" DEFAULT 'Draft'::"public"."Store_Status" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "category_id" bigint
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


COMMENT ON TABLE "public"."stores" IS 'This Table include the stores created.';



COMMENT ON COLUMN "public"."stores"."status" IS 'Three Possible Status : Approved, Pending, Draft';



COMMENT ON COLUMN "public"."stores"."category_id" IS 'This have the category id of the store that has been created in Big Commerce.';



CREATE TABLE IF NOT EXISTS "public"."stores_products_designs_2" (
    "Store_Code" character varying NOT NULL,
    "Design_ID" "uuid" NOT NULL,
    "size_variations" "text",
    "naming_method" smallint DEFAULT '1'::smallint NOT NULL,
    "naming_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid" NOT NULL,
    "product_status" "public"."Product_Status" DEFAULT 'new'::"public"."Product_Status" NOT NULL,
    "notes" "text" DEFAULT 'NULL'::"text",
    "new_product_id" bigint,
    "new_sku" "text",
    "sage_code" "text" NOT NULL
);


ALTER TABLE "public"."stores_products_designs_2" OWNER TO "postgres";


COMMENT ON TABLE "public"."stores_products_designs_2" IS 'This table is a contains product id as a foreign key as SAGE Code is not unique in the new_all_products_3 table.';



COMMENT ON COLUMN "public"."stores_products_designs_2"."naming_method" IS 'This have the Naming Method defined for Store Creation';



COMMENT ON COLUMN "public"."stores_products_designs_2"."naming_fields" IS 'This contains the fields related to each naming method';



COMMENT ON COLUMN "public"."stores_products_designs_2"."product_status" IS 'This contains the status of the product. There are 4 status. Added = Product added to BigCommerce/Modify  = Product is Modifying/ New = Product is a new one./ Rejected = Product is rejected from BC';



COMMENT ON COLUMN "public"."stores_products_designs_2"."notes" IS 'This field mostly stores previous available sizes list and any other details.';



COMMENT ON COLUMN "public"."stores_products_designs_2"."new_product_id" IS 'This is the product_id received after adding to big commerce';



COMMENT ON COLUMN "public"."stores_products_designs_2"."new_sku" IS 'This column contains the new sage code from the BigCommerce';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."Roles" DEFAULT 'salesrep'::"public"."Roles" NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_designs" WITH ("security_invoker"='true', "security_barrier"='true') AS
 SELECT "d"."Design_Id" AS "design_id",
    "d"."Design_Guideline" AS "design_guideline",
    "g"."design_description",
    "d"."Image_URL" AS "image_url",
    "d"."height",
    "d"."width",
    "d"."Design_Name" AS "design_name",
    "d"."store_code",
    "n"."notes"
   FROM (("public"."designs" "d"
     JOIN "public"."design_guidelines" "g" ON (("g"."design_guideline" = ("d"."Design_Guideline")::"text")))
     LEFT JOIN "public"."notes" "n" ON (("n"."design_id" = "d"."Design_Id")));


ALTER TABLE "public"."v_designs" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_store_design_summary" AS
SELECT
    NULL::character varying AS "store_code",
    NULL::"text" AS "store_name",
    NULL::"text" AS "required_date",
    NULL::"uuid" AS "design_id",
    NULL::bigint AS "product_count",
    NULL::"text" AS "categories",
    NULL::"public"."Store_Status" AS "status";


ALTER TABLE "public"."v_store_design_summary" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Color Codes"
    ADD CONSTRAINT "Color Codes_pkey" PRIMARY KEY ("Colour");



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "Designs_pkey" PRIMARY KEY ("Design_Id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "Stores_pkey" PRIMARY KEY ("store_code");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "Stores_store_code_key" UNIQUE ("store_code");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "Stores_store_name_key" UNIQUE ("store_name");



ALTER TABLE ONLY "public"."design_guidelines"
    ADD CONSTRAINT "design_guidelines_design_description_key" UNIQUE ("design_description");



ALTER TABLE ONLY "public"."design_guidelines"
    ADD CONSTRAINT "design_guidelines_design_guideline_key" UNIQUE ("design_guideline");



ALTER TABLE ONLY "public"."design_guidelines"
    ADD CONSTRAINT "design_guidelines_pkey" PRIMARY KEY ("design_guideline");



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."new_all_products_4"
    ADD CONSTRAINT "new_all_products_4_SAGE Code_key" UNIQUE ("SAGE Code");



ALTER TABLE ONLY "public"."new_all_products_4"
    ADD CONSTRAINT "new_all_products_4_pkey" PRIMARY KEY ("SAGE Code");



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores_products_designs_2"
    ADD CONSTRAINT "stores_products_designs_2_pkey" PRIMARY KEY ("Store_Code", "Design_ID", "sage_code");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "designs_user_idx" ON "public"."designs" USING "btree" ("user_id");



CREATE INDEX "spd2_user_idx" ON "public"."stores_products_designs_2" USING "btree" ("user_id");



CREATE INDEX "stores_user_idx" ON "public"."stores" USING "btree" ("user_id");



CREATE OR REPLACE VIEW "public"."v_store_design_summary" WITH ("security_invoker"='true', "security_barrier"='true') AS
 SELECT "s"."store_code",
    "s"."store_name",
    "s"."start_date" AS "required_date",
    "spd"."Design_ID" AS "design_id",
    "count"(DISTINCT "spd"."sage_code") AS "product_count",
    "string_agg"(DISTINCT "p"."Category", ', '::"text" ORDER BY "p"."Category") AS "categories",
    "s"."status"
   FROM (("public"."stores_products_designs_2" "spd"
     RIGHT JOIN "public"."stores" "s" ON ((("s"."store_code")::"text" = ("spd"."Store_Code")::"text")))
     LEFT JOIN "public"."new_all_products_4" "p" ON (("p"."SAGE Code" = "spd"."sage_code")))
  GROUP BY "s"."store_code", "s"."store_name", "s"."end_date", "spd"."Design_ID";



ALTER TABLE ONLY "public"."design_guidelines"
    ADD CONSTRAINT "design_guidelines_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_Design_Guideline_fkey" FOREIGN KEY ("Design_Guideline") REFERENCES "public"."design_guidelines"("design_guideline") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_store_code_fkey" FOREIGN KEY ("store_code") REFERENCES "public"."stores"("store_code") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."designs"
    ADD CONSTRAINT "designs_user_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."import_logs"
    ADD CONSTRAINT "import_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."new_all_products_4"
    ADD CONSTRAINT "new_all_products_4_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "public"."designs"("Design_Id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_store_code_fkey" FOREIGN KEY ("store_code") REFERENCES "public"."stores"("store_code") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notes"
    ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stores_products_designs_2"
    ADD CONSTRAINT "spd2_user_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores_products_designs_2"
    ADD CONSTRAINT "stores_products_designs_2_Design_ID_fkey" FOREIGN KEY ("Design_ID") REFERENCES "public"."designs"("Design_Id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores_products_designs_2"
    ADD CONSTRAINT "stores_products_designs_2_Store_Code_fkey" FOREIGN KEY ("Store_Code") REFERENCES "public"."stores"("store_code") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stores_products_designs_2"
    ADD CONSTRAINT "stores_products_designs_2_sage_code_fkey" FOREIGN KEY ("sage_code") REFERENCES "public"."new_all_products_4"("SAGE Code");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_user_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."Color Codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Enable admin role to do all to notes" ON "public"."notes" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "Enable admin to access and do all to the designs" ON "public"."designs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "Enable admin to access for all data" ON "public"."stores" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "Enable admin to do all for data" ON "public"."design_guidelines" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "Enable authenticated users to view data only" ON "public"."design_guidelines" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable users to read the notes in their Store" ON "public"."notes" TO "authenticated" USING ((("store_code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK ((("store_code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable users to view their own data only" ON "public"."designs" TO "authenticated" USING ((("store_code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK ((("store_code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "Enable users to view their own data only" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view, insert, update their own data only" ON "public"."stores" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable users to view, insert, update their own data only" ON "public"."stores_products_designs_2" TO "authenticated" USING ((("Store_Code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"())))) WITH CHECK ((("Store_Code")::"text" IN ( SELECT "stores"."store_code"
   FROM "public"."stores"
  WHERE ("stores"."user_id" = "auth"."uid"()))));



CREATE POLICY "admins can do all for import logs " ON "public"."import_logs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "r"
  WHERE (("r"."user_id" = "auth"."uid"()) AND ("r"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "r"
  WHERE (("r"."user_id" = "auth"."uid"()) AND ("r"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "all authenticated users can read" ON "public"."new_all_products_4" TO "authenticated" USING (true);



ALTER TABLE "public"."design_guidelines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."designs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "enable admin to do all" ON "public"."stores_products_designs_2" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"public"."Roles")))));



ALTER TABLE "public"."import_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."new_all_products_4" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products insert admin only" ON "public"."new_all_products_4" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "r"
  WHERE (("r"."user_id" = "auth"."uid"()) AND ("r"."role" = 'admin'::"public"."Roles")))));



CREATE POLICY "products update admin only" ON "public"."new_all_products_4" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "r"
  WHERE (("r"."user_id" = "auth"."uid"()) AND ("r"."role" = 'admin'::"public"."Roles"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "r"
  WHERE (("r"."user_id" = "auth"."uid"()) AND ("r"."role" = 'admin'::"public"."Roles")))));



ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores_products_designs_2" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




























































































































































































































































GRANT ALL ON FUNCTION "public"."create_or_replace_store_products_view"("in_store_code" "text", "in_design_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_or_replace_store_products_view"("in_store_code" "text", "in_design_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_or_replace_store_products_view"("in_store_code" "text", "in_design_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_store_if_not_approved"("p_store_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_store_if_not_approved"("p_store_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_store_if_not_approved"("p_store_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."discard_store_updates"("p_store_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."discard_store_updates"("p_store_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."discard_store_updates"("p_store_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_added_products_json"("store_code_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_added_products_json"("store_code_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_added_products_json"("store_code_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtered_store_products"("in_store_code" "text", "in_design_id" "text", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtered_store_products"("in_store_code" "text", "in_design_id" "text", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtered_store_products"("in_store_code" "text", "in_design_id" "text", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_filtered_store_products_v2"("in_store_code" "text", "in_design_id" "uuid", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_filtered_store_products_v2"("in_store_code" "text", "in_design_id" "uuid", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_filtered_store_products_v2"("in_store_code" "text", "in_design_id" "uuid", "search_query" "text", "category_list" "text"[], "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_to_create"("in_store_code" "text", "in_design_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_to_create"("in_store_code" "text", "in_design_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_to_create"("in_store_code" "text", "in_design_code" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_products_to_create_v2"("in_store_code" "text", "in_design_code" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_products_to_create_v2"("in_store_code" "text", "in_design_code" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_products_to_create_v2"("in_store_code" "text", "in_design_code" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_categories"("storecode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_categories"("storecode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_categories"("storecode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_products"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_products"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_products"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_products_2"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_products_2"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_products_2"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_products_3"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_products_3"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_products_3"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_products_4"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_products_4"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_products_4"("in_store_code" "text", "in_design_id" "text", "in_page_size" integer, "in_page" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_store_products_by_design"("in_design_id" "text", "in_page" integer, "in_page_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_store_products_by_design"("in_design_id" "text", "in_page" integer, "in_page_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_store_products_by_design"("in_design_id" "text", "in_page" integer, "in_page_size" integer) TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_store_in_modify"("p_store_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_store_in_modify"("p_store_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_store_in_modify"("p_store_code" "text") TO "service_role";



























GRANT ALL ON TABLE "public"."Color Codes" TO "anon";
GRANT ALL ON TABLE "public"."Color Codes" TO "authenticated";
GRANT ALL ON TABLE "public"."Color Codes" TO "service_role";



GRANT ALL ON TABLE "public"."design_guidelines" TO "anon";
GRANT ALL ON TABLE "public"."design_guidelines" TO "authenticated";
GRANT ALL ON TABLE "public"."design_guidelines" TO "service_role";



GRANT ALL ON TABLE "public"."designs" TO "anon";
GRANT ALL ON TABLE "public"."designs" TO "authenticated";
GRANT ALL ON TABLE "public"."designs" TO "service_role";



GRANT ALL ON TABLE "public"."import_logs" TO "anon";
GRANT ALL ON TABLE "public"."import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."new_all_products_4" TO "anon";
GRANT ALL ON TABLE "public"."new_all_products_4" TO "authenticated";
GRANT ALL ON TABLE "public"."new_all_products_4" TO "service_role";



GRANT ALL ON TABLE "public"."notes" TO "anon";
GRANT ALL ON TABLE "public"."notes" TO "authenticated";
GRANT ALL ON TABLE "public"."notes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";



GRANT ALL ON TABLE "public"."stores_products_designs_2" TO "anon";
GRANT ALL ON TABLE "public"."stores_products_designs_2" TO "authenticated";
GRANT ALL ON TABLE "public"."stores_products_designs_2" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."v_designs" TO "anon";
GRANT ALL ON TABLE "public"."v_designs" TO "authenticated";
GRANT ALL ON TABLE "public"."v_designs" TO "service_role";



GRANT ALL ON TABLE "public"."v_store_design_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_store_design_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_store_design_summary" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























drop extension if exists "pg_net";

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



