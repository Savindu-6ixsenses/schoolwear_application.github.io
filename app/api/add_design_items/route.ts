import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";

export async function POST(request: NextRequest) {
    try{
        const body = await request.json();
        const {Design_Id,
            Design_Guideline,
            Design_Description,
            Image_URL} = body;
        
        console.log("Request Body", Design_Id,
            Design_Guideline,
            Design_Description,
            Image_URL)
         
        const supabase = createClient();

        const { data, error } = await supabase.from("designs").insert([
            {
                Design_Id: `${Design_Id}`,
                Design_Guideline: `${Design_Guideline}`,
                Design_Description: `${Design_Description}`,
                Image_URL: `${Image_URL}`,
            },
        ])
        .select();
        
        console.log("Data",data);
        if (error) {
            console.error("Error adding design items:", error.message);
            return NextResponse.json({ error: "Failed to add design items" }, { status: 500 });
        }
        return NextResponse.json({success: true, data: data}, { status: 200});
    }
    catch (e) {
        console.error("Unexpected error:", e);
		throw e;
    }

    

    
    

}
