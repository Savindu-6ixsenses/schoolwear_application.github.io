import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";

// GET: /api/search_products
export async function GET(request: Request) {
	const supabase = createClient();
	try {
		// Parse the query parameters
		const { searchParams } = new URL(request.url);
		const store_code = searchParams.get("store_code");
		const design_id = searchParams.get("design_id");
		const query = searchParams.get("q");

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
		if (error) console.error(error);
		else console.log("Products in the list are", products);

		let filteredProducts;

		// If there is no search query, return all products for the given store_code and design_id
		if (!query) {
            filteredProducts = products
        } else {
			//TODO: Update the code here to filter out the products which matches the sage code for now. In future I plan to expand to advanced search features which searches any field of a product when heirarchically.
			filteredProducts = products.filter((product: any) =>
				product["SAGE Code"]?.toLowerCase().includes(query.toLowerCase())
			);

            console.log("These are the filtered Products", filteredProducts)
		}

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
