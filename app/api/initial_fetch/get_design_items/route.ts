import { NextRequest, NextResponse } from "next/server";
import { getExistingDesigns } from "@/services/designs";

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {storeCode} = body; 
    const  data = await getExistingDesigns(storeCode)
    return NextResponse.json({ designItems: data }, { status: 200});
  } catch (error) {
    console.error("Error fetching design items:", error);
    return 
  }
}
