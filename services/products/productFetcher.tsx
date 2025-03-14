/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoreProduct } from "@/types/products";
import { SupabaseClient } from "@supabase/supabase-js";

// utils/productFetcher.ts
export async function fetchProductsFromSupabase(
	supabase: SupabaseClient<any, "public", any>,
	in_store_code: string,
	in_design_id: string,
	in_page_size: number | undefined,
	in_page: number | undefined
): Promise<StoreProduct[]> {
	const { data: products, error } = await supabase.rpc("get_store_products_4", {
		in_store_code,
		in_design_id,
		in_page_size,
		in_page,
	});

	if (error) {
		throw new Error(`Error fetching products: ${error.message}`);
	}

	// Normalize the keys
	return products.map((product: any) => ({
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
		SM: product["SM"],
		MD: product["MD"],
		LG: product["LG"],
		XL: product["XL"],
		X2: product["X2"],
		X3: product["X3"],
	}));
}

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
		SM: product["SM"],
		MD: product["MD"],
		LG: product["LG"],
		XL: product["XL"],
		X2: product["X2"],
		X3: product["X3"],
	}));

	return [filteredProducts, totalFilteredProducts];
}
