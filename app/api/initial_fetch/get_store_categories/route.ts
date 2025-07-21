import { NextRequest, NextResponse } from "next/server";
import { fetchStoreRelatedSubCategories } from "@/services/stores";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Request Body:", body);
    const { store_code } = body;
    const  data = await fetchStoreRelatedSubCategories(store_code)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialRelatedCategories = data.map((item:any) => item.category);
    console.log("Fetched Categories: ", initialRelatedCategories);
    return NextResponse.json({ relatedCategories: initialRelatedCategories }, { status: 200});
  } catch (error) {
    console.error("Error fetching Categories:", error);
    return NextResponse.json({ error: "Failed to fetch store categories" }, { status: 500 });
  }
}
