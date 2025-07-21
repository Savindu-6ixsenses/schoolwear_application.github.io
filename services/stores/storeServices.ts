import { StoreCreationProps, FormData } from "@/types/store";
import { createClient } from "../../utils/supabase/ssr_client/client";
import {
	generateBaseStoreCode,
	fetchExistingStoreCodes,
	getUniqueStoreCode,
} from "./generateStoreCode";

export async function createStore(storeData: StoreCreationProps) {
	const supabase = createClient();
	const { data, status, statusText, error } = await supabase
		.from("stores")
		.insert([{ ...storeData, created_at: new Date(), updated_at: new Date() }])
		.select();
	console.log(
		`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`
	);
	if (error) {
		throw new Error(`Failed to create store: ${error.message}`);
	}

	return { data, status, statusText };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateStore(storeData: any) {
	const supabase = createClient();
	const { data, status, statusText, error } = await supabase
		.from("stores")
		.update({ ...storeData, updated_at: new Date() })
		.eq("store_code", storeData.store_code)
		.select();
	console.log(
		`Data and Error: ${JSON.stringify(data)} ${status} ${statusText}`
	);
	if (error) {
		throw new Error(`Failed to update store: ${error.message}`);
	}

	return { data, status, statusText };
}

export async function updateStoreStatus(storeCode: string, status: string) {
	const supabase = createClient();
	const {
		data,
		status: status2,
		statusText,
		error,
	} = await supabase
		.from("stores")
		.update({ status: status, updated_at: new Date() })
		.eq("store_code", storeCode)
		.select();
	console.log(
		`Data and Error: ${JSON.stringify(data)} ${status2} ${statusText}`
	);
	if (error) {
		throw new Error(`Failed to update store status: ${error.message}`);
	}

	return { data };
}

export async function updateStoreCodeAutomatically(
	schoolName: string,
	setFormData: React.Dispatch<React.SetStateAction<FormData>>
) {
	const baseCode = generateBaseStoreCode(schoolName);
	const existingCodes = await fetchExistingStoreCodes(baseCode);
	const uniqueCode = getUniqueStoreCode(baseCode, existingCodes);

	setFormData((prev) => ({
		...prev,
		storeCode: uniqueCode,
	}));
}

export async function fetchStoreRelatedSubCategories(storecode: string) {
	const supabase = createClient();
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
