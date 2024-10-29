import { NextRequest, NextResponse } from "next/server";
import { StoreCreationDev } from "../../../utils/configs/config";
import { StoreCreationProps } from "@/types/store";
import { createStore } from "@/services/stores";

const createBigCommerceStore = async (
	StoreCreationProps: StoreCreationProps
) => {
	const store_hash = process.env.BIGCOMMERCE_STORE_HASH;
	const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;
	const token = process.env.BIGCOMMERCE_ACCESS_TOKEN;

	// Body of the Store creation object
	const store_creation_body = [
		{
			name: StoreCreationProps.store_name,
			url: {
				path: `/${StoreCreationProps.store_code.replace(/\s+/g, "-")}/`,
				is_customized: false,
			},
			parent_id: 0,
			tree_id: 1,
			description: `${StoreCreationProps.start_date} to ${StoreCreationProps.end_date}`,
			views: 0,
			sort_order: 0,
			page_title: StoreCreationProps.store_name,
			meta_keywords: [],
			meta_description: "",
			layout_file: "category.html",
			image_url: "",
			is_visible: true,
			search_keywords: "",
			default_product_sort: "use_store_settings",
		},
	];

	try {
		const response = await fetch(categoryUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Auth-Token": `${token}`,
			},
			body: JSON.stringify(store_creation_body),
		});
		return response;
	} catch (e) {
		console.error("Error creating the store:", e);
		throw e;
	}
};

const createDbStore = async (StoreCreationProps: StoreCreationProps) => {
	const {
		store_name: storeName,
		account_manager: accountManager,
		store_address: storeAddress,
		main_client_name: mainClientContact,
		main_client_contact_number: main_client_contact_number,
		store_code: StoreCode,
		start_date,
		end_date,
		status,
	} = StoreCreationProps;

	try {
		// Insert the data into the 'stores' table
		const storeData = {
			store_name: storeName,
			account_manager: accountManager,
			store_address: storeAddress,
			main_client_name: mainClientContact,
			main_client_contact_number: main_client_contact_number,
			store_code: StoreCode,
			start_date: start_date,
			end_date: end_date,
		};

		const response = await createStore(storeData);
		console.log("Store Creation Response: ", response);
		return response;
	} catch (e) {
		console.error("Unexpected error:", e);
		throw e;
	}
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			store_name: storeName,
			account_manager: accountManager,
			store_address: storeAddress,
			main_client_name: mainClientContact,
			main_client_contact_number:mainClientContactNumber,
			store_code: StoreCode,
			start_date:startDate,
			end_date:endDate,
		}: StoreCreationProps = body;

		// Create a store
		const response: any = await createDbStore({
			store_name: storeName,
			account_manager: accountManager,
			store_address: storeAddress,
			main_client_name: mainClientContact,
			main_client_contact_number:mainClientContactNumber,
			store_code: StoreCode,
			start_date:startDate,
			end_date:endDate,
			status: "Pending",
		});
		// Check if the response is successful
		if (response && ![200, 201].includes(response.status)) {
			const errorText = response.statusText;
			return NextResponse.json(
				{
					message: `Failed to create the store: ${response.statusText}`,
					status: response.status,
					error: errorText,
				},
				{ status: response.status }
			);
		}

		// Return a success response
		return NextResponse.json(
			{
				message: "Store created successfully",
				response: response.data,
			},
			{ status: 201 }
		);
	} catch (e: any) {
		console.error("Error in POST handler:", e);
		return NextResponse.json(
			{
				message: "Internal server error",
				error: e.message,
			},
			{ status: 500 }
		);
	}
}
