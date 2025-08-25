import { NextRequest, NextResponse } from "next/server";
import { createDesign, updateDesign, deleteDesign } from "@/services/designs/designServices";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { Design_Id, Design_Guideline, Design_Description, Image_URL, Design_Name, height, width, storeCode } = body;

		console.log(
			"Request Body",
			Design_Id,
			Design_Guideline,
			Design_Name,
			Design_Description,
			Image_URL,
			storeCode,
			height,
			width
		);

		const data = await createDesign(
			{designId: Design_Id,
			designGuideline: Design_Guideline,
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

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { design_id, Design_Name, Design_Guideline, Image_URL, height, width } =
			body;

		if (!design_id) {
			return NextResponse.json(
				{ success: false, message: "Design ID is required for an update." },
				{ status: 400 }
			);
		}
		

		const data = await updateDesign(design_id, {
			Design_Name: Design_Name,
			Design_Guideline: Design_Guideline,
			Image_URL: Image_URL,
			height,
			width,
		});

		return NextResponse.json({ success: true, data: data }, { status: 200 });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		console.error("Unexpected error during update:", e);
		return NextResponse.json(
			{ success: false, message: e.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const design_id = searchParams.get("id");

		if (!design_id) {
			return NextResponse.json(
				{ success: false, message: "Design ID is required." },
				{ status: 400 }
			);
		}

		await deleteDesign(design_id);

		return NextResponse.json(
			{ success: true, message: "Design deleted successfully." },
			{ status: 200 }
		);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (e: any) {
		console.error("Unexpected error during deletion:", e);
		return NextResponse.json(
			{ success: false, message: e.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}