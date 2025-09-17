import { updateNote } from "@/services/notes/notesServices";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
	try {
		const { design_id, note } = await request.json();

		if (!design_id || !note) {
			return NextResponse.json(
				{ error: "Missing required fields: design_id and note" },
				{ status: 400 }
			);
		}

		await updateNote({ design_id, note });

		return NextResponse.json(
			{ message: "Note updated successfully" },
			{ status: 200 }
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "An unexpected error occurred";
		console.error("Error updating note:", errorMessage);
		return NextResponse.json(
			{ error: `Failed to update note: ${errorMessage}` },
			{ status: 500 }
		);
	}
}
