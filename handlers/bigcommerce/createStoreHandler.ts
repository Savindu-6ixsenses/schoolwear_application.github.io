import { GLOBAL_SUBCATEGORIES } from "@/constants/products";
import {
	createBigCommerceStore,
	createRelatedCategories,
	createBigCommerceProducts,
} from "@/services/bigCommerce";
import { getStoreProducts } from "@/services/products";
import { updateStoreStatus } from "@/services/stores";
import { StoreCreationProps } from "@/types/store";
import { getProductConfigs } from "@/utils/bigcommerce/productMappings"; // Create this from existing logic

export const handleCreateStore = async (
	store: StoreCreationProps,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	designId: string
) => {
	const category_id = await createBigCommerceStore(store);
	const storeProductsList = await getStoreProducts(store.store_code);

	const createdSageCodes: string[] = [];

	if (!storeProductsList || Object.keys(storeProductsList).length === 0) {
		throw new Error("No products found for this store.");
	}

	const relatedCategories = await createRelatedCategories(
		category_id,
		GLOBAL_SUBCATEGORIES
	);

	const batches = Object.values(storeProductsList).map((products, i) =>
		getProductConfigs(
			products,
			category_id,
			store.store_code,
			i + 1,
			relatedCategories,
			createdSageCodes
		)
	);

	for (const batch of batches) {
		await createBigCommerceProducts(batch);
	}

	await updateStoreStatus(store.store_code, "Approved");
};
