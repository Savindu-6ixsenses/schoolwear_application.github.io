import { ProductCreationProps, StoreProduct } from "@/types/products";
import { StoreCreationProps } from "@/types/store";
import React from "react";

const CreateStore = (props: { store: StoreCreationProps | null ,design_item:string}) => {
	const [loading, setLoading] = React.useState(false);

	console.log("Props in CreateStore", props);

	const createStore = async () => {
		// If the store object is null or undefined, log an error and return
		console.log(1)
		if (!props.store) {
			console.error("Store object is null or undefined");
			return;
		}
		console.log(2)

		console.log(3)

		const storeCreationItems = {
			store: props.store,
			designId: props.design_item
		}
		console.log(4)


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
		} catch (e) {
			console.error("Error creating the store:", e);
			throw e;
		}
	};

	return (
		<div className="flex justify-end">
			{!loading ? <div
				className="flex justify-center items-center mt-3 mr-3 bg-blue-500 shadow-md hover:shadow-xl hover:bg-blue-700 text-white w-24 h-12 rounded-md cursor-pointer"
				onClick={() => createStore()}
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
