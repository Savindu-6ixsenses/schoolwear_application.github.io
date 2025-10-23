"use server";

import { productSchema } from "@/lib/products/productSchema";
import { createClientbyRole } from "@/utils/adminHelper";

export async function addSingleProduct(formData: FormData) {
	console.log("\n--- [Action: addSingleProduct] - Initiated ---");
	try {
		const { supabase, user_id } = await createClientbyRole();
		console.log(`[LOG] Authenticated as user: ${user_id}`);

		const values = Object.fromEntries(formData.entries());
		console.log("[LOG] Raw form data received:", values);

		const parsed = productSchema.parse({
			...values,
		});
		console.log("[LOG] Data after Zod parsing and normalization:", parsed);

		// Duplicate check
		console.log(
			`[LOG] Checking for duplicates with SKU: ${parsed.sku} OR Product ID: ${parsed.product_id}`
		);
		const { data: dup, error: dupError } = await supabase
			.from("new_all_products_4")
			.select(`"Product ID"`)
			.or(
				`"Product Code/SKU".eq.${parsed.sku},"Product ID".eq.${parsed.product_id}`
			)
			.limit(1);

		if (dupError) {
			console.error("[ERROR] Supabase error during duplicate check:", dupError);
			throw dupError;
		}

		if (dup && dup.length > 0) {
			console.warn("[WARN] Duplicate found. Aborting insertion. Found:", dup);
			throw new Error("Duplicate SKU or Product ID");
		}
		console.log("[LOG] No duplicates found. Proceeding with insert.");

        // Map the parsed data to the correct database column names
		const dataToInsert = {
			"Item Type": parsed.item_type,
			"Product ID": parsed.product_id,
			"Product Name": parsed.product_name,
			"Product Type": parsed.product_type,
			"Product Code/SKU": parsed.sku,
			"SAGE Code": parsed.sage_code,
			"Brand Name": parsed.brand_name,
			"Product Description": parsed.product_description,
			"Product Weight": parsed.product_weight,
			isCreated: parsed.is_created,
			XS: parsed.xs,
			SM: parsed.sm,
			MD: parsed.md,
			LG: parsed.lg,
			XL: parsed.xl,
			X2: parsed.x2,
			X3: parsed.x3,
			Category: parsed.category,
			created_by: user_id,
		};

		const { error } = await supabase
			.from("new_all_products_4")
			.insert(dataToInsert);
		if (error) {
			console.error("[ERROR] Supabase error during product insert:", error);
			throw error;
		}
		console.log('[LOG] Product inserted successfully into "new_all_products_4" table.');
        
		await supabase.from("import_logs").insert({
			user_id: user_id,
			source: "single_form",
			total_rows: 1,
			inserted_rows: 1,
			failed_rows: 0,
			details: [{ status: "inserted", sku: parsed.sku }],
		});
		console.log('[LOG] Log entry created in "import_logs" table.');
		console.log(
			"--- [Action: addSingleProduct] - Completed Successfully ---\n"
		);

		return { ok: true };
	} catch (error) {
		console.error(
			"[FATAL] An error occurred in addSingleProduct action:",
			error
		);
		throw error; // Re-throw error to be caught by the form's try/catch block
	}
}
