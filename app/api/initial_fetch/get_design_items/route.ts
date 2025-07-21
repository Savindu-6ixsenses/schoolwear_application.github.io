import { NextResponse } from "next/server";
import { getAllDesignItems } from "@/services/designs";

export async function GET() {
  try {
    const  data = await getAllDesignItems()
    return NextResponse.json({ designItems: data }, { status: 200});
  } catch (error) {
    console.error("Error fetching design items:", error);
    return 
  }
}
