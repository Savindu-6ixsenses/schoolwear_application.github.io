import { NextResponse } from "next/server";
import { updateProductName } from "@/services/products";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { store_code, sage_code, design_code, product_name } = body;

		// Checks for falsy values AND whitespace-only strings
		if (
			!store_code ||
			!sage_code ||
			!design_code ||
			!product_name ||
			(typeof product_name === "string" && !product_name.trim())
		) {
			return NextResponse.json(
				{ message: "Missing required fields" },
				{ status: 400 }
			);
		}

		const result = await updateProductName({
			store_code,
			sage_code,
			design_code,
			product_name,
		});

		return NextResponse.json(result, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{ message: "Internal Server Error", error: error },
			{ status: 500 }
		);
	}
}
