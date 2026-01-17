import { removeFromList } from "@/services/products";
import { removeProductFromStore } from "@/services/products/productServices";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { store_code, sage_code, design_code, product_status } = body;

		console.log(
			"Request Body: ",
			store_code,
			sage_code,
			design_code,
			product_status
		);

		let response;

		// Remove from list
		if (product_status === "new" || product_status === "rejected") {
			response = await removeFromList({
				store_code,
				sage_code,
				design_code,
			});
			console.log("Response to remove from list for a new product: ", response);
		} else {
			response = await removeProductFromStore({
				store_code,
				sage_code,
				design_code,
			});
			console.log(
				"Response to remove from list for a modifying product: ",
				response
			);
		}

		if (!response) {
			return NextResponse.json(
				{ error: "Failed to remove from list" },
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
