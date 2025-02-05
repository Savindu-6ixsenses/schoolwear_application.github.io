import { StoreProduct, SupabaseProduct } from "@/types/products";
import { createClient } from "@/utils/supabase/ssr_client/server";

export const getStoreProducts = async (
	storeCode: string,
	designCode: string
): Promise<StoreProduct[]> => {
	const supabase = createClient();

	console.log(
		"Fetching products for store:",
		storeCode + " and design:",
		designCode
	);

	try {
		// Call the Supabase RPC function
		const { data: products } = await supabase.rpc("get_products_to_create", {
			in_store_code: storeCode,
			in_design_code: designCode,
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
			})
		);

		return normalizedProducts;
	} catch (error) {
		console.error("Error fetching and normalizing products:", error);
		throw error;
	}
};
