import React from "react";
import { createClient } from "@/utils/supabase/ssr_client/server";
import ProductDisplay from "@/app/components/ProductDisplay";
import { notFound } from "next/navigation"; // ✅ Import this
import { getAddedDesignList } from "@/services/designs/";

interface ProductPageProps {
	params: { store_code: string };
}

const ProductPage = async ({ params }: ProductPageProps) => {
	const supabase = await createClient();

	// Fetch store data
	const { data: store_data, error: storeError } = await supabase
		.from("stores")
		.select("*")
		.eq("store_code", params.store_code);

	if (storeError) {
		console.error("❌ Store fetch error:", storeError.message);
	}

	const store = store_data ? store_data[0] : null;

	// ✅ If no store, trigger Next.js 404
	if (!store) {
		notFound(); // Will render your app/not-found.tsx page
	}

	const designList: string[] = await getAddedDesignList(params.store_code);

	console.log("✅ Store:", store);
	console.log("✅ Design IDs:", designList);

	return (
		<ProductDisplay
		storeCode = {params.store_code}
			designIdList={designList}
		/>
	);
};

export default ProductPage;
