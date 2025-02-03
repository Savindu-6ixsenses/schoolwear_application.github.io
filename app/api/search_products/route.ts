import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { StoreProduct } from "@/types/products";
import { fetchProductsFromSupabase } from "@/utils/productFetcher";

// GET: /api/search_products
export async function GET(request: Request) {
	const supabase = createClient();
	console.log("URL :", request.url);
	try {
		// Parse the query parameters
		const { searchParams } = new URL(request.url);
		const store_code = searchParams.get("store_code");
		const design_id = searchParams.get("design_id");
		const query = searchParams.get("q");
		const categories = searchParams.get("categories")?.split(",");

		// Validate the required parameters
		if (!store_code || !design_id) {
			return NextResponse.json(
				{ error: "store_code and design_id are required" },
				{ status: 400 }
			);
		}

		// Call the stored procedure to fetch products
		const products : StoreProduct[] = await fetchProductsFromSupabase(store_code,design_id,supabase);

		let filteredProducts = products;
		// If query doesn't exists.
		if (!query) {
			filteredProducts = products;
		} else {
			// Filter using the query (SageCode)
			filteredProducts = products.filter((product: StoreProduct) =>
				product.sageCode?.toLowerCase().includes(query.toLowerCase())
			);
		}

		// If categories are provided, filter by them
		if (categories && categories.length > 0) {
			filteredProducts = filteredProducts.filter((product: any) =>
				categories.some((category) =>
					product.productName
						?.toLowerCase()
						.includes(category.toLowerCase())
				)
			);
		}

		console.log("Products in the list are", filteredProducts);

		return NextResponse.json(filteredProducts);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}
