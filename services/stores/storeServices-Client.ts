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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// export async function updateStore(storeData: any) {
// 	const supabase = await createClient();
// 	const { data, status, statusText, error } = await supabase
// 		.from("stores")
// 		.update({ ...storeData, updated_at: new Date() })
// 		.eq("store_code", storeData.store_code)
// 		.select();
// 	console.log(
// 		`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`
// 	);
// 	if (error) {
// 		throw new Error(`Failed to update store: ${error.message}`);
// 	}

// 	return { data, status, statusText };
// }

export async function updateStoreStatus(storeCode: string, status: string) {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error("User not authenticated to update store status.");
	}
	const {
		data,
		status: status2,
		statusText,
		error,
	} = await supabase
		.from("stores")
		.update({ status: status, updated_at: new Date() })
		.eq("store_code", storeCode)
		.eq("user_id", user.id)
		.select();
	console.log(
		`Data and Error: ${JSON.stringify(data)} ${status2} ${statusText}`
	);
	if (error) {
		throw new Error(`Failed to update store status: ${error.message}`);
	}

	return { data };
}

export async function fetchStoreRelatedSubCategories(storecode: string) {
	const supabase = await createClient();
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
