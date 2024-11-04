import { createClient } from "@/utils/supabase/ssr_client/server";
import { NextRequest, NextResponse } from "next/server";

interface ListProps {
	store_code: string;
	sage_code: string;
	design_code: string;
	size_variations: string[];
}


const addToList = async ({
	store_code,
	sage_code,
	design_code,
	size_variations,
}: ListProps) => {
	try {
		console.log(
			"Adding to list: ",
			store_code,
			sage_code,
			design_code,
			size_variations
		);
		const supabase = createClient();
		const { data, error } = await supabase
			.from("stores_products_designs")
			.insert([
				{
					Store_Code: `${store_code}`,
					Product_Sage_Code: `${sage_code}`,
					Design_Id: `${design_code}`,
					size_variations: size_variations,
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

const updateItem = async ({
	store_code,
	sage_code,
	design_code,
	size_variations,
}: ListProps) => {
	try {
		console.log(
			"Updating item: ",
			store_code,
			sage_code,
			design_code,
			size_variations
		);
		const supabase = createClient();
		const { data, error } = await supabase
			.from("stores_products_designs")
			.update({
				size_variations: size_variations,
			})
			.eq("Store_Code", store_code)
			.eq("Product_Sage_Code", sage_code)
			.eq("Design_Id", design_code)
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
		const { store_code, sage_code, design_code, size_variations } = body;

		console.log(
			"Request Body: ",
			store_code,
			sage_code,
			design_code,
			size_variations
		);

		// Add to list
		const response = await addToList({
			store_code,
			sage_code,
			design_code,
			size_variations,
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

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { store_code, sage_code, design_code, size_variations } = body;

		console.log("Request Body for PUT:", body);

		const response = await updateItem({
			store_code,
			sage_code,
			design_code,
			size_variations,
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
