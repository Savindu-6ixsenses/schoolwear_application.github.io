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
			`[LOG] Checking for duplicates with SAGE Code: ${parsed.sage_code} OR SKU: ${parsed.sku}`,
		);
		const { data: dup, error: dupError } = await supabase
			.from("new_all_products_4")
			.select(`"SAGE Code"`)
			.or(`"SAGE Code".eq.${parsed.sage_code}`)
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
			"Item Type": "Product",
			"Product Name": parsed.product_name + "-" + parsed.color,
			color_code: parsed.color_code,
			"Product Type": "P",
			"Product Code/SKU": "XX-XXXX", //TODO: Remove these sku fields
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
			Type: parsed.type,
			tax_class: parseInt(parsed.tax_class || "0"), // New: Add tax_class
			sort_order: parseInt(parsed.sort_order || "-1"), // New: Add sort_order
		};

		const { error } = await supabase
			.from("new_all_products_4")
			.insert(dataToInsert);
		if (error) {
			console.error("[ERROR] Supabase error during product insert:", error);
			throw error;
		}
		console.log(
			'[LOG] Product inserted successfully into "new_all_products_4" table.',
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
			"--- [Action: addSingleProduct] - Completed Successfully ---\n",
		);

		return { ok: true };
	} catch (error) {
		console.error(
			"[FATAL] An error occurred in addSingleProduct action:",
			error,
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
			Colour: colour.trim(),
			"2-Digit code": twoDigitCode.trim().toUpperCase(),
			"3-Digit code": threeDigitCode
				? threeDigitCode.trim().toUpperCase()
				: null,
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

export async function getAllSageProducts() {
	console.log("\n--- [Action: getAllSageProducts] - Initiated ---");
	try {
		const { supabase } = await createClientbyRole();
		console.log(
			`[LOG] Fetching all sage products from "most_selling_products" table.`,
		);

		const { data, error } = await supabase
			.from("most_selling_products")
			.select('"Sage Code", "Type", "Product Name", "Brand Name", "Sort Order"')
			.order('"Type"', { ascending: true });

		if (error) {
			console.error("[ERROR] Supabase error fetching sage products:", error);
			throw error;
		}

		console.log(`[LOG] Successfully fetched ${data.length} sage products.`);
		console.log(
			"--- [Action: getAllSageProducts] - Completed Successfully ---\n",
		);
		return { ok: true, data };
	} catch (error) {
		console.error(
			"[FATAL] An error occurred in getAllSageProducts action:",
			error,
		);
		return {
			ok: false,
			message: "Failed to fetch sage products. Please check the server logs.",
		};
	}
}

type ProductData = {
	"SAGE Code": string;
	"Product Name": string;
	Category: string;
	"Brand Name": string;
	color_code: string;
	"Related Product Code": string;
	Type: string | number;
	sort_order: number;
	tax_class: string;
	"Product Description": string;
	XS: boolean;
	SM: boolean;
	MD: boolean;
	LG: boolean;
	XL: boolean;
	X2: boolean;
	X3: boolean;
};

export async function getSingleProductBySageCode(
	sageCode: string,
): Promise<{ ok: boolean; data?: ProductData; message?: string }> {
	console.log(
		`\n--- [Action: getSingleProductBySageCode] - Initiated for ${sageCode} ---`,
	);
	try {
		const { supabase } = await createClientbyRole();
		console.log(`[LOG] Fetching product with SAGE Code: ${sageCode}`);

		const { data, error } = await supabase
			.from("new_all_products_4")
			.select(
				`
				"SAGE Code",
				"Product Name",
				Category,
				"Brand Name",
				color_code,
				"Related Product Code",
				Type,
				sort_order,
				tax_class,
				"Product Description",
				XS, SM, MD, LG, XL, X2, X3
				`,
			)
			.eq('"SAGE Code"', sageCode)
			.single(); // Use .single() to get a single record or null

		if (error) {
			console.error("[ERROR] Supabase error fetching single product:", error);
			throw error;
		}

		if (!data) {
			console.warn(`[WARN] No product found for SAGE Code: ${sageCode}`);
			return { ok: false, message: "Product not found." };
		}

		console.log(`[LOG] Successfully fetched product: ${data["Product Name"]}`);
		console.log(
			"--- [Action: getSingleProductBySageCode] - Completed Successfully ---\n",
		);

		const mappedData: ProductData = {
			...data,
			"Related Product Code": data["Related Product Code"] || "",
			tax_class: String(data.tax_class),
			Type: data.Type || "",
			sort_order: data.sort_order || 0,
		};

		return { ok: true, data: mappedData };
	} catch (error) {
		console.error(
			"[FATAL] An error occurred in getSingleProductBySageCode action:",
			error,
		);
		if (error instanceof Error) {
			return { ok: false, message: error.message };
		}
		return {
			ok: false,
			message: "An unexpected error occurred. Please check the server logs.",
		};
	}
}

export async function updateSingleProduct(formData: FormData) {
	console.log("\n--- [Action: updateSingleProduct] - Initiated ---");
	try {
		const { supabase, user_id } = await createClientbyRole();
		console.log(`[LOG] Authenticated as user: ${user_id}`);

		const originalSageCode = formData.get("original_sage_code") as string;
		if (!originalSageCode) {
			return {
				ok: false,
				message: "Original SAGE Code is required for update.",
			};
		}

		const values = Object.fromEntries(formData.entries());
		console.log("[LOG] Raw form data received for update:", values);

		// Assuming productSchema can also validate for updates, or a separate schema is used.
		// For now, using the same schema.
		const parsed = productSchema.parse({
			...values,
			sage_code: originalSageCode, // Ensure the sage_code for parsing is the original one
		});
		console.log(
			"[LOG] Data after Zod parsing and normalization for update:",
			parsed,
		);

		// Map the parsed data to the correct database column names for update
		const dataToUpdate = {
			"Product Name": parsed.product_name + "-" + parsed.color,
			color_code: parsed.color_code,
			Category: parsed.category,
			"Brand Name": parsed.brand_name,
			"Product Description": parsed.product_description,
			Type: parsed.type,
			sort_order: parseInt(parsed.sort_order || "-1"),
			tax_class: parseInt(parsed.tax_class || "0"),
			XS: parsed.xs,
			SM: parsed.sm,
			MD: parsed.md,
			LG: parsed.lg,
			XL: parsed.xl,
			X2: parsed.x2,
			X3: parsed.x3,
		};

		const { error } = await supabase
			.from("new_all_products_4")
			.update(dataToUpdate)
			.eq('"SAGE Code"', originalSageCode); // Use originalSageCode for the WHERE clause

		if (error) {
			console.error("[ERROR] Supabase error during product update:", error);
			throw error;
		}
		console.log(
			`[LOG] Product with SAGE Code ${originalSageCode} updated successfully.`,
		);

		// Log the update action
		await supabase.from("import_logs").insert({
			user_id: user_id,
			source: "edit_form",
			total_rows: 1,
			inserted_rows: 0, // Not a new insert
			updated_rows: 1,
			failed_rows: 0,
			details: [{ status: "updated", sku: originalSageCode }],
		});
		console.log('[LOG] Log entry created for update in "import_logs" table.');
		console.log(
			"--- [Action: updateSingleProduct] - Completed Successfully ---\n",
		);

		return { ok: true };
	} catch (error) {
		console.error(
			"[FATAL] An error occurred in updateSingleProduct action:",
			error,
		);
		if (error instanceof Error) {
			return { ok: false, message: error.message };
		}
		return {
			ok: false,
			message: "An unexpected error occurred. Please check the server logs.",
		};
	}
}
