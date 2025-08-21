import { NextRequest, NextResponse } from "next/server";
import {
	generateBaseStoreCode,
	fetchExistingStoreCodes,
	getUniqueStoreCode,
} from "@/services/stores/generateStoreCode";

export async function POST(request: NextRequest) {
	try {
		const { schoolName } = await request.json();

		if (!schoolName || typeof schoolName !== "string") {
			return NextResponse.json(
				{ message: "schoolName is required" },
				{ status: 400 }
			);
		}

		const baseCode = generateBaseStoreCode(schoolName);
		const existingCodes = await fetchExistingStoreCodes(baseCode);
		const uniqueCode = getUniqueStoreCode(baseCode, existingCodes);

		return NextResponse.json({ storeCode: uniqueCode });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Internal server error";
		return NextResponse.json({ message }, { status: 500 });
	}
}
