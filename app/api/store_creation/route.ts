import { NextRequest, NextResponse } from "next/server";
import { StoreCreationProps } from "@/types/store";
import {
	createDbStore,
	updateDbStore,
	getDbStore,
} from "@/services/stores/storeServices-Server";

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

// Get store details by store code
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const storeCode = searchParams.get("store_code");

		if (!storeCode) {
			return NextResponse.json(
				{ message: "Store code is required" },
				{ status: 400 }
			);
		}

		const data = await getDbStore(storeCode);
		return NextResponse.json(data, { status: 200 });
	} catch (error: unknown) {
		console.error("Error in GET handler:", error);
		return NextResponse.json(
			{ message: "Internal Server Error", error: String(error) },
			{ status: 500 }
		);
	}
}

// Edit the store details based on store code
export async function PUT(request: NextRequest) {
	try {
		const storeData: StoreCreationProps = await request.json();

		// Edit an existing store
		const response: Awaited<ReturnType<typeof updateDbStore>> =
			await updateDbStore({
				...storeData,
			});

		return NextResponse.json(
			{
				message: "Store updated successfully",
				response: response.data,
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		// Log the full error to the console for debugging
		console.error("Error in PUT handler:", error);
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
