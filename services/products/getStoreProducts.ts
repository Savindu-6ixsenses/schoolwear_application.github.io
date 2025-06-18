import { StoreProduct, SupabaseProduct } from "@/types/products";
import { createClient } from "@/utils/supabase/ssr_client/server";

export const getStoreProducts = async (
	storeCode: string,
): Promise<Record<string, StoreProduct[]>> => {
	const supabase = createClient();

	const normalizedProductsList: Record<string, StoreProduct[]> = {};	

	console.log(
		"Fetching products for store:",
		storeCode + " and design:",
	);

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
			const { data: products } = await supabase.rpc("get_products_to_create_v2", {
				in_store_code: storeCode,
				in_design_code: designCode.Design_ID,
			});

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
