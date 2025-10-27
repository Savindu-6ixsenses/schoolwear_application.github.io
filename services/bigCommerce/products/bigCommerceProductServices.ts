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

/**
 * Updates the database with the new product ID and SKU from BigCommerce.
 */
async function updateProductDesignRecord(
	identifiers: { storeCode: string; productId: string; designId: string },
	newProductId: number,
	newSageCode: string,
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({
			new_product_id: newProductId,
			new_sage_code: newSageCode,
			product_status: "added",
		})
		.eq("Store_Code", identifiers.storeCode)
		.eq("Product_ID", identifiers.productId)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB for product ${identifiers.productId}`,
			{ error: error.message }
		);
		console.error("DB Update Error:", error);
	}
}

/**
 * Updates the database record to 'rejected' when a product fails to be created.
 */
async function rejectProductDesignRecord(
	identifiers: { storeCode: string; productId: string; designId: string },
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({
			product_status: "rejected",
		})
		.eq("Store_Code", identifiers.storeCode)
		.eq("Product_ID", identifiers.productId)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB status to 'rejected' for product ${identifiers.productId}`,
			{ error: error.message }
		);
		console.error("DB Update to rejected Error:", error);
	}
}

/**
 * Updates the product_status in the database for a given product design.
 */
export async function updateProductDesignStatus(
	identifiers: { storeCode: string; productId: string; designId: string },
	status: "added" | "rejected" | "modify",
	logger: StoreCreationLogger
) {
	const supabase = await createClient();
	const { error } = await supabase
		.from("stores_products_designs_2")
		.update({ product_status: status })
		.eq("Store_Code", identifiers.storeCode)
		.eq("Product_ID", identifiers.productId)
		.eq("Design_ID", identifiers.designId);

	if (error) {
		logger.addEntry(
			"ERROR",
			`Failed to update DB status to '${status}' for product ${identifiers.productId}`,
			{ error: error.message }
		);
		console.error(`DB Update to ${status} Error:`, error);
	}
}

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

				// Handle 409 Conflict error for duplicate URL
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

// Minimal types just for this helper
type BCOption = {
	id: number;
	display_name: string;
	option_values?: { id: number; label: string }[];
};

type CreatedValue = { id: number; label: string };

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

			// 1) Get product options to locate "Size"
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

			// 2) Ensure the sizeLabel (e.g., "2XL") option value exists
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

			// 3) Create the new variant pointing to the Size option/value
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

			// Step 1: Find the variant ID for the given size label.
			const variantId = await findVariantIdByLabel(productId, sizeLabel, logger);

			if (!variantId) {
				logger.addEntry("WARNING", `Variant with size '${sizeLabel}' not found on product ${productId}. Skipping deletion.`);
				return; // Exit if variant doesn't exist
			}

			// Step 2: Delete the variant by its ID.
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
 * Helper to find a variant's ID based on its size option label.
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

	// 3. Find the variant that matches the size label
	for (const variant of allVariants) {
		const sizeOptionValue = variant.option_values?.find((ov: any) => ov.option_id === sizeOption.id);
		if (sizeOptionValue && sizeOptionValue.label.toLowerCase() === sizeLabel.toLowerCase()) {
			return variant.id; // Found it
		}
	}

	return null; // Not found
}

// await addSizeVariant({
//   productId: 1234,
//   sizeLabel: "2XL",
//   variant: {
//     sku: "TEE-BLK-2XL",
//     price: 24.99,
//     weight: 0.35,
//     inventory_level: 50,
//   },
// });
