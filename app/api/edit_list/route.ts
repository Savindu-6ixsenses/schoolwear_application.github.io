import { createClient } from "@/utils/supabase/ssr_client/server";
import { NextRequest, NextResponse } from "next/server";

interface ListProps {
	store_code: string;
	product_id: string;
	design_code: string;
	size_variations: string[];
	method?: string;
	naming_fields?: { [key: string]: string };
}

const updateItem = async ({
	store_code,
	product_id,
	design_code,
	size_variations,
	method,
	naming_fields,
}: ListProps) => {
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
		const supabase = createClient();

		const { data, error } = await supabase
			.from("stores_products_designs_2")
			.upsert({
				Store_Code: store_code,
				Product_ID: product_id,
				Design_ID: design_code,
				size_variations: size_variations, 
				naming_method: method || 1, // Default to 1 if not provided
				naming_fields: naming_fields || {}, // Default to empty object if not provided
			})
			.eq("Store_Code", store_code)
			.eq("Product_ID", product_id)
			.eq("Design_ID", design_code)
			.select();

		console.log("Updated data:", data, "Error:", error);
		return data;
	} catch (e) {
		console.error("Unexpected error during update:", e);
		throw e;
	}
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			store_code,
			product_id,
			design_code,
			size_variations,
			method,
			naming_fields,
		} = body;

		console.log("Request Body for POST:", body);

		const response = await updateItem({
			store_code,
			product_id,
			design_code,
			size_variations,
			method: method,
			naming_fields,
		});
		console.log("Response from updateItem:", response);

		if (!response) {
			return NextResponse.json(
				{ error: "Failed to update item" },
				{ status: 500 }
			);
		}
		return NextResponse.json(
			{ success: true, data: response },
			{ status: 200 }
		);
	} catch (e) {
		console.error("Unexpected error in PUT:", e);
		throw e;
	}
}
