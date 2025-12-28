import React from "react";
import { getStoreSummaries } from "./actions";
import StoreList from "./StoreList";

// Define the new data structures based on the view and grouping logic.
// These can be moved to a central types file later if needed.

const ListPage = async () => {
	const initialStores = await getStoreSummaries();

	return (
		<div className="p-4">
			<StoreList initialStores={initialStores} />
		</div>
	);
};

export default ListPage;
