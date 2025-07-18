import { NextRequest, NextResponse } from "next/server";
import { addToList } from "@/services/products";

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
