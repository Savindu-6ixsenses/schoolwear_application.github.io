/* eslint-disable @typescript-eslint/no-explicit-any */
// import { SupabaseClient } from "@supabase/supabase-js";
import {
	ListPropsProducts,
	StoreProduct,
	SupabaseProduct,
} from "@/types/products";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { createClientbyRole } from "@/utils/adminHelper";

// utils/productFetcher.ts
// export async function fetchProductsFromSupabase(
// 	supabase: SupabaseClient<any, "public", any>,
// 	in_store_code: string,
// 	in_design_id: string,
// 	in_page_size: number | undefined,
// 	in_page: number | undefined
// ): Promise<StoreProduct[]> {
// 	const { data: products, error } = await supabase.rpc("get_store_products_4", {
// 		in_store_code,
// 		in_design_id,
// 		in_page_size,
// 		in_page,
// 	});

// 	if (error) {
// 		throw new Error(`Error fetching products: ${error.message}`);
// 	}

// 	// Normalize the keys
// 	return products.map((product: any) => ({
// 		productId: product["Product ID"],
// 		sageCode: product["SAGE Code"],
// 		productName: product["Product Name"],
// 		brandName: product["Brand Name"],
// 		productDescription: product["Product Description"],
// 		productWeight: product["Product Weight"],
// 		category: product["Category"],
// 		parentSageCode: product["Product Code/SKU"],
// 		designId: product["Design_Id"],
// 		sizeVariations: product["size_variations"],
// 		isAdded: product["is_added"],
// 		XS: product["XS"],
// 		SM: product["SM"],
// 		MD: product["MD"],
// 		LG: product["LG"],
// 		XL: product["XL"],
// 		X2: product["X2"],
// 		X3: product["X3"],
// 	}));
// }

// utils/productFetcher.ts
export async function fetchFilteredProductsFromSupabase(
	supabase: any,
	in_store_code: string,
	in_design_id: string,
	in_search_query: string | undefined | null,
	in_category: string[] | undefined | null,
	in_page_size: number | undefined,
	in_page: number | undefined
): Promise<[StoreProduct[], number]> {
	console.log(
		"These are the parameters.",
		"\nin_store_code",
		in_store_code,
		"\nin_design_id",
		in_design_id,
		"\nin_search_query",
		`${in_search_query?.toUpperCase()}`,
		"\nin_category",
		in_category,
		"\nin_page_size",
		in_page_size,
		"\nin_page",
		in_page
	);

	if (!in_store_code || !in_design_id) {
		throw new Error("store_code and design_id are required");
	}

	// Handle when no category or search query is provided. Convert to NULL for the stored procedure
	if (in_category?.length === 0) {
		in_category = null;
	}

	if (!in_search_query) {
		in_search_query = null;
	}

	const { data: products, error } = await supabase.rpc(
		"get_filtered_store_products_v2",
		{
			in_store_code,
			in_design_id,
			search_query: in_search_query?.toUpperCase(),
			category_list: in_category,
			in_page_size,
			in_page,
		}
	);

	if (error) {
		throw new Error(`Error fetching products 1: ${error.message}`);
	}

	const totalFilteredProducts: number = products[0]["TotalCount"];

	// Normalize the keys
	const filteredProducts: StoreProduct[] = products.map((product: any) => ({
		productId: product["Product ID"],
		sageCode: product["SAGE Code"],
		productName: product["Product Name"],
		brandName: product["Brand Name"],
		productDescription: product["Product Description"],
		productWeight: product["Product Weight"],
		category: product["Category"],
		parentSageCode: product["Product Code/SKU"],
		designId: product["Design_Id"],
		sizeVariations: product["size_variations"],
		isAdded: product["is_added"],
		// naming_method: product["naming_method"],
		// naming_fields: product["naming_fields"],
		naming_method: "1",
		naming_fields: { brandName: product["Brand Name"] , ...product["naming_fields"]},
		XS: product["XS"],
		SM: product["SM"],
		MD: product["MD"],
		LG: product["LG"],
		XL: product["XL"],
		X2: product["X2"],
		X3: product["X3"],
	}));

	return [filteredProducts, totalFilteredProducts];
}

export const getStoreProducts = async (
	storeCode: string
): Promise<Record<string, StoreProduct[]>> => {
	const supabase = await createClient();

	const normalizedProductsList: Record<string, StoreProduct[]> = {};

	console.log("Fetching products for store:", storeCode + " and design:");

	try {
		// Get the Design IDs from the Store
		const { data: designIds, error: storeError } = await supabase
			.from("stores_products_designs_2")
			.select("Design_ID")
			.eq("Store_Code", storeCode);
		if (storeError) {
			console.error("Error fetching store data:", storeError);
			throw storeError;
		}
		if (!designIds) {
			console.error("No store data found for store code:", storeCode);
			throw new Error("No store data found");
		}

		// Call the Supabase RPC function
		for (const designCode of designIds) {
			console.log("Fetching products for design:", designCode.Design_ID);

			// Fetch products for the current design code
			const { data: products } = await supabase.rpc(
				"get_products_to_create_v2",
				{
					in_store_code: storeCode,
					in_design_code: designCode.Design_ID,
				}
			);

			// Normalize the data into the StoreProduct format
			const normalizedProducts: StoreProduct[] = products.map(
				(product: SupabaseProduct) => ({
					productId: product["Product ID"],
					sageCode: product["SAGE Code"],
					productName: product["Product Name"],
					brandName: product["Brand Name"],
					productDescription: product["Product Description"],
					productWeight: product["Product Weight"],
					category: product["Category"],
					parentSageCode: product["Product Code/SKU"],
					sizeVariations: product["size_variations"],
					naming_method: product["naming_method"],
					naming_fields: product["naming_fields"],
				})
			);

			normalizedProductsList[designCode.Design_ID] = normalizedProducts;
		}

		return normalizedProductsList;
	} catch (error) {
		console.error("Error fetching and normalizing products:", error);
		throw error;
	}
};

export const addToList = async ({
	store_code,
	product_id,
	design_code,
	size_variations,
	method,
	naming_fields,
}: ListPropsProducts) => {
	try {
		console.log(
			"Adding to list: ",
			store_code,
			product_id,
			design_code,
			size_variations
		);
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			throw new Error("User not authenticated to add a product to the list.");
		}

		// TODO: Check if the store status is "Approved", if so, block adding to the list.
		const { data, error } = await supabase
			.from("stores_products_designs_2")
			.insert([
				{
					user_id: user.id,
					Store_Code: `${store_code}`,
					Product_ID: `${product_id}`,
					Design_ID: `${design_code}`,
					size_variations: size_variations,
					naming_method: method || 1,
					naming_fields: naming_fields || {},
				},
			])
			.select();
		console.log(data, error);
		return data;
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
};

export const updateItem = async ({
	store_code,
	product_id,
	design_code,
	size_variations,
	method,
	naming_fields,
}: ListPropsProducts) => {
	try {
		console.log(
			"Updating item: ",
			store_code,
			product_id,
			design_code,
			size_variations,
			method,
			naming_fields
		);
		const { supabase, isAdmin, user_id } = await createClientbyRole();

		// TODO: Check if the store status is "Approved", if so, block updating the list.
		let query = supabase
			.from("stores_products_designs_2")
			.update({
				size_variations: size_variations,
				naming_method: method || 1, // Default to 1 if not provided
				naming_fields: naming_fields || {}, // Default to empty object if not provided
			})
			.eq("Store_Code", store_code)
			.eq("Product_ID", product_id)
			.eq("Design_ID", design_code);

		if (!isAdmin) {
			query = query.eq("user_id", user_id);
		}

		const { data, error } = await query.select();

		console.log("Updated data:", data, "Error:", error);
		return data;
	} catch (e) {
		console.error("Unexpected error during update:", e);
		throw e;
	}
};

export const removeFromList = async ({
	store_code,
	product_id,
	design_code,
}: {
	store_code: string;
	product_id: string;
	design_code: string;
}) => {
	try {
		console.log(
			"Removing from the list: ",
			store_code,
			product_id,
			design_code
		);
		const { supabase, isAdmin, user_id } = await createClientbyRole();
		// const { data, error } = await supabase
		// 	.from("stores_products_designs_2")
		// 	.delete()
		// 	.eq("Store_Code", `${store_code}`)
		// 	.eq("Product_ID", `${product_id}`)
		// 	.eq("Design_ID", `${design_code}`)
		// 	.select();
		// console.log(data, error);

		// TODO: Check if the store status is "Approved", if so, block deleting from the list
		let query = supabase
			.from("stores_products_designs_2")
			.delete()
			.eq("Store_Code", `${store_code}`)
			.eq("Product_ID", `${product_id}`)
			.eq("Design_ID", `${design_code}`);

		if (!isAdmin) {
			query = query.eq("user_id", user_id);
		}

		const { data, error } = await query.select();

		if (error) {
			console.error("Error removing from list:", error);
			throw error;
		}
		return data;
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
};

export const initialize_added_products = async (store_code: string) => {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("get_added_products_json", {
		store_code_input: store_code,
	});

	if (error) {
		console.error("[Supabase RPC Error]", error.message);
		throw new Error("Failed to initialize added products.");
	}

	return data;
};
