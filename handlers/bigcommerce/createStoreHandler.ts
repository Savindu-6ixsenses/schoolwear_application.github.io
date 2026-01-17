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

		// If the store is being modified, fetch existing sage codes to avoid duplicates.
		let createdSageCodes: string[] = [];
		if (store.status === "Modify") {
			createdSageCodes = await getExistingSKUs(store.store_code);
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

		// --- PRODUCT CREATION & LOGGING ---
		const processedProductsByDesign: Record<string, productConfig[]> = {};

		console.log(
			"[handleCreateStore] Generating product and variant configurations...",
		);

		const batches: productConfig[][] = [];
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
				createdSageCodes,
				logger,
				currentOffset,
			);
			logger.logProductFetch(store.store_code, products.length);

			processedProductsByDesign[designId] = configs;
			batches.push(configs);
			currentOffset = nextOffset;
		}

		// save the current offset number for future use
		console.log("[handleCreateStore] Saving final offset number:", currentOffset);
		await updateMaxOffset(store.store_code, currentOffset);

		// --- REPORT GENERATION: Add all products to report, regardless of creation success ---
		reportGenerator.processProductData(processedProductsByDesign);

		let totalSuccessCount = 0;
		let totalFailedCount = 0;

		console.log(
			`[handleCreateStore] Starting to process ${batches.length} batches.`,
		);
		for (const batch of batches) {
			// Separate the products which doesn't involve variant or remove variant actions
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
			
			// Process product removals
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


			// Process variant removals first
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

					// After adding the variant, update the product status back to 'added'
					if (variantConfig.db_identifiers) {
						await updateProductDesignStatus(
							variantConfig.db_identifiers,
							"added",
							logger,
						);
					}
				} catch (e: any) {
					logger.addEntry("ERROR", `Failed to add variant: ${e.message}`);
					// Note: You might want to mark the product as 'rejected' here if a variant fails.
				}
			}
		}

		console.log(
			"[handleCreateStore] All batches processed. Updating store status to 'Approved'.",
		);
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

	// Return logger and reportGenerator for persistence in route.ts
	return { logger, reportGenerator };
};
