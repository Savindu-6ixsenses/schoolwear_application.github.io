import { createClient } from "../../utils/supabase/ssr_client/client";

export async function fetchStore(storeCode: string) {
	const supabase = createClient();
	const { data, error } = await supabase
		.from("stores")
		.select("*")
		.eq("store_code", storeCode)
		.single();

	if (error) {
		throw new Error(`Failed to fetch store: ${error.message}`);
	}
	return data;
}	
