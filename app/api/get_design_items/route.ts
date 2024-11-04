import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase.from("designs").select("*");

  console.log("Data",data);
  
  if (error) {
    console.error("Error fetching design items:", error.message);
    return NextResponse.json({ error: "Failed to fetch design items" }, { status: 500 });
  }

  return NextResponse.json({ designItems: data }, { status: 200});
}
