import { CreateStoreResponse, StoreCreationProps } from "@/types/store";
import { ProductCreationProps, StoreProduct } from "@/types/products";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/ssr_client/server";
import { updateStoreStatus } from "@/services/stores";

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
		const { data } = responseData;
		const { category_id, name, url } = data[0]; // Extract first category details

		console.log(
			`Store: ${name} (Category ID: ${category_id}) created successfully at ${url.path}.`
		);

		return category_id;
	} catch (e) {
		console.error("Error creating the store:", e);
		throw e;
	}
};

export const getStoreProducts = async (
	storeCode: string,
	designCode: string
): Promise<StoreProduct[]> => {
	const supabase = createClient();

	console.log(
		"Fetching products for store:",
		storeCode + " and design:",
		designCode
	);

	try {
		// Call the Supabase RPC function
		const { data: products } = await supabase.rpc(
			"get_products_to_create",
			{
				in_store_code: storeCode,
				in_design_code: designCode,
			}
		);

		// Normalize the data into the StoreProduct format

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const normalizedProducts: StoreProduct[] = products.map(
			(product: Record<string, any>) => ({
				productId: product["Product ID"],
				sageCode: product["SAGE Code"],
				productName: product["Product Name"],
				brandName: product["Brand Name"],
				productDescription: product["Product Description"],
				productWeight: product["Product Weight"],
				category: product["Category"],
				parentSageCode: product["Product Code/SKU"],
				sizeVariations: product["size_variations"],
			})
		);

		return normalizedProducts;
	} catch (error) {
		console.error("Error fetching and normalizing products:", error);
		throw error;
	}
};

const getProductConfigs = (products: StoreProduct[], category_id: number) => {
	const productList: ProductCreationProps[] = products.map((product) => {
		const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']
		return {
			name: product.productName || "Default Product Name", // Default if name is missing
			type: "physical", // Default type
			sku:
				product.parentSageCode ||
				`SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Generate SKU if missing
			description: `${product.productDescription}`, // Generate a description
			weight: product.productWeight || 1, // Default weight, adjust if necessary
			price: 10.0, // Default price, adjust if necessary
			categories: [category_id], // Default category ID, adjust if necessary
			brand_name: product.brandName || "Default Brand", // Use the brand name or default
			inventory_level: 100, // Default inventory
			is_visible: product.isAdded, // Map directly to is_visible
			custom_url: {
				url: `/${product.productName || "default-product"}`, // Generate a URL
				is_customized: true,
			},
			variants: sizeVariants?.length
				? sizeVariants.map((variant) => ({
						sku: `${product.parentSageCode}-${
							product.sageCode
						}-${variant.toUpperCase()}`,
						price: 10.0, // Default price
						inventory_level: 50, // Default inventory for variants
						weight: 1.0, // Default weight
						option_values: [
							{
								id: 0,
								label: variant,
								option_id: 151,
								option_display_name: "Size",
							},
						],
				  }))
				: [], // No variants if no sizes are selected
		};
	});

	return productList;
};

export async function POST(request: NextRequest) {
	try {
		// Contains both Store and products in the request
		const store_creation_body = await request.json();

		// Destructure the store and products from the body
		const { store, designId } = store_creation_body;

		if (!store) {
			throw new Error("Store or Products data is missing in the request body");
		}

		if (!token && !store_hash) {
			throw new Error("Token or store hash is missing");
		}

		// Create a new store in BigCommerce
		const category_id = await createBigCommerceStore({
			store_name: store.storeName,
			account_manager: store.accountManager,
			store_address: store.storeAddress,
			main_client_name: store.mainClientContact,
			main_client_contact_number: store.mainClientContactNumber,
			store_code: store.StoreCode,
			start_date: store.startDate,
			end_date: store.endDate,
			status: store.status,
		});

		const storeProducts: StoreProduct[] = await getStoreProducts(
			store.StoreCode,
			designId
		);

		console.log("Store Products:", storeProducts);

		const productData: ProductCreationProps[] = getProductConfigs(
			storeProducts,
			category_id
		);

		await createBigCommerceProducts(productData);

		await updateStoreStatus(store.StoreCode, "Approved");

		// Return a successful response with the created store data
		return NextResponse.json(
			{
				message: "Store and Products created successfully on BigCommerce.",
			},
			{ status: 201 }
		);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
