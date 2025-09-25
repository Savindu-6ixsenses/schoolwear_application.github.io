import { randomUUID } from "crypto";
import { productConfig, ProductCreationProps, StoreProduct } from "@/types/products";
import { createUniqueProductNames, createUniqueSageCode } from "./naming";
import { StoreCreationLogger } from "../logging/storeCreationLogger";

export const getProductConfigs = (
    products: StoreProduct[],
    category_id: number,
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

    
    const productList: productConfig[] = products.map((product) => {
        const sizeVariants = product.sizeVariations?.split(","); //Outputs a list ex:['SM','LG','XL']
        
        logger.addEntry("INFO", `Updating product configurations: ${product.productName}`)

        // get the new sage code
        const newSageCode = createUniqueSageCode(
            product.productName,
            product.parentSageCode,
            storeCode,
            offsetNumber,
            createdSageCodes
        );

        logger.logProductSageCodeProcessing(
            product.productName,
            { old: product.sageCode, new: newSageCode },)

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
            `Final Product Name: ${productFinalName}, Sage Code: ${newSageCode}`
        );

        if (!productFinalName) {
            console.warn("Product name is missing. Using default name instead.");
            productFinalName = `${randomUUID()}`; // Fallback to a default name if missing
        }

        const productConfig: ProductCreationProps = {
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
            // is_visible: product.isAdded, // Map directly to is_visible
            is_visible: false, //TODO: Default to false, adjust if necessary
            custom_url: {
                url: `/${newSageCode || "default-product"}`, // Generate a URL
                is_customized: true,
            },
            variants: sizeVariants?.length
                ? sizeVariants.map((variant) => ({
                        sku: `${newSageCode}.${product.sageCode}-${variant.toUpperCase()}`,
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

        return {productConfigs: productConfig, category: product.category}
    });

    return productList;
};