import { createClientbyRole } from "@/utils/adminHelper";
import { createClient } from "@/utils/supabase/ssr_client/server";

export async function updateStoreStatus(storeCode: string, status: string) {
	// First, create a standard client to check the current user's session
	const { supabase, isAdmin, user_id } = await createClientbyRole();

	let query = supabase
		.from("stores")
		.update({ status: status, updated_at: new Date().toISOString() })
		.eq("store_code", storeCode);

	// If the user is NOT an admin, we must add the user_id check to satisfy RLS.
	if (!isAdmin) {
		query = query.eq("user_id", user_id);
	}

	const { data, error } = await query.select().single();

	if (error) {
		console.error(`Failed to update store status:`, error);
		throw new Error(`Failed to update store status: ${error.message}`);
	}

	console.log(`Store ${storeCode} status updated to ${status} successfully.`);
	return { data };
}

export async function fetchStoreRelatedSubCategories(storecode: string) {
	const supabase = await createClient();
	
	const session = supabase.auth.getSession();
	
	if (!session) {
		throw new Error("User not authenticated to fetch store categories.");
	}
	const { data, error } = await supabase.rpc("get_store_categories", {
		storecode,
	});
	if (error) {
		throw new Error(`Failed to fetch store categories: ${error.message}`);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	console.log(`Store Categories: ${JSON.stringify(data.map((item:any) => item.category))}`);
	return data;
}
