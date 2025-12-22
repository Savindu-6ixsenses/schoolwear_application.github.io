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
			`[LOG] Checking for duplicates with SAGE Code: ${parsed.sage_code} OR SKU: ${parsed.sku}`
		);
		const { data: dup, error: dupError } = await supabase
			.from("new_all_products_4")
			.select(`"SAGE Code", "Product Code/SKU"`)
			.or(
				`"Product Name".eq.${parsed.product_name},"Product Code/SKU".eq.${parsed.sku}`
			)
			.limit(1);

		if (dupError) {
			console.error("[ERROR] Supabase error during duplicate check:", dupError);
			throw dupError;
		}

		if (dup && dup.length > 0) {
			console.warn("[WARN] Duplicate found. Aborting insertion. Found:", dup);
			return {
				ok: false,
				message: "A product with this SAGE Code or SKU already exists.",
			};
		}
		console.log("[LOG] No duplicates found. Proceeding with insert.");

		// Map the parsed data to the correct database column names
		const dataToInsert = {
			"Item Type": parsed.item_type,
			"Product Name": parsed.product_name + "-" + parsed.color,
			color_code: parsed.color_code,
			"Product Type": parsed.product_type,
			"Product Code/SKU": parsed.sku,
			"SAGE Code": parsed.sage_code,
			"Brand Name": parsed.brand_name,
			"Product Description": parsed.product_description,
			// "Product Weight": parsed.product_weight,
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
		console.log(
			'[LOG] Product inserted successfully into "new_all_products_4" table.'
		);

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

		// Instead of throwing, return a structured error response
		if (error instanceof Error) {
			return { ok: false, message: error.message };
		}
		return {
			ok: false,
			message: "An unexpected error occurred. Please check the server logs.",
		};
	}
}

export async function addColor(formData: FormData) {
	console.log("\n--- [Action: addColor] - Initiated ---");
	try {
		const { supabase, user_id } = await createClientbyRole();
		console.log(`[LOG] Authenticated as user: ${user_id}`);

		const colour = formData.get("colour") as string;
		const twoDigitCode = formData.get("two_digit_code") as string;
		const threeDigitCode = (formData.get("three_digit_code") as string) || null;

		// Basic Validation
		if (!colour?.trim() || !twoDigitCode?.trim()) {
			console.warn("[WARN] Missing required fields: Colour or 2-Digit Code.");
			return { ok: false, message: "Colour and 2-Digit Code are required." };
		}

		const dataToInsert = {
			"Colour": colour.trim(),
			"2-Digit code": twoDigitCode.trim().toUpperCase(),
			"3-Digit code": threeDigitCode ? threeDigitCode.trim().toUpperCase() : null,
		};

		console.log("[LOG] Data to insert:", dataToInsert);

		// Duplicate check on Colour name
		const { data: dup, error: dupError } = await supabase
			.from("Color Codes")
			.select(`Colour`)
			.eq("Colour", dataToInsert["Colour"])
			.limit(1);

		if (dupError) throw dupError;

		if (dup && dup.length > 0) {
			console.warn("[WARN] Duplicate color found. Aborting insertion.");
			return { ok: false, message: "A color with this name already exists." };
		}

		const { error } = await supabase.from("Color Codes").insert(dataToInsert);
		if (error) throw error;

		console.log("[LOG] Color added successfully.");
		console.log("--- [Action: addColor] - Completed Successfully ---\n");
		return { ok: true };
	} catch (error: any) {
		console.error("[FATAL] An error occurred in addColor action:", error);
		const message = error.message || "Failed to add color. Check server logs.";
		return { ok: false, message };
	}
}

export async function getAllColors() {
	console.log("\n--- [Action: getAllColors] - Initiated ---");
	try {
		const { supabase } = await createClientbyRole();
		console.log(`[LOG] Fetching all colors from "Color Codes" table.`);

		// Query the "Color Codes" table and alias the columns to match the frontend's expectation.
		// "Colour" -> name, "3-Digit code" -> code
		const { data, error } = await supabase
			.from("Color Codes")
			.select('name:Colour, code:"2-Digit code"')
			.order("Colour", { ascending: true });

		if (error) {
			console.error("[ERROR] Supabase error fetching colors:", error);
			throw error; // Throw to be caught by the catch block
		}

		console.log(`[LOG] Successfully fetched ${data.length} colors.`);
		console.log("--- [Action: getAllColors] - Completed Successfully ---\n");
		return { ok: true, data };
	} catch (error) {
		console.error("[FATAL] An error occurred in getAllColors action:", error);
		return {
			ok: false,
			message: "Failed to fetch colors. Please check the server logs.",
		};
	}
}
