/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	addSizeVariant,
	createBigCommerceStore,
	createRelatedCategories,
	createBigCommerceProducts,
	deleteBigCommerceProducts,
} from "@/services/bigCommerce";
import { getStoreProducts, getExistingSKUs } from "@/services/products";
import { updateMaxOffset, updateStoreStatus } from "@/services/stores/storeServices-Server";
import { CreateVariantPayload } from "@/types/products";
import { StoreCreationProps } from "@/types/store";
import { getProductConfigs } from "@/utils/bigcommerce/productMappings"; // Create this from existing logic
import { StoreCreationLogger } from "@/utils/logging/storeCreationLogger";
import { StoreReportGenerator } from "@/utils/reports/storeReportGenerator";
import { productConfig } from "@/types/products";
import {
	deleteSizeVariant,
	updateProductDesignStatus,
} from "@/services/bigCommerce/products/bigCommerceProductServices";

/**
 * Orchestrates the full BigCommerce store publish flow for a prepared store workspace.
 * This includes creating the storefront container, deriving product operations from the
 * persisted store data, executing those operations in the required order, and recording
 * both logs and report data for downstream auditing.
 */
export const handleCreateStore = async (
	store: StoreCreationProps,
	category_list: string[],
	logger: StoreCreationLogger,
	reportGenerator: StoreReportGenerator,
): Promise<{
	logger: StoreCreationLogger;
	reportGenerator: StoreReportGenerator;
	error?: Error;
}> => {
	let errorMessage = "";
	try {
		const category_id = await createBigCommerceStore({ store, logger });

		const storeProductsList = await getStoreProducts(store.store_code);

		// Log the fetched products for debugging
		console.log("Fetched Products:", storeProductsList);

		// Modify mode reuses an existing BigCommerce store, so we pre-load live SKUs to avoid recreating products.
		let createdSKUs: string[] = [];
		if (store.status === "Modify") {
			createdSKUs = await getExistingSKUs(store.store_code);
		}

		if (!storeProductsList || Object.keys(storeProductsList).length === 0) {
			logger.addEntry("ERROR", "No products found for this store");
			throw new Error("No products found for this store.");
		}

		console.log(
			`[handleCreateStore] Creating ${category_list.length} related sub-categories.`,
		);
		const relatedCategories = await createRelatedCategories(
			category_id,
			category_list,
			logger,
		);

		// Configs are grouped by design first so reporting can preserve the same structure the UI shows.
		const processedProductsByDesign: Record<string, productConfig[]> = {};

		console.log(
			"[handleCreateStore] Generating product and variant configurations...",
		);

		const batches: productConfig[][] = [];
		// Offsets are threaded across designs so generated product ordering stays globally unique within the store.
		let currentOffset = store.maximum_offset || 1;

		// print the storeProductsList keys + Values
		console.log("Store Products List:");
		for (const [key, value] of Object.entries(storeProductsList)) {
			console.log(`Design ID: ${key}: Products Count: ${value.length}`);
			for (const product of value) {
				console.log(`- Product Name: ${product.productName} - Sage Code: ${product.sageCode}`);

			}
		}

		for (const [designId, products] of Object.entries(storeProductsList)) {
			const { configs, nextOffset } = await getProductConfigs(
				products,
				category_id,
				designId,
				store.store_code,
				relatedCategories,
				createdSKUs,
				logger,
				currentOffset,
			);
			logger.logProductFetch(store.store_code, products.length);

			processedProductsByDesign[designId] = configs;
			batches.push(configs);
			currentOffset = nextOffset;
		}

		// Reporting happens before API writes so the final report reflects the attempted payload, not only successful creates.
		reportGenerator.processProductData(processedProductsByDesign);

		let totalSuccessCount = 0;
		let totalFailedCount = 0;

		console.log(
			`[handleCreateStore] Starting to process ${batches.length} batches.`,
		);
		for (const batch of batches) {
			// Each config category maps to a different BigCommerce operation, so we split them before execution.
			const productCreationBatch = batch.filter(
				(p) => p.category !== "variant" && p.category !== "remove_variant" && p.category !== "remove_product",
			);
			const variantAdditionBatch = batch.filter(
				(p) => p.category === "variant",
			);
			const variantRemovalBatch = batch.filter(
				(p) => p.category === "remove_variant",
			);
			const productRemovalBatch = batch.filter(
				(p) => p.category === "remove_product",
			);

			console.log(
				`[handleCreateStore] Batch contains	: 
				\n${productCreationBatch.length} new products, 
				\n${productRemovalBatch.length} products to remove, 
				\n${variantRemovalBatch.length} variants to remove,
				\n${variantAdditionBatch.length} variants to add.`,
			);
			
			// Full product removals happen first so stale catalog entries do not conflict with recreated replacements.
			if (productRemovalBatch.length > 0) {
				console.log("[handleCreateStore] Processing product removals...");
				const { successCount: removeSuccess, failedCount: removeFailed } =
					await deleteBigCommerceProducts(productRemovalBatch, logger);
				// We can track removal stats if needed, or just log them
				console.log(`[handleCreateStore] Removed ${removeSuccess} products, failed ${removeFailed}`);
			}

			const { successCount, failedCount } = await createBigCommerceProducts(
				productCreationBatch,
				logger,
			);
			totalSuccessCount = totalSuccessCount + successCount;
			totalFailedCount = totalFailedCount + failedCount;


			// Variant deletions must run before additions so size changes do not collide with existing option values.
			if (variantRemovalBatch.length > 0)
				console.log("[handleCreateStore] Processing variant removals...");
			for (const variantConfig of variantRemovalBatch) {
				try {
					const { productId, sizeLabel } = variantConfig.productConfigs as {
						productId: number;
						sizeLabel: string;
					};
					await deleteSizeVariant({ productId, sizeLabel, logger });
					console.log(
						`  - Variant '${sizeLabel}' for product ${productId} processed for deletion.`,
					);
				} catch (e: any) {
					logger.addEntry("ERROR", `Failed to remove variant: ${e.message}`);
				}
			}

			if (variantAdditionBatch.length > 0)
				console.log("[handleCreateStore] Processing variant additions...");
			for (const variantConfig of variantAdditionBatch) {
				try {
					const { productId, sizeLabel, variant } =
						variantConfig.productConfigs as {
							productId: number;
							sizeLabel: string;
							variant: CreateVariantPayload;
						} & { db_identifiers: any }; // Assuming db_identifiers is part of the payload now
					await addSizeVariant({ productId, sizeLabel, variant, logger });
					logger.addEntry(
						"INFO",
						`Successfully added variant ${sizeLabel} to product ID ${productId}`,
					);
					console.log(
						`  - Variant '${sizeLabel}' for product ${productId} processed for addition.`,
					);

					// Successful variant syncs clear the temporary modify-state marker stored against the design/product row.
					if (variantConfig.db_identifiers) {
						await updateProductDesignStatus(
							variantConfig.db_identifiers,
							"added",
							logger,
						);
					}
				} catch (e: any) {
					logger.addEntry("ERROR", `Failed to add variant: ${e.message}`);
					// Variant failures are logged and the batch continues so one bad size does not abort the whole store publish.
				}
			}
		}

		console.log(
			"[handleCreateStore] All batches processed. Updating store status to 'Approved'.",
		);
		
		// The final offset is intended to be persisted so future modify runs can continue numbering from the last published value.
		console.log("[handleCreateStore] Saving final offset number:", currentOffset);
		await updateMaxOffset(store.store_code, currentOffset);

		// update store status to Approved after processing all batches
		await updateStoreStatus(store.store_code, "Approved");

		logger.logStoreStatusUpdate("Approved");

		logger.completeWithSuccess({
			totalProducts: batches.reduce((acc, b) => acc + b.length, 0),
			totalCategories: relatedCategories.length,
			successfulProducts: totalSuccessCount,
			failedProducts: totalFailedCount,
		});
	} catch (error: any) {
		errorMessage = error.message || "Unknown error";
		console.error("Store creation error:", errorMessage);
		logger.completeWithError(errorMessage);
		return {
			logger,
			reportGenerator,
			error: new Error("Store creation error: " + errorMessage),
		};
		// Optionally, you can add more context to the log here
	}

	// The caller persists the logger/report artifacts after this orchestration step finishes.
	return { logger, reportGenerator };
};
