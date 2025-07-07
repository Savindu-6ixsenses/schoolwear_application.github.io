import React from "react";
import { createClient } from "@/utils/supabase/ssr_client/server";
import ProductDisplay from "@/app/components/ProductDisplay";
import { notFound } from "next/navigation"; // ✅ Import this

interface ProductPageProps {
	params: { store_code: string };
}

const ProductPage = async ({ params }: ProductPageProps) => {
	const supabase = createClient();

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

	// Fetch design data
	const { data: design_data, error: designError } = await supabase
		.from("stores_products_designs_2")
		.select("*")
		.eq("Store_Code", params.store_code);

	if (designError) {
		console.error("❌ Design fetch error:", designError.message);
	}

	const designList: string[] = Array.from(
		new Set((design_data || []).map((d) => d?.["Design_ID"]).filter(Boolean))
	);

	console.log("✅ Store:", store);
	console.log("✅ Design IDs:", designList);

	return <ProductDisplay store={store} designIdList={designList} />;
};

export default ProductPage;
