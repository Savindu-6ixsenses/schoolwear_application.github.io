import { createClientbyRole } from "@/utils/adminHelper";
import { createClient } from "@/utils/supabase/ssr_client/server";

export async function createNote({
    note,
    design_id,
    store_code, 
}:{note: string, design_id: string, store_code: string}): Promise<void> {
    
try {
        console.log("Creating note for design ID:", design_id, "with note:", note);
    
        const supabase = await createClient();
    
        const {data: {user}} =  await supabase.auth.getUser();
    
        if(!user) {
            throw new Error("User not authenticated to create a note.");
        }
    
        const {data, error} = await supabase.from("notes").insert([
            {
               user_id: user.id,
               notes: note,
               design_id: design_id,
               store_code: store_code 
            }
        ]).select();
    
        if(error) {
            throw new Error(`Failed to create note: ${error.message}`);
        }
        console.log("Note created successfully:", data);
        return;
} catch (error) {
    console.error("Unexpected error:", error);
    throw error;
}

}

export async function updateNote({
    design_id,
    note,
}: {design_id: string, note: string}): Promise<void> {
    try {
        console.log("Updating note ID:", design_id, "with new note:", note);

        const {supabase, isAdmin, user_id} = await createClientbyRole();

        let query = supabase.from("notes").update({
            notes: note,
        }).eq("design_id", design_id);

        if(!isAdmin) {
            query = query.eq("user_id", user_id);
        }

        const {data, error} = await query.select();

        if (error) {
            throw new Error(`Failed to update note: ${error.message}`);
        }

        console.log("Note updated successfully:", data);
        return;
    } catch (error) {
        console.error("Unexpected error:", error);
        throw error;       
    }
}