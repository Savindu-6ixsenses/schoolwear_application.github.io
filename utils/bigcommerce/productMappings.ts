import { randomUUID } from "crypto";
import {
	productConfig,
	ProductCreationProps,
	StoreProduct,
} from "@/types/products";
import { createUniqueProductNames, createUniqueSKU } from "./naming";
import { StoreCreationLogger } from "../logging/storeCreationLogger";
import { CreateVariantPayload } from "@/types/products";
import { createClient } from "../supabase/ssr_client/server";

const getVariantSKU = (
	newSKU: string,
	variant: string,
	productSageCode: string
): string => {
	return `${newSKU}.${productSageCode}-${variant.toUpperCase()}`;
};

export const getVariantPayload = async (
	storeCode: string,
	product: StoreProduct,
	designId: string,
	logger: StoreCreationLogger
): Promise<productConfig[]> => {
	const supabase = await createClient();

	const productId = product.productId;

	const { data: productDesignData, error } = await supabase
		.from("stores_products_designs_2")
		.select("new_product_id, new_sage_code, size_variations, notes")
		.eq("Store_Code", storeCode)
		.eq("Product_ID", productId)
		.eq("Design_ID", designId)
		.single();

	if (error || !productDesignData) {
		logger.addEntry(
			"ERROR",
			`Could not find product design data for modification: Product ID ${productId}`,
			{ error: error?.message }
		);
		return [];
	}

	const { new_product_id, new_sage_code, size_variations, notes } =
		productDesignData;

	if (!new_product_id || !new_sage_code) {
		logger.addEntry(
			"WARNING",
			`Product ${productId} cannot be modified as it's missing 'new_product_id' or 'new_sage_code'. It might not have been created in BigCommerce yet.`
		);
		return [];
	}

	const oldSizes: Set<string> = new Set(
		(notes || "").split(",").filter(Boolean)
	);
	const newSizes: string[] = (size_variations || "").split(",").filter(Boolean);
	const newSizesSet: Set<string> = new Set(newSizes);

	const addedSizes = newSizes.filter((size: string) => !oldSizes.has(size));
	const removedSizes = Array.from(oldSizes).filter(
		(size: string) => !newSizesSet.has(size)
	);

	// --- TESTING LOGS ---
	console.log(`[getVariantPayload] Processing Product ID: ${productId}`);
	console.log(
		`  - Old Sizes (from notes): '${Array.from(oldSizes).join(", ")}'`
	);
	console.log(`  - New Sizes (from size_variations): '${newSizes.join(", ")}'`);
	console.log(`  - Calculated sizes to ADD: [${addedSizes.join(", ")}]`);
	console.log(`  - Calculated sizes to REMOVE: [${removedSizes.join(", ")}]`);
	// --- END TESTING LOGS ---

	logger.addEntry(
		"INFO",
		`Found ${addedSizes.length} new sizes to add and ${removedSizes.length} sizes to remove for product ${productId}`,
		{ addedSizes, removedSizes }
	);

	const addPayloads = addedSizes.map((size: string) => ({
		category: "variant",
		productConfigs: {
			productId: new_product_id,
			sizeLabel: size,
			variant: {
				sku: `${getVariantSKU(new_sage_code, size, product.sageCode)}`,
				price: 10.0,
				inventory_level: 50,
				weight: 1.0,
			},
		},
		db_identifiers: {
			storeCode: storeCode,
			productId: product.productId,
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
			productId: product.productId,
			designId: designId,
		},
	}));

	return [...addPayloads, ...removePayloads];
};

export const getProductConfigs = async (
	products: StoreProduct[],
	category_id: number,
	designId: string,
	storeCode: string,
	offsetNumber: number = 1,
	relatedCategoryIds: Record<string, number>,
	createdSageCodes: string[] = [],
	logger: StoreCreationLogger
) => {
	// Map the store products to BigCommerce product configurations

	console.log("Creating product configurations...");
	// logging the arguments for createUniqueProductNames fucntion
	products.forEach((product) => {
		// Log only the products that are not added according to product_status field
		if (product.product_status !== "added") {
			console.log(
				`Product Name: ${product.productName}, Category: ${
					product.category
				}, Brand: ${product.brandName}, Naming Method: ${
					product.naming_method
				}, Naming Fields: ${JSON.stringify(
					product.naming_fields
				)}, Store Code: ${storeCode}, Offset Number: ${offsetNumber}`
			);
		} else {
			console.log(
				`Skipping product already added: ${product.productName}, Offset Number: ${offsetNumber}`
			);
		}
	});

	const productList: productConfig[] = (
		await Promise.all(
			products.map(async (product) => {
				// Skip products that have already been added to BigCommerce
				if (product.product_status === "added") {
					// By returning an empty array, flatMap will skip this item.
					return [];
				} else if (product.product_status === "modify") {
					console.log(`Modifying existing product: ${product.productName}`);
					return await getVariantPayload(storeCode, product, designId, logger);
				}

				const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']

				logger.addEntry(
					"INFO",
					`Updating product configurations: ${product.productName}`
				);

				// get the new sage code
				const newSKU = createUniqueSKU(
					product.productName,
					product.parentSageCode,
					storeCode,
					offsetNumber,
					createdSageCodes
				);

				logger.logProductSageCodeProcessing(product.productName, {
					old: product.sageCode,
					new: newSKU,
				});

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

				logger.logProductNameProcessing(
					productFinalName,
					product.naming_method || "2",
					product.naming_fields || {}
				);

				console.log(
					`Final Product Name: ${productFinalName}, Sage Code: ${newSKU}`
				);

				if (!productFinalName) {
					console.warn("Product name is missing. Using default name instead.");
					productFinalName = `${randomUUID()}`; // Fallback to a default name if missing
				}

				const productConfig: ProductCreationProps = {
					name: productFinalName, // Default if name is missing
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
					is_visible: false, //TODO: Default to false, adjust if necessary
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

				return [
					{
						productConfigs: productConfig,
						category: product.category,
						db_identifiers: {
							storeCode: storeCode,
							productId: product.productId,
							designId: designId,
						},
					},
				];
			})
		)
	).flat();

	return productList;
};
