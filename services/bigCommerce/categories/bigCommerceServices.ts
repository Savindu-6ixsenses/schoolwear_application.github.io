'use server'

import { StoreCreationProps } from "@/types/store";
import { sendAPIRequestBigCommerce } from "../apiClient";
import { StoreCreationLogger } from "@/utils/logging/storeCreationLogger";
import { createClient } from "@/utils/supabase/ssr_client/server";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH!;

export const createBigCommerceStore = async ({
	store,
	logger,
}: {
	store: StoreCreationProps;
	logger: StoreCreationLogger;
}): Promise<number> => {
	const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;

	const body = [
		{
			name: store.store_name,
			url: {
				path: `/${store.store_code.replace(/\s+/g, "-")}/`,
				is_customized: false,
			},
			parent_id: 0,
			tree_id: 1,
			description: `${store.start_date} to ${store.end_date}`,
			is_visible: false,
			layout_file: "category.html",
		},
	];

	try {
		const responseData = await sendAPIRequestBigCommerce(
			categoryUrl,
			"POST",
			body
		);
		if (!responseData?.data?.[0]?.category_id) {
			throw new Error(
				"Unexpected response from BigCommerce while creating store."
			);
		}
		logger.logStoreCreation(store, responseData.data[0].category_id);
		console.log("Store Created Successfully", responseData.data[0]);
		console.log("Store Category ID:", responseData.data[0].category_id);

		//update the store's category id in the stores table
		await updateStoreCategoryId(store.store_code, responseData.data[0].category_id);

		return responseData.data[0].category_id;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// Check for duplicate category error
		const errorMsg = error?.message || "";
		if (
			errorMsg.includes("A duplicate category with the name") &&
			errorMsg.includes(store.store_name)
		) {
			// Fetch all categories and find the one with the matching name
			const getCategoriesUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories?name=${encodeURIComponent(
				store.store_name
			)}`;
			const categoriesResponse = await sendAPIRequestBigCommerce(
				getCategoriesUrl,
				"GET"
			);
			const found = categoriesResponse?.data?.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(cat: any) => cat.name === store.store_name
			);
			if (found && found.category_id) {
				// Log added to show that this category was already created earlier
				logger.addEntry("WARNING", "Store already exists with the Store Name", {
					storeName: store.store_name,
					storeCode: store.store_code,
					categoryId: found.category_id,
				});
				return found.category_id;
			} else {
				throw new Error(
					`Duplicate category found but could not retrieve category_id for ${store.store_name}`
				);
			}
		}
		logger.addEntry("ERROR", "Failed to create store");
		throw error;
	}
};

export const createRelatedCategories = async (
	parentId: number,
	subcategories: string[],
	logger: StoreCreationLogger
): Promise<Record<string, number>> => {
	const url = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/categories`;
	const getCategoriesUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/categories?parent_id=${parentId}`;
	const result: Record<string, number> = {};

	try {
		// Fetch existing categories under the parent
		const existingResponse = await sendAPIRequestBigCommerce(
			getCategoriesUrl,
			"GET"
		);
		const existingCategories = existingResponse?.data || [];

		for (const subCat of subcategories) {
			// Check if subcategory already exists
			const found = existingCategories.find(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(cat: any) => cat.name === subCat
			);
			if (found && found.id) {
				result[subCat] = found.id;
				logger.addEntry("INFO", `${subCat} Subcategory already exists`, {
					categoryId: found.id,
				});
				continue;
			}

			// If not found, create new subcategory
			const response = await sendAPIRequestBigCommerce(url, "POST", {
				name: subCat,
				parent_id: parentId,
				is_visible: false,
			});
			result[subCat] = response.data.id;

			logger.logSubCategoryCreation(subCat, response.data.id);
			console.log(`Subcategory Created: ${subCat}`, response.data);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// Handle error appropriately, e.g., log it or rethrow
		console.error("Error creating related categories:", error);
		logger.addEntry("ERROR", "Failed to create related categories", {
			error: error.message,
		});
		throw new Error(`Failed to create related categories: ${error.message}`);
	}

	return result;
};

//Insert the new category id into the stores table for relevent store
export const updateStoreCategoryId = async (
	storeCode: string,
	categoryId: number
) => {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("stores")
		.update({ category_id: categoryId, updated_at: new Date().toISOString() })
		.eq("store_code", storeCode)
		.select()
		.single();

	if (error) {
		console.error(`Failed to update store category ID:`, error);
		throw new Error(`Failed to update store category ID: ${error.message}`);
	}

	console.log(`Store ${storeCode} category ID updated to ${categoryId} successfully.`);
	return { data };
}
