import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { StoreProduct } from "@/types/products";
import { fetchFilteredProductsFromSupabase } from "@/services/products/";

// GET: /api/search_products
export async function GET(request: Request) {
	const supabase = createClient();
	console.log("URL :", request.url);
	try {
		// Parse the query parameters
		const { searchParams } = new URL(request.url);
		const store_code = searchParams.get("store_code");
		const design_id = searchParams.get("design_id");
		const query = searchParams.get("q") || undefined;
		const categories = searchParams.get("categories")?.split(",") || undefined;
		const page = searchParams.get("page") || undefined;
		const page_size = searchParams.get("page_size") || undefined;

		// Validate the required parameters
		if (!store_code || !design_id) {
			return NextResponse.json(
				{ error: "store_code and design_id are required" },
				{ status: 400 }
			);
		}

		// Call the stored procedure to fetch products
		const data: [StoreProduct[], number] =
			await fetchFilteredProductsFromSupabase(
				supabase,
				store_code,
				design_id,
				query,
				categories,
				page_size ? parseInt(page_size) : undefined,
				page ? parseInt(page) : undefined
			);

		const filteredProducts: StoreProduct[] = data[0];
		const totalFilteredProducts: number = data[1];

		// let filteredProducts = products;
		// // If query doesn't exists.
		// if (!query) {
		// 	filteredProducts = products;
		// } else {
		// 	// Filter using the query (SageCode)
		// 	filteredProducts = products.filter((product: StoreProduct) =>
		// 		product.sageCode?.toLowerCase().includes(query.toLowerCase())
		// 	);
		// }

		// // If categories are provided, filter by them
		// if (categories && categories.length > 0) {
		// 	filteredProducts = filteredProducts.filter((product: StoreProduct) =>
		// 		categories.some((category) =>
		// 			product.productName?.toLowerCase().includes(category.toLowerCase())
		// 		)
		// 	);
		// }

		const totalPages = Math.ceil(
			totalFilteredProducts / (page_size ? parseInt(page_size) : 10)
		);

		console.log(
			// "Products in the list are",
			// filteredProducts,
			"\n Total Pages are",
			totalPages,
			"\n Total Products are",
			totalFilteredProducts,
			"\n Page size is",
			page_size
		);

		const response = {
			products: filteredProducts,
			totalPages: totalPages,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}
