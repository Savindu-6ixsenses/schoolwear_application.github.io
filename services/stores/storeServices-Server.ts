"use server";


import { createClientbyRole } from "@/utils/adminHelper";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { sendAPIRequestBigCommerce } from "../bigCommerce/apiClient";

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

export async function fetchStoreRelatedSubCategories(storeCode: string) {
	const supabase = await createClient();

	const session = supabase.auth.getSession();

	if (!session) {
		throw new Error("User not authenticated to fetch store categories.");
	}
	const { data, error } = await supabase.rpc("get_store_categories", {
		storecode: storeCode,
	});
	if (error) {
		throw new Error(`Failed to fetch store categories: ${error.message}`);
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	console.log(
		`Store Categories: ${JSON.stringify(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			data.map((item: any) => item.category)
		)}`
	);
	return data;
}

export async function changeStoreStatus(storeCode: string, status: string) {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("stores")
		.update({ status: status, updated_at: new Date().toISOString() })
		.eq("store_code", storeCode)
		.select()
		.single();

	if (error) {
		console.error(`Failed to change store status:`, error);
		throw new Error(`Failed to change store status: ${error.message}`);
	}

	console.log(`Store ${storeCode} status changed to ${status} successfully.`);
	return { data };
}

export async function discardUpdates(storeCode: string) {
	const supabase = await createClient();

	const { data, error } = await supabase.rpc("discard_store_updates", {
		p_store_code: storeCode,
	});

	if (error) {
		console.error(`Failed to discard updates for store ${storeCode}:`, error);
		// The error message from the RPC function will be user-friendly.
		throw new Error(error.message);
	}

	// changeStoreStatus(storeCode, "Approved");
	console.log("Store Status changed to Approved");
	console.log(data.json);
	console.log(`Updates for store ${storeCode} discarded successfully.`);
}

/**
 * Deletes a store from the database if it's in 'Draft' or 'Pending' state.
 * This is a destructive action and only removes data from this application, not BigCommerce.
 */
export async function deleteDraftOrPendingStore(storeCode: string) {
	const {supabase, isAdmin, user_id} = await createClientbyRole();
	const { error } = await supabase.rpc("delete_store_if_not_approved", {
		p_store_code: storeCode,
	});

	if (error) {
		console.error(`Failed to delete store ${storeCode}:`, error);
		throw new Error(error.message);
	}

	console.log(`Store ${storeCode} deleted successfully.`);
}

/**
 * Disables an approved store by making its categories and products invisible in BigCommerce.
 * This function is for admins only.
 */
export async function disableApprovedStore(storeCode: string) {
	const { supabase, isAdmin } = await createClientbyRole();

	if (!isAdmin) {
		throw new Error("You do not have permission to disable a store.");
	}

	console.log(`[Disable Store] Starting process for ${storeCode}`);

	// 1. Get all product IDs from our DB that have been created in BigCommerce
	const { data: products, error: productsError } = await supabase
		.from("stores_products_designs_2")
		.select("new_product_id")
		.eq("Store_Code", storeCode)
		.not("new_product_id", "is", null);

	if (productsError) {
		throw new Error(`Failed to fetch products for disabling: ${productsError.message}`);
	}

	const productIdsToUpdate = products.map(p => ({ id: p.new_product_id, is_visible: false }));

	// 2. Update categories in BigCommerce to be invisible
	// fetch the category_id by the store code then disable the category
	const { data: storeData, error: storeError } = await supabase
		.from("stores")
		.select("category_id")
		.eq("store_code", storeCode)
		.single();

	if (storeError) {
		throw new Error(`Failed to fetch store data for disabling: ${storeError.message}`);
	}

	const categoryId = storeData?.category_id;	
	if (categoryId) {
		try {
			const categoryUpdateUrl = `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/categories/${categoryId}`;
			await sendAPIRequestBigCommerce(categoryUpdateUrl, "PUT", { is_visible: false });
			console.log(`[Disable Store] Category ${categoryId} set to invisible in BigCommerce.`);	
		} catch (bcError) {
			console.error("[Disable Store] BigCommerce category update failed:", bcError);
			throw new Error("Failed to disable category in BigCommerce.");
		}
	} else {
		console.log("[Disable Store] No category ID found for the store.");
	}


	// 3. Bulk update products in BigCommerce to be invisible
	if (productIdsToUpdate.length > 0) {
		console.log(`[Disable Store] Disabling ${productIdsToUpdate.length} products in BigCommerce.`);
		try {
			const productUpdateUrl = `https://api.bigcommerce.com/stores/${process.env.BIGCOMMERCE_STORE_HASH}/v3/catalog/products`;
			await sendAPIRequestBigCommerce(productUpdateUrl, "PUT", productIdsToUpdate);
		} catch (bcError) {
			console.error("[Disable Store] BigCommerce product update failed:", bcError);
			throw new Error("Failed to disable products in BigCommerce.");
		}
	} else {
		console.log("[Disable Store] No products found to disable in BigCommerce.");
	}

	// 4. Update the store status to 'Disabled' in our database
	try {
		await updateStoreStatus(storeCode, "Disabled");
		console.log("[Disable Store] Store status updated to Disabled in Supabase.");
	} catch (dbError) {
		console.error("[Disable Store] Database update failed:", dbError);
		throw new Error("Failed to update store status in the database.");
	}
	console.log(`[Disable Store] Successfully disabled store ${storeCode}.`);
}

// Returns the Store Status
export async function getStoreStatus(storeCode: string) {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("stores")
		.select("status")
		.eq("store_code", storeCode)
		.single();
	if (error) {
		console.error(`Failed to get store status:`, error);
		throw new Error(`Failed to get store status: ${error.message}`);
	}
	return data?.status;
}
