import { StoreCreationProps } from "@/types/store";
import { addToBigCommerce } from "./apiClient";
import { ProductCreationProps } from "@/types/products";

const store_hash = process.env.BIGCOMMERCE_STORE_HASH!;

export const createBigCommerceStore = async (store: StoreCreationProps): Promise<number> => {
  const categoryUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/trees/categories`;

  const body = [{
    name: store.store_name,
    url: {
      path: `/${store.store_code.replace(/\s+/g, "-")}/`,
      is_customized: false,
    },
    parent_id: 0,
    tree_id: 1,
    description: `${store.start_date} to ${store.end_date}`,
    is_visible: false,
    layout_file: "category.html",
  }];

  const responseData = await addToBigCommerce(categoryUrl, "POST", body);

  if (!responseData?.data?.[0]?.category_id) {
    throw new Error("Unexpected response from BigCommerce while creating store.");
  }

  return responseData.data[0].category_id;
};

export const createRelatedCategories = async (
  parentId: number,
  subcategories: string[]
): Promise<Record<string, number>> => {
  const url = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/categories`;

  const result: Record<string, number> = {};

  for (const subCat of subcategories) {
    const response = await addToBigCommerce(url, "POST", {
      name: subCat,
      parent_id: parentId,
      is_visible: false,
    });
    result[subCat] = response.data.id;
  }

  return result;
};



export const createBigCommerceProducts = async (products: ProductCreationProps[]) => {
  const productUrl = `https://api.bigcommerce.com/stores/${store_hash}/v3/catalog/products`;

  for (const product of products) {
    let success = false;
    let attempt = 0;

    while (!success && attempt < 3) {
      try {
        await addToBigCommerce(productUrl, "POST", product);
        success = true;
      } catch (error) {
        attempt++;
        console.error(
          `Attempt ${attempt} failed for product: ${product.name}`,
          error instanceof Error ? error.message : error
        );

        if (attempt >= 3) {
          console.error("Final failed payload:", product); // Log entire payload for debugging
          throw new Error(`Failed after 3 attempts: ${product.name}`);
        }

        await new Promise((res) => setTimeout(res, 2500));
      }
    }
  }
};
