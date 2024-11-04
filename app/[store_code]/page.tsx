import React from "react";
import { createClient } from "@/utils/supabase/ssr_client/server";
import ProductDisplay from "@/app/components/ProductDisplay";

interface ProductPageProps {
	params: { store_code: string; design_code: string };
}

const ProductPage = async ({ params }: ProductPageProps) => {
	const supabase = createClient();

	// Fetch store data
	const { data: store_data, error: storeError } = await supabase
		.from("stores")
		.select("*")
		.eq("store_code", params.store_code);

	// Fetch product data
	const { data: product_data, error: productError } = await supabase
		.from("products_table")
		.select("*");

	const store = store_data ? store_data[0] : null;

	return (
		<ProductDisplay
			store={store}
			productData={product_data || []}
		/>
	);
};

export default ProductPage;
