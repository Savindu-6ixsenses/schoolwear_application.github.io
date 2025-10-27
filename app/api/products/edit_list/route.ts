import { NextRequest, NextResponse } from "next/server";
import { updateItem } from "@/services/products";

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
			product_status,
			store_status,
		} = body;

		console.log("Request Body for POST:", body);

		const response = await updateItem({
			store_code,
			product_id,
			design_code,
			size_variations,
			method: method,
			naming_fields,
			product_status,
			store_status,});
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
