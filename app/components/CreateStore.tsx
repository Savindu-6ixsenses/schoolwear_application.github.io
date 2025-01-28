import { StoreCreationProps } from "@/types/store";
import React from "react";

const CreateStore = (props: { store: StoreCreationProps | null }) => {
	const [loading, setLoading] = React.useState(false);
	const store = props.store;
	const createStore = async () => {
		// If the store object is null or undefined, log an error and return
		if (!props.store) {
			console.error("Store object is null or undefined");
			return;
		}


		setLoading(true);
		try {
			const response = await fetch("api/store_creation/bigcommerce/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(store),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to create store on BigCommerce. Status: ${response.status}, Message: ${response.statusText}`
				);
			}
			console.log("Store created successfully on BigCommerce.");
			setLoading(false);
		} catch (e) {
			console.error("Error creating the store:", e);
			throw e;
		}
	};

	return (
		<div className="flex justify-end">
			{!loading ? <div
				className="flex justify-center items-center mt-3 mr-3 bg-blue-500 shadow-md hover:shadow-xl hover:bg-blue-700 text-white w-24 h-12 rounded-md cursor-pointer"
				onClick={createStore}
			>
				CreateStore
			</div> : <div
				className="flex justify-center items-center mt-3 mr-3 bg-blue-700 shadow-md hover:shadow-xl text-white w-24 h-12 rounded-md cursor-pointer"
			>
				Creating Store...
			</div>}
		</div>
	);
};

export default CreateStore;
