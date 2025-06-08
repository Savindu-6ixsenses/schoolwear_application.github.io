import React from "react";
import { createClient } from "@/utils/supabase/ssr_client/server";
import ProductDisplay from "@/app/components/ProductDisplay";

interface ProductPageProps {
	params: { store_code: string};
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

	const {data: design_data, error: designError} = await supabase
		.from("stores_products_designs_2")
		.select("*")
		.eq("Store_Code", params.store_code);

	if (designError) {
		console.error(designError);
	}

	const store = store_data ? store_data[0] : null;
	const designs = design_data ? design_data : null;

	const designList: string[] = Array.from(
		new Set((designs || []).map((design) => design?.["Design_ID"]).filter(Boolean))
	);	

	console.log("Store data:", store);
	console.log("Design data:", designList);	

	return <ProductDisplay store={store} designIdList={designList}/>;
};

export default ProductPage;
