import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service_role key.
 * This client bypasses all Row-Level Security policies.
 *
 * @throws {Error} If the required environment variables are not set.
 *
 * @returns A Supabase client instance with admin privileges.
 *
 * @example
 * const supabaseAdmin = createAdminClient();
 * const { data, error } = await supabaseAdmin.from('users').select('*');
 */
export function createAdminClient() {
	if (
		!process.env.NEXT_PUBLIC_SUPABASE_URL ||
		!process.env.NEXT_SERVICE_ROLE_KEY
	) {
		throw new Error("Missing Supabase environment variables for admin client.");
	}

	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL,
		process.env.NEXT_SERVICE_ROLE_KEY,
		{ auth: { autoRefreshToken: false, persistSession: false } }
	);
}
