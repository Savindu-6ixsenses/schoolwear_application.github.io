import { createAdminClient } from "./supabase/ssr_client/admin";
import { createClient } from "./supabase/ssr_client/server";

export async function createClientbyRole() {
	// First, create a standard client to check the current user's session
	const supabaseUserClient = await createClient();
	const {
		data: { user },
	} = await supabaseUserClient.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated to update store status.");
	}

	const user_id = user.id;

	// Query your custom user_roles table to check the user's role.
	const { data: roleData } = await supabaseUserClient
		.from("user_roles")
		.select("role")
		.eq("user_id", user_id)
		.single();

	// Check if the role from your custom table is 'admin'.
	const isAdmin = roleData?.role === "admin";

	// Use the admin client if the user is an admin, otherwise use the standard user client.
	const supabase = isAdmin ? createAdminClient() : supabaseUserClient;

	return { supabase, isAdmin, user_id };
}
