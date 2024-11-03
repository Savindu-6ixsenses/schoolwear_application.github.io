import { createClient } from "@/utils/supabase/ssr_client/server";
import { NextRequest, NextResponse } from "next/server";

interface ListProps {
	store_code: string;
	sage_code: string;
	design_code: string;
}

const addToList = async ({ store_code, sage_code, design_code }: ListProps) => {
	const supabase = createClient();
	try {
		console.log("Adding to list: ", store_code, sage_code, design_code);
		const { data, error } = await supabase
			.from("Stores_Products_Designs")
			.insert([
				{
					Store_Code: `${store_code}`,
					Product_Sage_Code: `${sage_code}`,
					Design_Code: `${design_code}`,
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
		const {
			store_code: storeCode,
			sage_code: sageCode,
			design_code: designCode,
		} = body;

		// Add to list
		const response = await addToList({
			store_code: storeCode,
			sage_code: sageCode,
			design_code: designCode,
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
