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

	if (storeError) {
		console.error(storeError);
	}

	const store = store_data ? store_data[0] : null;

	return <ProductDisplay store={store} />;
};

export default ProductPage;
