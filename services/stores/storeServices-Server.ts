import { createClientbyRole } from "@/utils/adminHelper";

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
