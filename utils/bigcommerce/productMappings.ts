import { randomUUID } from "crypto";
import {
	productConfig,
	ProductCreationProps,
	StoreProduct,
} from "@/types/products";
import { createUniqueProductNames, createUniqueSKU } from "./naming";
import { StoreCreationLogger } from "../logging/storeCreationLogger";
import { createClient } from "../supabase/ssr_client/server";

const getVariantSKU = (
	newSKU: string,
	variant: string,
	productSageCode: string,
): string => {
	return `${newSKU}.${productSageCode}-${variant.toUpperCase()}`;
};

export const getVariantPayload = async (
	storeCode: string,
	product: StoreProduct,
	designId: string,
	logger: StoreCreationLogger,
): Promise<productConfig[]> => {
	const supabase = await createClient();

	const sageCode = product.sageCode;

	const { data: productDesignData, error } = await supabase
		.from("stores_products_designs_2")
		.select("new_product_id, new_sku, size_variations, notes")
		.eq("Store_Code", storeCode)
		.eq("sage_code", sageCode)
		.eq("Design_ID", designId)
		.single();

	if (error || !productDesignData) {
		logger.addEntry(
			"ERROR",
			`Could not find product design data for modification: Sage Code ${sageCode}`,
			{ error: error?.message },
		);
		return [];
	}

	const { new_product_id, new_sku, size_variations, notes } = productDesignData;

	if (!new_product_id || !new_sku) {
		logger.addEntry(
			"WARNING",
			`Product ${sageCode} cannot be modified as it's missing 'new_product_id' or 'new_sku'. It might not have been created in BigCommerce yet.`,
		);
		return [];
	}

	const oldSizes: Set<string> = new Set(
		(notes || "").split(",").filter(Boolean),
	);
	const newSizes: string[] = (size_variations || "").split(",").filter(Boolean);
	const newSizesSet: Set<string> = new Set(newSizes);

	const addedSizes = newSizes.filter((size: string) => !oldSizes.has(size));
	const removedSizes = Array.from(oldSizes).filter(
		(size: string) => !newSizesSet.has(size),
	);

	// --- TESTING LOGS ---
	console.log(`[getVariantPayload] Processing Sage Code: ${sageCode}`);
	console.log(
		`  - Old Sizes (from notes): '${Array.from(oldSizes).join(", ")}'`,
	);
	console.log(`  - New Sizes (from size_variations): '${newSizes.join(", ")}'`);
	console.log(`  - Calculated sizes to ADD: [${addedSizes.join(", ")}]`);
	console.log(`  - Calculated sizes to REMOVE: [${removedSizes.join(", ")}]`);
	// --- END TESTING LOGS ---

	logger.addEntry(
		"INFO",
		`Found ${addedSizes.length} new sizes to add and ${removedSizes.length} sizes to remove for product ${sageCode}`,
		{ addedSizes, removedSizes },
	);

	const addPayloads = addedSizes.map((size: string) => ({
		category: "variant",
		productConfigs: {
			productId: new_product_id,
			sizeLabel: size,
			variant: {
				sku: `${getVariantSKU(new_sku, size, product.sageCode)}`,
				price: 10.0,
				inventory_level: 50,
				weight: 1.0,
			},
		},
		db_identifiers: {
			storeCode: storeCode,
			sageCode: product.sageCode,
			designId: designId,
		},
	}));

	const removePayloads = removedSizes.map((size: string) => ({
		category: "remove_variant",
		productConfigs: {
			productId: new_product_id,
			sizeLabel: size,
		},
		db_identifiers: {
			storeCode: storeCode,
			sageCode: product.sageCode,
			designId: designId,
		},
	}));

	return [...addPayloads, ...removePayloads];
};

const getTheOffsetNumber = async (
	sageCode: string,
	designId: string,
	storeCode: string,
): Promise<number> => {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("stores_products_designs_2")
		.select("new_sku")
		.eq("Store_Code", storeCode)
		.eq("sage_code", sageCode)
		.eq("Design_ID", designId)
		.single();
	if (error || !data) {
		console.error(
			`Error fetching offset number for Sage Code ${sageCode}:`,
			error?.message,
		);
		return 1; // Default offset number if not found
	}
	// Log the retrieved new_sku
	console.log("Retrieved new_sku:", data.new_sku);
	const skuParts = data.new_sku.split("-");
	const offsetNumber = skuParts[1];

	// return the modulus of the offset number to get the original offset
	const originalOffset = parseInt(offsetNumber, 10) % 100;
	return originalOffset;
};

const getRemovePayload = async (
	storeCode: string,
	product: StoreProduct,
	designId: string,
	logger: StoreCreationLogger,
): Promise<productConfig> => {
	logger.addEntry(
		"INFO",
		`Preparing removal payload for product: ${product.productName} (Sage Code: ${product.sageCode})`,
	);

	const supabase = await createClient();

	const { data, error } = await supabase
		.from("stores_products_designs_2")
		.select("new_product_id, new_sku")
		.eq("Store_Code", storeCode)
		.eq("sage_code", product.sageCode)
		.eq("Design_ID", designId)
		.single();

	return {
		category: "remove_product",
		productConfigs: {
			productId: data?.new_product_id,
		},
		db_identifiers: {
			storeCode: storeCode,
			sageCode: product.sageCode,
			designId: designId,
		},
	};
};

export const getProductConfigs = async (
	products: StoreProduct[],
	category_id: number,
	designId: string,
	storeCode: string,
	relatedCategoryIds: Record<string, number>,
	createdSageCodes: string[] = [],
	logger: StoreCreationLogger,
	startOffset: number = 1,
): Promise<{ configs: productConfig[]; nextOffset: number }> => {
	// Map the store products to BigCommerce product configurations

	console.log("[getProductConfigs] Creating product configurations...");

	const productList: productConfig[] = [];
	let offsetNumber = startOffset;

	// Group products by type
	const groupedProducts = new Map<string, StoreProduct[]>();

	for (const product of products) {
		const key = product.type || `unique-${product.sageCode}`;
		if (!groupedProducts.has(key)) {
			groupedProducts.set(key, []);
		}
		groupedProducts.get(key)!.push(product);
	}

	// Iterate sequentially to maintain offsetNumber
	for (const group of Array.from(groupedProducts.values())) {
		for (const product of group) {
			// Get the already assigned offset number
			if (
				product.product_status === "modify" ||
				product.product_status === "added" ||
				product.product_status === "removed"
			) {
				offsetNumber = await getTheOffsetNumber(
					product.sageCode,
					designId,
					storeCode,
				);
				console.log("[Get Offset] Using existing offset number:", offsetNumber);
				break;
			} else {
				continue;
			}
		}

		console.log("[getProductConfigs] Product Name:", group[0].productName);
		console.log("[getProductConfigs] Sage Code:", group[0].sageCode);
		console.log("[getProductConfigs] Product Status:", group[0].product_status);

		console.log("[Get Offset] Retrieved offset number:", offsetNumber);

		for (const product of group) {
			// Get the offset number based on the product

			// Skip products that have already been added to BigCommerce
			if (product.product_status === "added") {
				// Skip this iteration
				continue;
			} else if (product.product_status === "removed") {
				console.log(`Removing product: ${product.productName}`);
				const removePayload = await getRemovePayload(
					storeCode,
					product,
					designId,
					logger,
				);
				productList.push(removePayload);
				continue;
			} else if (product.product_status === "modify") {
				console.log(`Modifying existing product: ${product.productName}`);
				const variantPayload = await getVariantPayload(
					storeCode,
					product,
					designId,
					logger,
				);
				productList.push(...variantPayload);
				continue;
			}

			const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']

			logger.addEntry(
				"INFO",
				`Updating product configurations: ${product.productName}\n
				Size Variants: ${sizeVariants?.join(", ") || "None"}\n
				offsetNumber: ${offsetNumber}\n
				Color Code: ${product.color_code || "N/A"}`,
			);

			// get the new sage code
			const newSKU = createUniqueSKU(
				product.productName,
				product.color_code || "XX", // Default color code if missing
				product.category,
				storeCode,
				offsetNumber,
				createdSageCodes,
			);

			logger.logProductSageCodeProcessing(product.productName, {
				old: product.sageCode,
				new: newSKU,
			});

			const categories: number[] = [
				category_id,
				relatedCategoryIds[product.category],
			];

			logger.logProductNameProcessing(
				product.productName,
				product.naming_method || "2",
				product.naming_fields || {},
			);

			console.log(
				`Final Product Name: ${product.productName}, Sage Code: ${newSKU}`,
			);

			if (!product.productName) {
				console.warn("Product name is missing. Using default name instead.");
				product.productName = `${randomUUID()}`; // Fallback to a default name if missing
			}

			const productConfig: ProductCreationProps = {
				name: product.productName, // Default if name is missing
				type: "physical", // Default type
				sku:
					newSKU ||
					`SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`, // Generate SKU if missing
				description: `${product.productDescription}`, // Generate a description
				weight: product.productWeight || 1, // Default weight, adjust if necessary
				price: 10.0, // Default price, adjust if necessary
				categories: categories, // Default category ID, adjust if necessary
				brand_name: product.brandName || "Default Brand", // Use the brand name or default
				inventory_level: 100, // Default inventory
				// is_visible: product.isAdded, // Map directly to is_visible
				is_visible: false, //TODO0: Default to false, adjust if necessary
				page_title: `${product.productName} | SchoolWear.ca`, // Generate a page title
				custom_url: {
					url: `/${newSKU || "default-product"}`, // Generate a URL
					is_customized: true,
				},
				variants: sizeVariants?.length
					? sizeVariants.map((variant) => ({
							sku: `${getVariantSKU(newSKU, variant, product.sageCode)}`,
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

			productList.push({
				productConfigs: productConfig,
				category: product.category,
				db_identifiers: {
					storeCode: storeCode,
					sageCode: product.sageCode,
					designId: designId,
				},
			});
		}
		// Get the max value out of prev offset and current offset
		if (offsetNumber >= startOffset) {
			offsetNumber++
		} else {
			offsetNumber = startOffset
		}
	}

	return { configs: productList, nextOffset: offsetNumber };
};
