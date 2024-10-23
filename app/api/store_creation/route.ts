import { NextRequest, NextResponse } from "next/server";
import { StoreCreationDev } from "../../../utils/configs/config";
import { StoreCreationProps } from "@/types/store";

const createStore = async (StoreCreationProps: StoreCreationProps) => {
	const store_hash = process.env.BIGCOMMERCE_STORE_HASH;
	const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;
	const token = process.env.BIGCOMMERCE_ACCESS_TOKEN;

	// Body of the Store creation object
	const store_creation_body = [{
		name: StoreCreationProps.storeName,
		url: {
			path: `/${StoreCreationProps.StoreCode.replace(/\s+/g, '-')}/`,
			is_customized: false
		},
		parent_id: 0,
		tree_id: 1,
		description: `${StoreCreationProps.startDate} to ${StoreCreationProps.endDate}`,
		views: 0,
		sort_order: 0,
		page_title: StoreCreationProps.storeName,
		meta_keywords: [],
		meta_description: "",
		layout_file: "category.html",
		image_url: "",
		is_visible: true,
		search_keywords: "",
		default_product_sort: "use_store_settings",
	}];

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

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			storeName,
			accountManager,
			storeAddress,
			mainClientContact,
			mainClientContactNumber,
			StoreCode,
			startDate,
			endDate,
		}: StoreCreationProps = body;

		// Create a store
		const response = await createStore({
			storeName,
			accountManager,
			storeAddress,
			mainClientContact,
			mainClientContactNumber,
			StoreCode,
			startDate,
			endDate,
		});
		// Check if the response is successful
		if (!response.ok) {
			const errorText = await response.text();
			return NextResponse.json(
			  {
				message: `Failed to create the store: ${response.statusText}`,
				status: response.status,
				error: errorText,
			  },
			  { status: response.status }
			);
		}

		// Parse the response body if needed
		const data = await response.json();

		// Return a success response
		return NextResponse.json(
			{
				message: "Store created successfully",
				data,
			},
			{ status: 201 }
		);
	} catch (e : any) {
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
