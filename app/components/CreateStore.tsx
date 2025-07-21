import { StoreCreationProps } from "@/types/store";
import React, { useState } from "react";

const CreateStore = (props: {
	store: StoreCreationProps | null;
	design_item: string;
	category_list: string[];
}) => {
	const [loading, setLoading] = useState<boolean>(false);
	const [storeStatus, setStoreStatus] = useState<string>(props.store?.status || "Draft"); // Default to "Draft" if status is not available;

	console.log("Props in CreateStore", props);

	const createStore = async () => {
		// If the store object is null or undefined, log an error and return
		if (!props.store) {
			console.error("Store object is null or undefined");
			return;
		}

		const storeCreationItems = {
			store: props.store,
			designId: props.design_item,
			category_list: props.category_list,
		};

		setLoading(true);
		console.log("Creating store on BigCommerce...");
		try {
			const response = await fetch("api/store_creation/bigcommerce/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(storeCreationItems),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to create store on BigCommerce. Status: ${response.status}, Message: ${response.statusText}`
				);
			}
			console.log("Store created successfully on BigCommerce.");
			setLoading(false);
			setStoreStatus("Approved"); // Update the store status to "Approved" after successful creation
		} catch (e) {
			console.error("Error creating the store:", e);
			throw e;
		}
	};

	return (
		<div className="flex justify-end">
			{loading ? (
				<div className="flex justify-center items-center mt-3 mr-3 bg-blue-700 shadow-md text-white w-32 h-12 rounded-md cursor-not-allowed opacity-70">
					Creating Store...
				</div>
			) : storeStatus === "Approved" ? (
				<div className="flex justify-center items-center mt-3 mr-3 bg-gray-400 shadow-md text-white w-32 h-12 rounded-md cursor-not-allowed opacity-60">
					Store Approved
				</div>
			) : (
				<div
					className="flex justify-center items-center mt-3 mr-3 bg-blue-500 shadow-md hover:shadow-xl hover:bg-blue-700 text-white w-32 h-12 rounded-md cursor-pointer"
					onClick={() => createStore()}
				>
					Create Store
				</div>
			)}
		</div>
	);
};

export default CreateStore;
