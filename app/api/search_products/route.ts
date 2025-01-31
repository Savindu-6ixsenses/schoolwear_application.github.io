import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { StoreProduct } from "@/types/products";

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

		let { data: products, error } = await supabase.rpc("get_store_products_4", {
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
		// If query doesn't exists.
		if (!query) {
			filteredProducts = products;
		} else {
			// Filter using the query (SageCode)
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

		// console.log("These are the filtered Products", filteredProducts);

		// Normalize the keys
		const normalizedProducts: StoreProduct[] = filteredProducts.map((product: any) => ({
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

		console.log("Products in the list are", normalizedProducts);

		return NextResponse.json(normalizedProducts);
	} catch (error) {
		console.error("Error fetching products:", error);
		return NextResponse.json(
			{ error: "Failed to fetch products" },
			{ status: 500 }
		);
	}
}
