"use server";

import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/ssr_client/server";
import { StoreProduct } from "@/types/products";
import { fetchFilteredProductsFromSupabase } from "@/services/products/";
import { updateStoreStatus } from "@/services/stores";

//TODO: Fix this action
export async function get_products_list(
	in_store_code: string,
	in_design_id: string,
	in_page_size: number = 20,
	in_page: number = 1
): Promise<[StoreProduct[],number]> {
	const supabase = createClient();

	const { data: user, error: auth_error } = await supabase.auth.getUser();
	if (auth_error || !user?.user) {
		console.error("AN error is happening", auth_error);
		redirect("/login");
	}


	const data: [StoreProduct[], number] =
		await fetchFilteredProductsFromSupabase(
			supabase,
			in_store_code,
			in_design_id,
			undefined,
			undefined,
			in_page_size,
			in_page
		);

	const normalizedProducts: StoreProduct[] = data[0];
	const totalFilteredProducts: number = data[1];

	console.log(
		"Products in the list are",
		// normalizedProducts,
		totalFilteredProducts
	);

	const totalPages = Math.ceil(
		totalFilteredProducts / (in_page_size ? in_page_size : 10)
	);


	return [normalizedProducts,totalPages];
}

export async function generate_pl(store_code: string) {
	const store_data = await updateStoreStatus(store_code, "Pending");
	return store_data;
}
