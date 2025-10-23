import { NextResponse } from "next/server";
import {
	productSchema,
	type ProductInput,
	type RowResult,
	type BulkImportResult,
} from "@/lib/products/productSchema";
import { parse } from "csv-parse/sync";
import { createClientbyRole } from "@/utils/adminHelper";

export const runtime = "nodejs"; // ensure Node env for sync parsing

export async function POST(req: Request) {
	console.log("\n--- [BULK_IMPORT_API] - POST request received ---");
	try {
		const { supabase, user_id } = await createClientbyRole();
		console.log(`[LOG] Authenticated as admin user: ${user_id}`);

		const form = await req.formData();
		const file = form.get("file") as File | null;
		if (!file) {
			console.error("[ERROR] No file found in form data.");
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
			console.error(
				`[ERROR] Invalid file type: ${file.type}. Only CSV is accepted.`
			);
			return NextResponse.json(
				{ error: "Only CSV is accepted" },
				{ status: 400 }
			);
		}

		console.log(
			`[LOG] Received file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
		);

		const text = Buffer.from(await file.arrayBuffer()).toString("utf8");

		// CSV -> records
		const records = parse(text, {
			columns: true,
			skip_empty_lines: true,
			trim: true,
		}) as Record<string, string>[];

		console.log(`[LOG] Parsed ${records.length} records from CSV.`);

		if (!records.length) {
			console.error("[ERROR] CSV file is empty or could not be parsed.");
			return NextResponse.json({ error: "Empty CSV" }, { status: 400 });
		}

		// Required headers
		const requiredHeaders = ["Product ID", "Product Name", "Product Code/SKU"];
		const headers = Object.keys(records[0] ?? {});
		const missing = requiredHeaders.filter((h) => !headers.includes(h));
		if (missing.length) {
			console.error(
				`[ERROR] CSV is missing required columns: ${missing.join(", ")}`
			);
			return NextResponse.json(
				{ error: `Missing required columns: ${missing.join(", ")}` },
				{ status: 400 }
			);
		}

		// Normalize + validate rows
		const normalized: ProductInput[] = [];
		console.log("[LOG] Starting row-by-row validation...");
		const rowResults: RowResult[] = [];

		for (let i = 0; i < records.length; i++) {
			const r = records[i];
			try {
				const candidate = {
					// Map from DB/CSV column names to Zod schema keys
					item_type: r["Item Type"],
					product_id: r["Product ID"],
					product_name: r["Product Name"],
					product_type: r["Product Type"],
					sku: r["Product Code/SKU"],
					sage_code: r["SAGE Code"],
					brand_name: r["Brand Name"],
					product_description: r["Product Description"],
					product_weight: r["Product Weight"],
					is_created: r.isCreated.toLowerCase() === "true" || r.isCreated === "1",
					xs: r.XS.toLowerCase() === "true" || r.XS === "1",
					sm: r.SM.toLowerCase() === "true" || r.SM === "1",
                    md: r.MD.toLowerCase() === "true" || r.MD === "1",
                    lg: r.LG.toLowerCase() === "true" || r.LG === "1",
                    xl: r.XL.toLowerCase() === "true" || r.XL === "1",
                    x2: r.X2.toLowerCase() === "true" || r.X2 === "1",
                    x3: r.X3.toLowerCase() === "true" || r.X3 === "1",
					category: r.Category,
				};

				const parsed = productSchema.parse(candidate);
				normalized.push(parsed);
				rowResults.push({ row: i + 1, status: "inserted", sku: parsed.sku });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				console.warn(
					`[VALIDATION_FAIL] Row ${i + 1} (SKU: ${r.sku}):`,
					e.message
				);
				rowResults.push({
					row: i + 1,
					status: "failed",
					message: e?.message ?? "Validation failed",
					sku: r["Product Code/SKU"],
				});
			}
		}

		const validRows = normalized.length;
		console.log(
			`[LOG] Validation complete. Valid rows: ${validRows}, Failed rows: ${
				records.length - validRows
			}`
		);

		if (!validRows) {
			console.error("[ERROR] All rows failed validation. Aborting import.");
			// Log attempt with zero inserts
			await supabase.from("import_logs").insert({
				user_id: user_id,
				source: "bulk_csv",
				total_rows: records.length,
				inserted_rows: 0,
				failed_rows: records.length,
				details: rowResults,
			});
			return NextResponse.json(
				{ error: "All rows failed validation", results: rowResults },
				{ status: 400 }
			);
		}

		// Check duplicates in DB by SKU or PRODUCT_ID (one pass)
		console.log("[LOG] Checking for duplicates in the database...");
		const skus = Array.from(new Set(normalized.map((p) => p.sku)));
		const productIds = Array.from(new Set(normalized.map((p) => p.product_id)));
		const productNames = Array.from(
			new Set(normalized.map((p) => p.product_name))
		);

		// Note: Column names with spaces/slashes must be quoted.
		const { data: dbExisting, error: dbErr } = await supabase
			.from("new_all_products_4")
			.select(`"Product Code/SKU", "Product ID", "Product Name"`)
			.or(
				`"Product Code/SKU".in.(${skus.join(
					","
				)}),"Product ID".in.(${productIds.join(
					","
				)}),"Product Name".in.(${productNames.map((n) => `"${n}"`).join(",")})`
			);

		if (dbErr) {
			console.error("[ERROR] Supabase error during duplicate check:", dbErr);
			throw dbErr;
		}

		const existingSet = new Set<string>();
		(dbExisting ?? []).forEach((d) => {
			if (d["Product Code/SKU"])
				existingSet.add(`sku:${d["Product Code/SKU"]}`);
			if (d["Product ID"]) existingSet.add(`pid:${d["Product ID"]}`);
			if (d["Product Name"]) existingSet.add(`pname:${d["Product Name"]}`);
		});

		console.log(
			`[LOG] Found ${
				dbExisting?.length ?? 0
			} existing products in the database.`
		);

		const toInsert = normalized.filter(
			(p) =>
				!existingSet.has(`sku:${p.sku}`) &&
				!existingSet.has(`pid:${p.product_id}`) &&
				!existingSet.has(`pname:${p.product_name}`)
		);

		console.log(
			`[LOG] ${toInsert.length} new products will be inserted. ${
				normalized.length - toInsert.length
			} were duplicates.`
		);

		// Chunked insert (safe for large files)
		const chunkSize = 500;
		let inserted = 0;
		const failures: RowResult[] = [];

		console.log(
			`[LOG] Starting database insertion in chunks of ${chunkSize}...`
		);
		for (let i = 0; i < toInsert.length; i += chunkSize) {
			console.log(`[LOG] Inserting chunk ${i / chunkSize + 1}...`);
			const chunk = toInsert.slice(i, i + chunkSize);
			// Map from Zod schema keys back to DB column names for insertion
			const chunkToInsert = chunk.map((p) => ({
				"Item Type": p.item_type,
				"Product ID": p.product_id,
				"Product Name": p.product_name,
				"Product Type": p.product_type,
				"Product Code/SKU": p.sku,
				"SAGE Code": p.sage_code,
				"Brand Name": p.brand_name,
				"Product Description": p.product_description,
				"Product Weight": p.product_weight,
				isCreated: p.is_created,
				XS: p.xs,
				SM: p.sm,
				MD: p.md,
				LG: p.lg,
				XL: p.xl,
				X2: p.x2,
				X3: p.x3,
				Category: p.category,
				created_by: user_id,
			}));
			const { error: insErr } = await supabase
				.from("new_all_products_4")
				.insert(chunkToInsert);
			if (insErr) {
				console.error(`[ERROR] Chunk insertion failed:`, insErr);
				// Mark these as failed in the results (generic chunk failure)
				chunk.forEach((p) => {
					// Find the original row number from the initial validation results
					const originalRow = rowResults.find((r) => r.sku === p.sku);
					failures.push({
						row: originalRow ? originalRow.row : -1, // Use original row number
						status: "failed",
						message: insErr.message,
						sku: p.sku,
					});
				});
			} else {
				inserted += chunk.length;
			}
		}

		console.log("[LOG] Compiling final results...");
		// Mark duplicates as skipped
		const skipped = normalized.length - toInsert.length;
		const resultSummary = rowResults.map((r) => {
			if (r.status === "inserted") {
				// If it wasn't part of toInsert, call it 'skipped'
				const wasInserted = toInsert.find((t) => t.sku === r.sku);
				if (!wasInserted) {
					// Explicitly create a new RowResult to maintain the type
					const skippedResult: RowResult = {
						...r,
						status: "skipped",
						message: "Duplicate found in DB",
					};
					return skippedResult;
				}
			}
			return r;
		});

		// Merge chunk failures override
		failures.forEach((f) => {
			const idx = resultSummary.findIndex((x) => x.sku === f.sku);
			if (idx >= 0) resultSummary[idx] = f;
			else resultSummary.push(f);
		});

		// Write import log (DB only)
		console.log("[LOG] Writing to import_logs table...");
		await supabase.from("import_logs").insert({
			user_id: user_id,
			source: "bulk_csv",
			total_rows: records.length,
			inserted_rows: inserted,
			failed_rows: resultSummary.filter((x) => x.status === "failed").length,
			details: resultSummary,
		});

		console.log("[LOG] Bulk import process complete. Sending response.");
		return NextResponse.json<BulkImportResult>({
			ok: true,
			totalRows: records.length,
			validated: normalized.length,
			inserted,
			skipped,
			failed: resultSummary.filter((x) => x.status === "failed").length,
			results: resultSummary,
		});
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		// Log the full error to the server console for debugging
		console.error("[BULK_IMPORT_ERROR]", e);

		// Return a generic, user-friendly error to the client
		return NextResponse.json(
			{
				error:
					"An unexpected error occurred during the bulk import. Please check the server logs for details.",
			},
			{ status: 500 }
		);
	}
}
