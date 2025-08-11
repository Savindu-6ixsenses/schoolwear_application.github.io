import { NextRequest, NextResponse } from "next/server";
import { createSignedDownloadUrl } from "@/services/logging/logsStorage";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "log" or "report"
  const storeCode = searchParams.get("storeCode");

  if (!type || !storeCode) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Build the file path as you do in your route.ts
  const date = new Date().toISOString().split("T")[0];
  const filePath =
    type === "log"
      ? `${storeCode}/store-creation-log-${storeCode}-${date}.txt`
      : `${storeCode}/store-report-${storeCode}-${date}.csv`;

  try {
    const signedUrl = await createSignedDownloadUrl(filePath);
    return NextResponse.json({ signedUrl }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}