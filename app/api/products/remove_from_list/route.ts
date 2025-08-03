import { removeFromList } from "@/services/products";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { store_code, product_id, design_code} = body;

        console.log(
            "Request Body: ",
            store_code,
            product_id,
            design_code
        );

        // Remove from list
        const response = await removeFromList({
            store_code,
            product_id,
            design_code
        });

        console.log("Response: ", response);

        if (!response) {
            return NextResponse.json(
                { error: "Failed to remove from list" },
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