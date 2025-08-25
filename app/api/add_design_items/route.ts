import { NextRequest, NextResponse } from "next/server";
import { createDesign } from "@/services/designs/designServices";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { Design_Guideline, Design_Description, Image_URL, Design_Name, height, width, storeCode } = body;

		console.log(
			"Request Body",
			Design_Guideline,
			Design_Name,
			Design_Description,
			Image_URL,
			storeCode,
			height,
			width
		);

		const data = await createDesign(
			{designGuideline: Design_Guideline,
			designName: Design_Name,
			imageUrl: Image_URL,
			storeCode: storeCode,
			height,
			width}
		);
		return NextResponse.json({ success: true, data: data }, { status: 200 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		console.error("Unexpected error:", e);
		return NextResponse.json(
			{ success: false, message: e.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
