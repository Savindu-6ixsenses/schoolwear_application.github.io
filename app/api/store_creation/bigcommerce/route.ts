import { CreateStoreResponse, StoreCreationProps } from "@/types/store";
import { ProductCreationProps, StoreProduct } from "@/types/products";
import { NextRequest, NextResponse } from "next/server";
import { updateStoreStatus } from "@/services/stores";
import { getStoreProducts } from "@/services/products";
import { GLOBAL_SUBCATEGORIES } from "@/constants/products";
import { randomUUID } from "crypto";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH;
const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;
const token = process.env.BIGCOMMERCE_ACCESS_TOKEN ?? "";

interface storeCreationBodyProps {
	store: StoreCreationProps;
	designId: string;
}

const createdSageCodes: string[] = [];

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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
		console.log("Store creation response:", data);

		// Check if the response contains the expected data
		if (!data || data.length === 0 || !data[0]?.category_id) {
			throw new Error(
				"Unexpected response from BigCommerce when creating the store."
			);
		}

		const { category_id, name, url } = data[0];

		console.log(
			`Store: ${name} (Category ID: ${category_id}) created successfully${
				url?.path ? ` at ${url.path}` : ""
			}.`
		);

		return category_id;
	} catch (e) {
		console.error("Error creating the store:", e);
		throw e;
	}
};

// Accepts array of names instead of just one
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createBigCommereceRelatedCategories = async (
	parentCategoryId: number,
	subCategories: string[]
): Promise<Record<string, number>> => {
	const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/categories`;

	const createdCategoryIds: Record<string, number> = {};

	for (const subCat of subCategories) {
		const categoryBody = {
			name: subCat,
			parent_id: parentCategoryId,
		};

		try {
			const response = await fetch(categoryUrl, {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"X-Auth-Token": token,
				},
				body: JSON.stringify(categoryBody),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to create category '${subCat}'. Status: ${response.status}, Message: ${response.statusText}`
				);
			}

			const responseData = await response.json();
			const createdId = responseData.data?.id;
			console.log(`✅ Created subcategory '${subCat}' with ID ${createdId}`);
			createdCategoryIds[subCat] = createdId; // Store the created category ID
		} catch (error) {
			console.error(`❌ Error creating subcategory '${subCat}':`, error);
			throw error;
		}
	}

	return createdCategoryIds;
};

// Function to create a unique sage code
const createUniqueSageCode = (
	productName: string,
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
		designCode = String(designCodeNumber + offsetNumber).padStart(3, "0"); // Ensure two digits
	} else {
		// Fallback: Just append offset if not a valid number
		designCode = `${designCode}${offsetNumber}`;
	}

	// ✅ Create new sage code using template literals
	let newSageCode = `${originalStoreCode}-${designCode}-${colorCode}`;

	// Check if the newSageCode is unique
	while (createdSageCodes.includes(newSageCode)) {
		offsetNumber = offsetNumber + 1;
		designCode = String(designCodeNumber + offsetNumber).padStart(3, "0"); // Ensure two digits
		newSageCode = `${originalStoreCode}-${designCode}-${colorCode}`;
		console.log(
			`Duplicate sage code found. New sage code generated: ${newSageCode}`
		);
	}

	createdSageCodes.push(newSageCode); // Add to the list of created sage codes

	console.log("Product Name:", productName);

	console.log(`Sage Code: ${rawsageCode} => New Sage Code: ${newSageCode}`);

	return newSageCode;
};

const createUniqueProductNames = (
	productName: string,
	storeCode: string,
	offsetNumber: number,
	category_: string,
	brandName: string,
	namingMethod: string,
	namingFields: Record<string, string>
): string => {
	const brand = namingFields["brandName"] || brandName || "Default Brand";
	const category = category_;
	const subcategory = namingFields["subCategory"];
	const specialName = namingFields["specialName"];
	const printingMethod = namingFields["printingMethod"];
	const grad = namingFields["gradLabel"] || "Grad";

	// Helper to validate required fields
	const requireFields = (fields: string[]) => {
		for (const field of fields) {
			if (!namingFields[field] || namingFields[field].trim() === "") {
				throw new Error(
					`Missing required field "${field}" for naming method ${namingMethod}`
				);
			}
		}
	};

	let name = "";
	let designName = "";

	if (offsetNumber > 0) {
		designName = `Design (${offsetNumber})`;
	}

	// logging the product name and naming method
	console.log(`Product Name: ${productName}, Naming Method: ${namingMethod}`);

	// Throw an error if productName is empty
	if (!productName || productName.trim() === "") {
		throw new Error("Product name cannot be empty");
	}

	// Create the product name based on the naming method
	if (namingMethod == "1") {
		name = `${storeCode} ${brand} ${category} ${productName} ${designName}`;
	} else if (namingMethod == "2") {
		name = `${storeCode} ${category} ${productName} ${designName}`;
	} else if (namingMethod == "3") {
		requireFields(["subCategory"]);
		name = `${storeCode} ${brand} ${category} ${productName} (${subcategory}) ${designName}`;
	} else if (namingMethod == "4") {
		requireFields(["subCategory"]);
		name = `${storeCode} ${brand} ${category} ${productName} (${subcategory}) - ${designName}`;
	} else if (namingMethod == "5") {
		requireFields(["specialName"]);
		name = `${storeCode} ${category} ${specialName} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "6") {
		requireFields(["specialName", "printingMethod"]);
		name = `${storeCode} ${category} ${specialName} ${printingMethod} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "7") {
		requireFields(["specialName"]);
		name = `${storeCode} ${category} ${specialName} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else if (namingMethod == "8") {
		requireFields(["gradLabel"]);
		name = `${storeCode} ${category} ${grad} ${(
			productName.split("-").pop() || ""
		).trim()} - ${designName}`;
	} else {
		throw new Error(`Invalid naming method: ${namingMethod}`);
	}

	console.log(
		`Creating product with name: "${name}" using naming method: ${namingMethod}`
	);

	return name.replace(/\s+/g, " ").trim();
};

const getProductConfigs = (
	products: StoreProduct[],
	category_id: number,
	storeCode: string,
	offsetNumber: number = 1,
	relatedCategoryIds: Record<string, number>
) => {
	// Map the store products to BigCommerce product configurations

	console.log("Creating product configurations...");
	// logging the arguments for createUniqueProductNames fucntion
	products.forEach((product) => {
		console.log(
			`Product Name: ${product.productName}, Category: ${
				product.category
			}, Brand: ${product.brandName}, Naming Method: ${
				product.naming_method
			}, Naming Fields: ${JSON.stringify(
				product.naming_fields
			)}, Store Code: ${storeCode}, Offset Number: ${offsetNumber}`
		);
	});

	const productList: ProductCreationProps[] = products.map((product) => {
		const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']

		// get the new sage code
		const newSageCode = createUniqueSageCode(
			product.productName,
			product.parentSageCode,
			storeCode,
			offsetNumber
		);

		const categories: number[] = [
			category_id,
			relatedCategoryIds[product.category],
		];

		let productFinalName = createUniqueProductNames(
			product.productName,
			storeCode,
			offsetNumber,
			product.category,
			product.brandName,
			product.naming_method || "1",
			product.naming_fields || {}
		);

		console.log(
			`Final Product Name: ${productFinalName}, Sage Code: ${newSageCode}`
		);

		if (!productFinalName) {
			console.warn("Product name is missing. Using default name instead.");
			productFinalName = `${randomUUID()}`; // Fallback to a default name if missing
		}

		return {
			name: productFinalName, // Default if name is missing
			type: "physical", // Default type
			sku:
				newSageCode ||
				`SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Generate SKU if missing
			description: `${product.productDescription}`, // Generate a description
			weight: product.productWeight || 1, // Default weight, adjust if necessary
			price: 10.0, // Default price, adjust if necessary
			categories: categories, // Default category ID, adjust if necessary
			brand_name: product.brandName || "Default Brand", // Use the brand name or default
			inventory_level: 100, // Default inventory
			is_visible: product.isAdded, // Map directly to is_visible
			custom_url: {
				url: `/${product.productName || "default-product"}`, // Generate a URL
				is_customized: true,
			},
			variants: sizeVariants?.length
				? sizeVariants.map((variant) => ({
						sku: `${newSageCode}-${product.sageCode}-${variant.toUpperCase()}`,
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
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

		// const category_id = 3088; // Hardcoded for testing purposes

		const storeProductsList: Record<string, StoreProduct[]> =
			await getStoreProducts(store.store_code);
		
		if (!storeProductsList || Object.keys(storeProductsList).length === 0) {
			throw new Error("No products found for the store.");
		}

		// Create related categories in BigCommerce
		const relatedCategoryIds = await createBigCommereceRelatedCategories(
			category_id,
			GLOBAL_SUBCATEGORIES
		);

		// const relatedCategoryIds = {
		// 	Adult: 3089,
		// 	Men: 3090,
		// 	Women: 3091,
		// 	Youth: 3092,
		// 	Accessories: 3093,
		// };

		const productBatches: {
			productData: ProductCreationProps[];
		}[] = [];

		let offsetNumber = 0; // Initialize the offset counter

		for (const [designCode, storeProducts] of Object.entries(
			storeProductsList
		)) {
			console.log(`Design Code: ${designCode}`);

			// No Need to add Design Code to the product name if only one product is found.
			console.log(
				`Number of products found for design code ${designCode}: ${storeProducts.length}`
			);

			storeProducts.forEach((product) => {
				console.log(`Product Name: ${product.productName}`);
			});

			offsetNumber = offsetNumber + 1; // Increment the offset for each design code

			console.log(`Offset Number: ${offsetNumber}`);

			const productData: ProductCreationProps[] = getProductConfigs(
				storeProducts,
				category_id,
				store.store_code,
				offsetNumber,
				relatedCategoryIds
			);

			productBatches.push({ productData });
		}

		await Promise.all(
			productBatches.map(async ({ productData }) => {
				try {
					await createBigCommerceProducts(productData);
				} catch (err) {
					console.error(`Error creating products for design code: ${err}`);
					throw err; // Rethrow the error to be caught in the outer catch block
				}
			})
		);

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
