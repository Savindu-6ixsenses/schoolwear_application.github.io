import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";

// GET: /api/search_products
export async function GET(request: Request) {
	const supabase = createClient();
	console.log("URL :",request.url)
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

		let { data: products, error } = await supabase.rpc("get_store_products", {
			in_store_code: store_code,
			in_design_id: design_id,
		});
		if (error) {
			console.error(error);
			return NextResponse.json(
				{ error: "Failed to fetch products" },
				{ status: 500 }
			);
		}

		let filteredProducts = products;

		if (!query) {
			filteredProducts = products;
		} else {
			filteredProducts = products.filter((product: any) =>
				product["SAGE Code"]?.toLowerCase().includes(query.toLowerCase())
			);
		}

		// If a query exists, filter products based on the query
		if (query) {
			filteredProducts = filteredProducts.filter((product: any) =>
				product["SAGE Code"]?.toLowerCase().includes(query.toLowerCase())
			);
		}

		// If categories are provided, filter by them
		if (categories && categories.length > 0) {
			filteredProducts = filteredProducts.filter((product: any) =>
				categories.some((category) =>
					product["Product Name"]
						?.toLowerCase()
						.includes(category.toLowerCase())
				)
			);
		}

		console.log("These are the filtered Products", filteredProducts);

		// Return the fetched products
		return NextResponse.json(filteredProducts);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}
