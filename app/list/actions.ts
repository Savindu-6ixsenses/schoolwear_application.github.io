"use server";

import { createClient } from "@/utils/supabase/ssr_client/server";
import { StoreSummary } from "./page";

/**
 * Fetches data from the v_store_design_summary view and groups it by store.
 * @returns A promise that resolves to an array of StoreSummary objects.
 */
export async function getStoreSummaries(): Promise<StoreSummary[]> {
	const supabase = await createClient();

    const session = await supabase.auth.getSession();
    if (!session.data.session) {
        throw new Error("User is not authenticated");
    }

	const { data, error } = await supabase
		.from("v_store_design_summary")
		.select("*");

	if (error) {
		console.error("Error fetching store summaries:", error);
		return [];
	}

	if (!data) {
		return [];
	}

	// Group the flat data structure by store_code
	const groupedByStore : Record<string, Omit<StoreSummary, "total_designs">> = data.reduce(
		(acc, item) => {
			const storeCode = item.store_code;
			if (!acc[storeCode]) {
				acc[storeCode] = {
					store_code: item.store_code,
					store_name: item.store_name,
					status: item.status,
					required_date: item.required_date,
					total_products: 0,
					designs: [],
				};
			}

			// Add design details and aggregate product counts
			if (item.design_id) {
				acc[storeCode].designs.push({
					design_id: item.design_id,
					product_count: item.product_count,
					categories: item.categories,
				});
				acc[storeCode].total_products += item.product_count;
			}

			return acc;
		},
		{} as Record<string, Omit<StoreSummary, "total_designs">>
	);

	// Convert the grouped object back to an array and calculate total_designs
	return Object.values(groupedByStore).map((store) => ({
		...store,
		total_designs: store.designs.length,
	}));
}
