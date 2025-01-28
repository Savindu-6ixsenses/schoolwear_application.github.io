import { CreateStoreResponse, StoreCreationProps } from "@/types/store";
import { ProductCreationProps, ProductResponse } from "@/types/products";
import { NextRequest, NextResponse } from "next/server";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH;
const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;
const token = process.env.BIGCOMMERCE_ACCESS_TOKEN ?? "";

const fetchFromBigCommerce = async (
	url: string,
	method: string,
	body?: unknown
) => {
	try {
		const response = await fetch(url, {
			method,
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Auth-Token": token,
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`BigCommerce API Error: ${response.status} - ${response.statusText}, Response: ${errorText}`
			);
		}

		const responseData = await response.json();
		console.log(
			`Product Created: Name = ${responseData.name}, ID = ${responseData.id}`
		);
		return responseData;
	} catch (error) {
		console.error("Fetch Error:", error);
		throw error;
	}
};

const createBigCommerceProducts = async (products: ProductCreationProps[]) => {
	const productUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products`;
	const maxRetries = 3;

	for (const product of products) {
		let attempt = 0;
		let success = false;

		while (attempt < maxRetries && !success) {
			try {
				console.log(`Creating product: ${product.name}`);
				await fetchFromBigCommerce(productUrl, "POST", product);
				console.log(`Product created successfully: ${product.name}`);
				success = true;
			} catch (error) {
				attempt++;
				console.error(
					`Failed to create product: ${product.name}, Attempt: ${attempt}`
				);
				if (attempt < maxRetries) {
					console.log("Retrying in 2.5 seconds...");
					await new Promise((resolve) => setTimeout(resolve, 2500)); // Wait for 2.5 seconds before retrying
				} else {
					console.error(
						`Failed to create product after ${maxRetries} attempts: ${product.name}`
					);
				}
			}
		}
	}
};

// For creating the store using the BigCommerce API
const createBigCommerceStore = async (
	StoreCreationProps: StoreCreationProps
) => {
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

		if (!response.ok) {
			throw new Error(
				`Failed to create store on BigCommerce. Status: ${response.status}, Message: ${response.statusText}`
			);
		}

		const responseData: CreateStoreResponse = await response.json();

		// Destructure the response
		const { data, meta } = responseData;
		const { category_id, name, url } = data[0]; // Extract first category details
		const { total, success, failed } = meta; // Extract metadata

		console.log(
			`Store: ${name} (Category ID: ${category_id}) created successfully at ${url.path}.`
		);

		return category_id;
	} catch (e) {
		console.error("Error creating the store:", e);
		throw e;
	}
};

export async function POST(request: NextRequest) {
	try {
		const store_body = await request.json();
		const {
			store_name: storeName,
			account_manager: accountManager,
			store_address: storeAddress,
			main_client_name: mainClientContact,
			main_client_contact_number: mainClientContactNumber,
			store_code: StoreCode,
			start_date: startDate,
			end_date: endDate,
		}: StoreCreationProps = store_body;

		if (!token && !store_hash) {
			throw new Error("Token or store hash is missing");
		}

		// Create a new store in BigCommerce
		// const category_id = await createBigCommerceStore({
		// 	store_name: storeName,
		// 	account_manager: accountManager,
		// 	store_address: storeAddress,
		// 	main_client_name: mainClientContact,
		// 	main_client_contact_number: mainClientContactNumber,
		// 	store_code: StoreCode,
		// 	start_date: startDate,
		// 	end_date: endDate,
		// 	status: "Pending",
		// });

		const productData: ProductCreationProps[] = [
			{
				name: "Smith Journal 13",
				type: "physical",
				sku: "SM-13",
				description: "<p>A great journal for your notes</p>",
				weight: 1.5,
				price: 12.99,
				// categories: [category_id],
				categories: [2987],
				brand_name: "Under Armour",
				inventory_level: 100,
				is_visible: true,
				custom_url: {
					url: "/smith-journal-13",
					is_customized: true,
				},
				variants: [
					{
						sku: "SM-13-V1",
						price: 12.99,
						inventory_level: 50,
						weight: 1.5,
						option_values: [
							{
								id: 0,
								label: "Beige",
								option_id: 151,
								option_display_name: "Color",
							},
						],
					},
				],
			},
		];

		const response = await createBigCommerceProducts(productData);

		// Return a successful response with the created store data
		return NextResponse.json(
			{
				message: "Store and Products created successfully on BigCommerce.",
			},
			{ status: 201 }
		);
	} catch (e: any) {
		console.error("Error in POST handler:", e);

		// Return an error response
		return NextResponse.json(
			{
				message: "Internal server error",
				error: e.message,
			},
			{ status: 500 }
		);
	}
}
