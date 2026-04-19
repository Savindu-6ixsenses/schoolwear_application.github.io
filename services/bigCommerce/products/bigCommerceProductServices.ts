import {
	CreateVariantPayload,
	productConfig,
	ProductCreationProps,
	ProductResponse,
} from "@/types/products";
import { StoreCreationLogger } from "@/utils/logging/storeCreationLogger";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { sendAPIRequestBigCommerce } from "../apiClient";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH!;

// Minimal types just for this helper
type BCOption = {
	id: number;
	display_name: string;
	option_values?: { id: number; label: string }[];
};

type CreatedValue = { id: number; label: string };

/**
 * Persists the BigCommerce identifiers for a successfully created product variant row.
 *
 * @param identifiers Composite key for the `stores_products_designs_2` record to update.
 * @param newProductId BigCommerce product ID returned by the catalog API.
 * @param newSKU Final SKU stored in BigCommerce for the created product.
 * @param logger Logger used to record database update failures.
 * @returns Resolves when the database update attempt completes.
 * @sideEffects Writes `new_product_id`, `new_sku`, and `product_status` to Supabase.
 */
async function updateProductDesignRecord(
	identifiers: { storeCode: string; sageCode: string; designId: string },
	newProductId: number,
	newSKU: string,
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({
			new_product_id: newProductId,
			new_sku: newSKU,
			product_status: "added",
		})
		.eq("Store_Code", identifiers.storeCode)
		.eq("sage_code", identifiers.sageCode)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB for product ${identifiers.sageCode}`,
			{ error: error.message }
		);
		console.error("DB Update Error:", error);
	}
}

/**
 * Marks a product-design row as rejected after product creation exhausts its retries.
 *
 * @param identifiers Composite key for the `stores_products_designs_2` record to update.
 * @param logger Logger used to record database update failures.
 * @returns Resolves when the rejection update attempt completes.
 * @sideEffects Writes `product_status = "rejected"` to Supabase.
 */
async function rejectProductDesignRecord(
	identifiers: { storeCode: string; sageCode: string; designId: string },
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({
			product_status: "rejected",
		})
		.eq("Store_Code", identifiers.storeCode)
		.eq("sage_code", identifiers.sageCode)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB status to 'rejected' for product ${identifiers.sageCode}`,
			{ error: error.message }
		);
		console.error("DB Update to rejected Error:", error);
	}
}

/**
 * Updates the workflow status for a product-design record.
 *
 * @param identifiers Composite key for the `stores_products_designs_2` record to update.
 * @param status New workflow status to persist.
 * @param logger Logger used to record database update failures.
 * @returns Resolves when the status update attempt completes.
 * @sideEffects Writes `product_status` to Supabase and emits diagnostic logs.
 */
export async function updateProductDesignStatus(
	identifiers: { storeCode: string; sageCode: string; designId: string },
	status: "added" | "rejected" | "modify",
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({ product_status: status })
		.eq("Store_Code", identifiers.storeCode)
		.eq("sage_code", identifiers.sageCode)
		.eq("Design_ID", identifiers.designId);

	console.log("Product Status updates successfully");
	console.log("Identifiers:", identifiers.sageCode);
	console.log("Status:", status);


	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB status to '${status}' for product ${identifiers.sageCode}`,
			{ error: error.message }
		);
		console.error(`DB Update to ${status} Error:`, error);
	}
}

/**
 * Removes a product-design mapping row after the corresponding BigCommerce product has been deleted.
 *
 * @param identifiers Composite key for the `stores_products_designs_2` record to delete.
 * @param logger Logger used to record database delete failures.
 * @returns Resolves when the delete attempt completes.
 * @sideEffects Deletes a row from Supabase.
 */
async function deleteProductDesignRecord(
	identifiers: { storeCode: string; sageCode: string; designId: string },
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.delete()
		.eq("Store_Code", identifiers.storeCode)
		.eq("sage_code", identifiers.sageCode)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry("ERROR", `Failed to delete DB record for product ${identifiers.sageCode}`, { error: error.message });
		console.error("DB Delete Error:", error);
	}
}

/**
 * Creates catalog products in BigCommerce from prepared product configs.
 *
 * @param products Product payloads already transformed into BigCommerce-ready configs.
 * @param logger Logger used to record successes, retries, and permanent failures.
 * @returns Aggregate success and failure counts for the submitted configs.
 * @sideEffects Creates products in BigCommerce, updates related Supabase product-design rows,
 * and writes operational log entries.
 */
export const createBigCommerceProducts = async (
	products: productConfig[],
	logger: StoreCreationLogger
) => {
	const productUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products`;
	let successCount = 0;

	for (const _product of products) {
		let success = false;
		let attempt = 0;

		const product = _product.productConfigs as ProductCreationProps;

		while (!success && attempt < 3) {
			try {
				const response: { data: ProductResponse } =
					await sendAPIRequestBigCommerce(productUrl, "POST", product);
				success = true;
				successCount++;
				logger.logProductSuccess(
					product.name,
					product.sku ? product.sku : "N/A",
					product.variants
				);

				// After successful creation, update the database record
				if (_product.db_identifiers && response.data.id && response.data.sku) {
					await updateProductDesignRecord(
						_product.db_identifiers,
						response.data.id,
						response.data.sku,
						logger
					);
				}

				logger.addEntry(
					"INFO",
					`Successfully created product ${product.name} and updated DB record.`
				);
			} catch (error) {
				console.error(
					`Attempt ${attempt} failed for product: ${product.name}`,
					error instanceof Error ? error.message : error
				);

				// BigCommerce enforces unique product URLs; duplicate URLs are treated as a non-retriable skip.
				if (
					error instanceof Error &&
					error.message.includes("409 - Conflict") &&
					error.message.includes("The URL is a duplicate")
				) {
					logger.addEntry(
						"WARNING",
						`Skipping product '${product.name}' due to duplicate URL.`,
						{ sku: product.sku }
					);
					break; // Exit the while loop for this product
				}

				attempt++;
				if (attempt >= 3) {
					console.error("Final failed payload:", product); // Log entire payload for debugging
					logger.logProductError(
						product.name,
						error instanceof Error ? error.message : "Unknown error",
						attempt
					);
					// Mark the product as rejected in the database
					if (_product.db_identifiers) {
						await rejectProductDesignRecord(_product.db_identifiers, logger);
					}
					// Optionally, you can throw an error or handle it as needed
					throw new Error(`Failed after 3 attempts: ${product.name}`);
				}

				await new Promise((res) => setTimeout(res, 2500));
			}
		}
	}

	return {
		successCount: successCount,
		failedCount: products.length - successCount,
	};
};

/**
 * Deletes catalog products from BigCommerce for configs marked for removal.
 *
 * @param products Removal configs containing the target BigCommerce product IDs.
 * @param logger Logger used to record successes, retries, and permanent failures.
 * @returns Aggregate success and failure counts for the submitted removals.
 * @sideEffects Deletes products in BigCommerce, removes related Supabase product-design rows,
 * and writes operational log entries.
 */
export const deleteBigCommerceProducts = async (
	products: productConfig[],
	logger: StoreCreationLogger
) => {
	const baseUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products`;
	let successCount = 0;

	for (const _product of products) {
		let success = false;
		let attempt = 0;

		// Cast to the expected type for removal
		const config = _product.productConfigs as { productId: number };
		const productId = config.productId;

		if (!productId) {
			logger.addEntry("WARNING", "Skipping removal: Missing productId", {
				sageCode: _product.db_identifiers?.sageCode,
			});
			continue;
		}

		while (!success && attempt < 3) {
			try {
				const url = `${baseUrl}/${productId}`;
				await sendAPIRequestBigCommerce(url, "DELETE");

				success = true;
				successCount++;

				// After successful deletion from BC, delete the database record
				if (_product.db_identifiers) {
					await deleteProductDesignRecord(_product.db_identifiers, logger);
				}

				logger.addEntry("INFO", `Successfully deleted product ID ${productId} from BigCommerce and Supabase.`);
			} catch (error) {
				// Missing products are treated as already-synchronized state so DB cleanup can still proceed.
				if (error instanceof Error && error.message.includes("404")) {
					success = true;
					successCount++;
					if (_product.db_identifiers) {
						await deleteProductDesignRecord(_product.db_identifiers, logger);
					}
					logger.addEntry("INFO", `Product ID ${productId} already deleted from BigCommerce. Removed from DB.`);
					break;
				}

				console.error(`Attempt ${attempt} failed to delete product: ${productId}`, error instanceof Error ? error.message : error);

				attempt++;
				if (attempt >= 3) {
					logger.addEntry("ERROR", `Failed to delete product ID ${productId} after 3 attempts.`, {
						error: error instanceof Error ? error.message : "Unknown",
					});
				}
				await new Promise((res) => setTimeout(res, 2500));
			}
		}
	}

	return {
		successCount: successCount,
		failedCount: products.length - successCount,
	};
};

/**
 * Adds a size variant to an existing BigCommerce product, creating the Size option/value when needed.
 *
 * @param params.productId BigCommerce product ID that should receive the variant.
 * @param params.sizeLabel Human-readable size label, for example `2XL`.
 * @param params.variant BigCommerce variant payload excluding the resolved option linkage.
 * @param params.logger Logger used to record retries and lifecycle events.
 * @returns The created BigCommerce variant payload when successful.
 * @sideEffects Reads and mutates BigCommerce product options/values, creates a variant,
 * and writes operational log entries.
 */
export async function addSizeVariant({
	productId,
	sizeLabel, // e.g., "2XL"
	variant, // your variant fields (sku, price, etc.)
	logger,
}: {
	productId: number;
	sizeLabel: string;
	variant: CreateVariantPayload;
	logger: StoreCreationLogger;
}) {
	let attempt = 0;
	while (attempt < 3) {
		try {
			logger.addEntry(
				"INFO",
				`Attempting to add variant '${sizeLabel}' to product ID ${productId}. Attempt ${
					attempt + 1
				}`
			);

			// Variants are keyed off the BigCommerce "Size" option; it may not exist on legacy products yet.
			const optionsUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/options`;
			const optionsRes = await sendAPIRequestBigCommerce(optionsUrl, "GET");
			const options: BCOption[] = optionsRes?.data ?? [];

			let sizeOption = options.find(
				(o) => o.display_name?.toLowerCase() === "size"
			);
			if (!sizeOption) {
				logger.addEntry(
					"INFO",
					`No 'Size' option found for product ${productId}. Creating it.`
				);
				const createOptUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/options`;
				const createdOpt = await sendAPIRequestBigCommerce(
					createOptUrl,
					"POST",
					{
						display_name: "Size",
						type: "rectangles",
						option_values: [], // we’ll add the value next
					}
				);
				sizeOption = createdOpt?.data;
			}

			// BigCommerce variant creation requires a concrete option value ID, not just the display label.
			const existingVal = sizeOption?.option_values?.find(
				(v) => v.label.toLowerCase() === sizeLabel.toLowerCase()
			);
			let sizeValueId = existingVal?.id;

			if (!sizeValueId) {
				logger.addEntry(
					"INFO",
					`No '${sizeLabel}' value found for 'Size' option on product ${productId}. Creating it.`
				);
				const createValUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/options/${
					sizeOption!.id
				}/values`;
				const createdVal = await sendAPIRequestBigCommerce(
					createValUrl,
					"POST",
					{
						label: sizeLabel,
						is_default: false,
						sort_order: 0,
					}
				);
				const value: CreatedValue = createdVal?.data;
				sizeValueId = value.id;
			}

			// The variant payload is merged with the resolved Size option/value mapping for this product.
			const createVariantUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/variants`;
			const payload = {
				...variant,
				option_values: [
					{
						option_id: sizeOption!.id,
						id: sizeValueId!, // option_value_id
					},
				],
			};

			const createdVariant = await sendAPIRequestBigCommerce(
				createVariantUrl,
				"POST",
				payload
			);

			logger.addEntry(
				"INFO",
				`Successfully added variant '${sizeLabel}' (SKU: ${variant.sku}) to product ID ${productId}.`
			);
			return createdVariant?.data; // Success, exit loop
		} catch (error) {
			attempt++;
			logger.addEntry(
				"ERROR",
				`Failed to add variant '${sizeLabel}' to product ${productId} on attempt ${attempt}.`,
				{ error: error instanceof Error ? error.message : "Unknown error" }
			);

			if (attempt >= 3) {
				logger.addEntry(
					"ERROR",
					`Permanently failed to add variant '${sizeLabel}' to product ${productId} after 3 attempts.`
				);
				throw new Error(`Failed to add variant ${sizeLabel} after 3 attempts.`);
			}

			await new Promise((res) => setTimeout(res, 2500)); // Wait before retrying
		}
	}
}


/**
 * Deletes a size variant from an existing BigCommerce product by resolving the matching variant ID first.
 *
 * @param params.productId BigCommerce product ID that owns the variant.
 * @param params.sizeLabel Size label used to locate the variant through its option values.
 * @param params.logger Logger used to record retries and lifecycle events.
 * @returns Resolves when the variant has been deleted or confirmed missing.
 * @sideEffects Reads BigCommerce product options/variants, deletes the matching variant when found,
 * and writes operational log entries.
 */
export async function deleteSizeVariant({
	productId,
	sizeLabel,
	logger,
}: {
	productId: number;
	sizeLabel: string;
	logger: StoreCreationLogger;
}) {
	let attempt = 0;
	while (attempt < 3) {
		try {
			logger.addEntry("INFO", `Attempting to delete variant '${sizeLabel}' from product ID ${productId}. Attempt ${attempt + 1}`);

			// Variant deletion requires an ID, so we first resolve the size label back to the matching variant.
			const variantId = await findVariantIdByLabel(productId, sizeLabel, logger);

			if (!variantId) {
				logger.addEntry("WARNING", `Variant with size '${sizeLabel}' not found on product ${productId}. Skipping deletion.`);
				return; // Exit if variant doesn't exist
			}

			// A missing variant is treated as already synchronized state instead of a hard failure.
			const deleteUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/variants/${variantId}`;
			await sendAPIRequestBigCommerce(deleteUrl, "DELETE");

			logger.addEntry("SUCCESS", `Successfully deleted variant '${sizeLabel}' (ID: ${variantId}) from product ${productId}.`);
			return; // Success, exit loop

		} catch (error) {
			attempt++;
			logger.addEntry("ERROR", `Failed to delete variant '${sizeLabel}' from product ${productId} on attempt ${attempt}.`, { error: error instanceof Error ? error.message : "Unknown error" });

			if (attempt >= 3) {
				logger.addEntry("ERROR", `Permanently failed to delete variant '${sizeLabel}' from product ${productId} after 3 attempts.`);
				throw new Error(`Failed to delete variant ${sizeLabel} after 3 attempts.`);
			}

			await new Promise((res) => setTimeout(res, 2500)); // Wait before retrying
		}
	}
}

/**
 * Resolves a BigCommerce variant ID by matching a variant's Size option label.
 *
 * @param productId BigCommerce product ID whose variants should be searched.
 * @param sizeLabel Size label to match case-insensitively.
 * @param logger Logger used to record missing option warnings.
 * @returns The matching variant ID, or `null` when the Size option or variant is absent.
 * @sideEffects Performs read requests against the BigCommerce options and variants endpoints.
 */
async function findVariantIdByLabel(productId: number, sizeLabel: string, logger: StoreCreationLogger): Promise<number | null> {
	// 1. Get the option ID for "Size"
	const optionsUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/options`;
	const optionsRes = await sendAPIRequestBigCommerce(optionsUrl, "GET");
	const sizeOption = (optionsRes?.data ?? []).find((o: BCOption) => o.display_name?.toLowerCase() === 'size');

	if (!sizeOption) {
		logger.addEntry("WARNING", `Product ${productId} has no 'Size' option. Cannot find variant to delete.`);
		return null;
	}

	// 2. Get all variants for the product
	const variantsUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products/${productId}/variants`;
	const variantsRes = await sendAPIRequestBigCommerce(variantsUrl, "GET");
	const allVariants = variantsRes?.data ?? [];

	// BigCommerce stores the chosen option values on each variant, so we match against the Size option ID first.
	for (const variant of allVariants) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sizeOptionValue = variant.option_values?.find((ov: any) => ov.option_id === sizeOption.id);
		if (sizeOptionValue && sizeOptionValue.label.toLowerCase() === sizeLabel.toLowerCase()) {
			return variant.id; // Found it
		}
	}

	return null; // Not found
}
