import { NextRequest, NextResponse } from "next/server";
import { StoreCreationProps } from "@/types/store";
import { createStore } from "@/services/stores";

const createDbStore = async (StoreCreationProps: StoreCreationProps) => {
	try {
		const response = await createStore(StoreCreationProps);
		console.log("Store Creation Response: ", response);
		return response;
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
};

export async function POST(request: NextRequest) {
	try {
		const body : StoreCreationProps = await request.json();
		
		// Create a store
		const response : Awaited<ReturnType<typeof createDbStore>>= await createDbStore({
			...body
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
	} catch (e: unknown) {
		if (e instanceof Error) {
            console.error("Error in POST handler:", e.message);
            return NextResponse.json(
                {
                    message: "Internal server error",
                    error: e.message,
                },
                { status: 500 }
            );
        }
	}
}
