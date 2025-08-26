import React from "react";
import { getStoreSummaries } from "./actions";
import StoreList from "./StoreList";

// Define the new data structures based on the view and grouping logic.
// These can be moved to a central types file later if needed.
export interface DesignDetail {
	design_id: number | null;
	product_count: number;
	categories: string | null;
}

export interface StoreSummary {
	store_code: string;
	store_name: string;
	status: string;
	required_date: string;
	total_designs: number;
	total_products: number;
	designs: DesignDetail[];
}

const ListPage = async () => {
	const initialStores = await getStoreSummaries();

	return (
		<div className="p-4">
			<StoreList initialStores={initialStores} />
		</div>
	);
};

export default ListPage;
