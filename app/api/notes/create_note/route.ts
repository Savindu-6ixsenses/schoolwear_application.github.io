import { createNote } from "@/services/notes/notesServices";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { note, design_id, store_code } = await request.json();

		if (!note || !design_id || !store_code) {
			return NextResponse.json(
				{ error: "Missing required fields: note, design_id, and store_code" },
				{ status: 400 } 
			);
		}

		await createNote({ note, design_id, store_code });

		return NextResponse.json(
			{ message: "Note created successfully" },
			{ status: 201 }
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unexpected error occurred";
		console.error("Error creating note:", errorMessage);
		return NextResponse.json(
			{ error: `Failed to create note: ${errorMessage}` },
			{ status: 500 }
		);
	}
}
