import { NextRequest, NextResponse } from "next/server";
import { createDesignItem } from "@/services/designs/designServices";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { Design_Id, Design_Guideline, Design_Description, Image_URL } = body;

		console.log(
			"Request Body",
			Design_Id,
			Design_Guideline,
			Design_Description,
			Image_URL
		);

		const data = await createDesignItem(
			Design_Id,
			Design_Guideline,
			Design_Description,
			Image_URL
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
