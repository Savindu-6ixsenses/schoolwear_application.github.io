import { handleCreateStore } from "@/handlers/bigcommerce/createStoreHandler";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { store, designId } = await req.json();
    await handleCreateStore(store, designId);

    return NextResponse.json({ message: "Store and products created successfully." }, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}
