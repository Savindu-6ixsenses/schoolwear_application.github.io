import { CreateStoreResponse, StoreCreationProps } from "@/types/store";
import { ProductCreationProps, StoreProduct } from "@/types/products";
import { NextRequest, NextResponse } from "next/server";
import { updateStoreStatus } from "@/services/stores";
import { getStoreProducts } from "@/services/products";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH;
const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;
const token = process.env.BIGCOMMERCE_ACCESS_TOKEN ?? "";

interface storeCreationBodyProps {
	store: StoreCreationProps;
	designId: string;
}

const addToBigCommerce = async (
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
				await addToBigCommerce(productUrl, "POST", product);
				console.log(`Product created successfully: ${product.name}`);
				success = true;
			} catch (error) {
				attempt++;
				console.error(
					`Failed to create product: ${product.name}, Attempt: ${attempt}, error: ${error}`
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
	// Validate the store creation properties
	if (
		!StoreCreationProps.store_code ||
		typeof StoreCreationProps.store_code !== "string"
	) {
		throw new Error(
			"Invalid store_code: Expected a string but got undefined or null"
		);
	}

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

// Function to create a unique sage code
const createUniqueSageCode = (
	rawsageCode: string,
	originalStoreCode: string,
	offsetNumber: number
): string => {
	if (!rawsageCode) {
		throw new Error("rawsageCode is required");
	}

	const sageCode = rawsageCode.includes(".")
		? rawsageCode.split(".")[0]
		: rawsageCode;

	// Split and validate the structure of sageCode
	const parts = sageCode.split("-");

	if (parts.length < 3) {
		throw new Error("Invalid sageCode format");
	}

	let designCode = parts[1];
	const colorCode = parts[2];

	// ✅ Attempt to add offsetNumber to designCode (if numeric)
	const designCodeNumber = parseInt(designCode, 10);

	if (!isNaN(designCodeNumber)) {
		designCode = String(designCodeNumber + offsetNumber);
	} else {
		// Fallback: Just append offset if not a valid number
		designCode = `${designCode}${offsetNumber}`;
	}

	// ✅ Create new sage code using template literals
	const newSageCode = `${originalStoreCode}-${designCode}-${colorCode}`;

	return newSageCode;
};

export default createUniqueSageCode;

const getProductConfigs = (
	products: StoreProduct[],
	category_id: number,
	storeCode: string
) => {
	// Map the store products to BigCommerce product configurations
	const productList: ProductCreationProps[] = products.map((product) => {
		const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']

		// get the new sage code
		const newSageCode = createUniqueSageCode(
			product.parentSageCode,
			storeCode,
			1
		);

		return {
			name: product.productName || "Default Product Name", // Default if name is missing
			type: "physical", // Default type
			sku:
				newSageCode ||
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
		const store_creation_body: storeCreationBodyProps = await request.json();

		// Destructure the store and products from the body
		const { store, designId } = store_creation_body;

		if (!store || typeof store.store_code !== "string") {
			throw new Error(
				"Invalid store_code: Expected a string but got undefined or null"
			);
		}

		console.log("Store Creation Body:", store);

		if (!token && !store_hash) {
			throw new Error("Token or store hash is missing");
		}

		// Create a new store in BigCommerce
		const category_id = await createBigCommerceStore({
			store_name: store.store_name,
			account_manager: store.account_manager,
			store_address: store.store_address,
			main_client_name: store.main_client_name,
			main_client_contact_number: store.main_client_contact_number,
			store_code: store.store_code,
			start_date: store.start_date,
			end_date: store.end_date,
			status: store.status,
		});

		const storeProducts: StoreProduct[] = await getStoreProducts(
			store.store_code,
			designId
		);

		console.log("Store Products:", storeProducts);

		const productData: ProductCreationProps[] = getProductConfigs(
			storeProducts,
			category_id,
			store.store_code
		);

		await createBigCommerceProducts(productData);

		await updateStoreStatus(store.store_code, "Approved");

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
