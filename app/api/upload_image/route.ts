import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    const formData = await request.formData(); // Extract FormData from the request
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate a unique file name
    const fileName = `${uuidv4()}-${file.name}`;

    // Upload the file to Supabase Storage
    const { error } = await supabase.storage
      .from("design-logo-images") // Your Supabase bucket name
      .upload(fileName, file.stream(), {
        contentType: file.type, // Set the content type
      });

    if (error) {
      console.error("Error uploading file to Supabase:", error.message);
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      );
    }

    // Get the public URL of the uploaded file
    const { data: publicUrl } = supabase.storage
      .from("design-logo-images")
      .getPublicUrl(fileName);

    return NextResponse.json(
      { success: true, publicUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
