import { StoreProduct } from "@/types/products";

export const fetchProducts = async ({store_code,designId, currentPage, currentPageSize, query, categories = []} : {
    store_code: string;
    designId: string;
    currentPage: number;
    currentPageSize: number;
    query?: string;
    categories?: string[];
}) : Promise<{products : StoreProduct[]; totalPages: number}> => {
	try {
		// Construct base URL
		let url = `/api/search_products?store_code=${store_code}&design_id=${designId}&page=${currentPage}&page_size=${currentPageSize}`;

		// Add query and categories if they exist
		if (query) url += `&q=${query}`;
		if (categories.length > 0) url += `&categories=${categories.join(",")}`;

		const response = await fetch(url);
		const response_data: { products: StoreProduct[]; totalPages: number } =
			await response.json();
		const products: StoreProduct[] = response_data.products;
		const totalPages: number = response_data.totalPages;
		return { products, totalPages };
	} catch (error) {
		console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
	}
};
