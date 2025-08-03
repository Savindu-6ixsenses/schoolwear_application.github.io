import { NextRequest, NextResponse } from "next/server";
import { initialize_added_products } from "@/services/products";


export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body?.store_code) {
			return NextResponse.json(
				{ message: "Missing required field: store_code" },
				{ status: 400 }
			);
		}

		const added_product_data = await initialize_added_products(body.store_code);

		return NextResponse.json(
			{ designItems: added_product_data },
			{ status: 200 }
		);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		console.error("[API Error] Failed to initialize products:", error);
		return NextResponse.json(
			{ message: error?.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
