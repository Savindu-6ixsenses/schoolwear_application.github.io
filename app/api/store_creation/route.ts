import { NextRequest, NextResponse } from "next/server";
import { StoreCreationProps } from "@/types/store";
import { createClient } from "@/utils/supabase/ssr_client/server";

async function createDbStore(storeData: StoreCreationProps) {
	try {
		const supabase = await createClient();
		// Use getUser() on the server as recommended to validate the session.
		const {
			data: { user },
		} = await supabase.auth.getUser();

		const { data, status, statusText, error } = await supabase
			.from("stores")
			.insert([
				{
					...storeData,
					user_id: user?.id,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				},
			])
			.select();

		if (error) throw error;
		return { data, status, statusText };
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
}

export async function POST(request: NextRequest) {
	try {
		const body: StoreCreationProps = await request.json();

		// Create a store
		const response: Awaited<ReturnType<typeof createDbStore>> =
			await createDbStore({
				...body,
			});

		// Check if the response is successful
		if (response && ![200, 201].includes(response.status)) {
			const errorText = response.statusText;
			return NextResponse.json(
				{
					message: `Failed to create the store: ${response.statusText}`,
					status: response.status,
					error: errorText,
				},
				{ status: response.status }
			);
		}

		// Return a success response
		return NextResponse.json(
			{
				message: "Store created successfully",
				response: response.data,
			},
			{ status: 201 }
		);
	} catch (error: unknown) {
		// Log the full error to the console for debugging
		console.error("Error in POST handler:", error);

		// Ensure a response is always returned
		const errorMessage =
			error instanceof Error ? error.message : "An unknown error occurred.";
		return NextResponse.json(
			{
				message: "Internal Server Error",
				error: errorMessage,
			},
			{ status: 500 }
		);
	}
}
