/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	createBigCommerceStore,
	createRelatedCategories,
	createBigCommerceProducts,
} from "@/services/bigCommerce";
import { getStoreProducts } from "@/services/products";
import { updateStoreStatus } from "@/services/stores/storeServices-Server";
import { StoreCreationProps } from "@/types/store";
import { getProductConfigs } from "@/utils/bigcommerce/productMappings"; // Create this from existing logic
import { StoreCreationLogger } from "@/utils/logging/storeCreationLogger";
import { StoreReportGenerator } from "@/utils/reports/storeReportGenerator";
import { productConfig } from "@/types/products";

export const handleCreateStore = async (
	store: StoreCreationProps,
	category_list: string[],
	logger: StoreCreationLogger,
	reportGenerator: StoreReportGenerator
): Promise<{
	logger: StoreCreationLogger;
	reportGenerator: StoreReportGenerator;
	error?: Error;
}> => {
	let errorMessage = "";
	try {
		const category_id = await createBigCommerceStore({store, logger});

		const storeProductsList = await getStoreProducts(store.store_code);
		const createdSageCodes: string[] = [];

		if (!storeProductsList || Object.keys(storeProductsList).length === 0) {
			logger.addEntry(
				"ERROR","No products found for this store")
			throw new Error("No products found for this store.");
		}

		const relatedCategories = await createRelatedCategories(
			category_id,
			category_list,
			logger
		);

		// --- PRODUCT CREATION & LOGGING ---
		const processedProductsByDesign: Record<string, productConfig[]> = {};

		const batches = Object.entries(storeProductsList).map(
			([designId, products], i) => {
				const productConfigs = getProductConfigs(
					products,
					category_id,
					store.store_code,
					i + 1,
					relatedCategories,
					createdSageCodes,
					logger
				);
				logger.logProductFetch(store.store_code, products.length);

				processedProductsByDesign[designId] = productConfigs;

				return productConfigs;
			}
		);

		// --- REPORT GENERATION: Add all products to report, regardless of creation success ---
		reportGenerator.processProductData(processedProductsByDesign);

		let totalSuccessCount = 0;
		let totalFailedCount = 0;

		for (const batch of batches) {
			const { successCount, failedCount } = await createBigCommerceProducts(
				batch,
				logger
			);
			totalSuccessCount += successCount;
			totalFailedCount += failedCount;
		}

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
		return {logger, reportGenerator, error: new Error("Store creation error: " + errorMessage)};
		// Optionally, you can add more context to the log here
	}

	// Return logger and reportGenerator for persistence in route.ts
	return { logger, reportGenerator };
};
