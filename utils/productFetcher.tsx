import { StoreProduct } from "@/types/products";

// utils/productFetcher.ts
export async function fetchProductsFromSupabase(
	in_store_code: string,
	in_design_id: string,
	supabase: any
): Promise<StoreProduct[]> {
	let { data: products, error } = await supabase.rpc("get_store_products_4", {
		in_store_code,
		in_design_id,
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
