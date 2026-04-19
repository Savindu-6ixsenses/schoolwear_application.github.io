"use server";

// import { redirect } from "next/navigation";
// import { createClient } from "../../utils/supabase/ssr_client/server";
// import { StoreProduct } from "@/types/products";
// import { fetchFilteredProductsFromSupabase } from "@/services/products/";
import {
	checkContactDetailsExist,
	updateStoreStatus,
} from "@/services/stores/storeServices-Server";
import { revalidatePath } from "next/cache";

//TODO: Fix this action
// export async function get_products_list(
// 	in_store_code: string,
// 	in_design_id: string,
// 	in_page_size: number = 20,
// 	in_page: number = 1
// ): Promise<[StoreProduct[], number]> {
// 	const supabase = await createClient();

// 	const { data: user, error: auth_error } = await supabase.auth.getUser();
// 	if (auth_error || !user?.user) {
// 		console.error("AN error is happening", auth_error);
// 		redirect("/login");
// 	}

// 	const data: [StoreProduct[], number] =
// 		await fetchFilteredProductsFromSupabase(
// 			supabase,
// 			in_store_code,
// 			in_design_id,
// 			undefined,
// 			undefined,
// 			in_page_size,
// 			in_page
// 		);

// 	const normalizedProducts: StoreProduct[] = data[0];
// 	const totalFilteredProducts: number = data[1];

// 	if (normalizedProducts == undefined || normalizedProducts.length === 0) {
// 		console.log("No products found for the given store code and design ID.");
// 		throw new Error(
// 			"No products found for the given store code and design ID."
// 		);
// 	}

// 	console.log(
// 		"Products in the list are",
// 		// normalizedProducts,
// 		totalFilteredProducts
// 	);

// 	const totalPages = Math.ceil(
// 		totalFilteredProducts / (in_page_size ? in_page_size : 10)
// 	);

// 	return [normalizedProducts, totalPages];
// }

/**
 * Normalizes the next product-list workflow state before persisting it.
 * "approve" is treated as terminal, while any other non-modify input falls back to
 * "Pending" so the list can be reviewed again.
 */
export async function generate_pl(store_code: string, store_status: string) {
	let _status = store_status.toLowerCase();
	if (_status === "modify") {
		_status = "Modify";
	} else if (_status === "approve") {
		// Approved lists are locked from regeneration to avoid overwriting a finalized PL.
		throw new Error(
			"Product List has already been approved. Cannot generate again.",
		);
	} else {
		// Unknown or empty statuses re-enter the review flow instead of preserving stale values.
		_status = "Pending";
	}

	// Store generation depends on contact details because downstream docs use them.
	if (await checkContactDetailsExist(store_code)) {
		const store_data = await updateStoreStatus(store_code, _status);
		return store_data;
	} else {
		throw new Error("Contact details are incomplete.");
	}
}

/**
 * Clears the cached store list so mutations made from the report screen are visible
 * when the user navigates back to the list view.
 */
export async function revalidateStoreList() {
	revalidatePath("/list");
}
