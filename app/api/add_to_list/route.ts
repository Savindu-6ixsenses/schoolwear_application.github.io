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


const addToList = async ({
	store_code,
	product_id,
	design_code,
	size_variations,
	method,
	naming_fields,
}: ListProps) => {
	try {
		console.log(
			"Adding to list: ",
			store_code,
			product_id,
			design_code,
			size_variations
		);
		const supabase = createClient();
		const { data, error } = await supabase
			.from("stores_products_designs_2")
			.insert([
				{
					Store_Code: `${store_code}`,
					Product_ID: `${product_id}`,
					Design_ID: `${design_code}`,
					size_variations: size_variations,
					naming_method: method || 1,
					naming_fields: naming_fields || {},
				},
			])
			.select();
		console.log(data, error);
		return data;
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { store_code, product_id, design_code, size_variations, method, naming_fields } = body;

		console.log(
			"Request Body: ",
			store_code,
			product_id,
			design_code,
			size_variations,
			method,
			naming_fields	
		);

		// Add to list
		const response = await addToList({
			store_code,
			product_id,
			design_code,
			size_variations,
			method,
			naming_fields,
		});

		console.log("Response: ", response);

		if (!response) {
			return NextResponse.json(
				{ error: "Failed to add to list" },
				{ status: 500 }
			);
		}
		return NextResponse.json(
			{ success: true, data: response },
			{ status: 200 }
		);
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
}
