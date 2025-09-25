import { StoreCreationProps } from "@/types/store";
import React, { useState } from "react";
import { useStoreState } from "../store/useStoreState";
import toast from "react-hot-toast";

const CreateStore = (props: {
	store: StoreCreationProps | null;
	category_list: string[];
	setLogUrl: React.Dispatch<React.SetStateAction<string | null>>;
	setReportUrl: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
	const [loading, setLoading] = useState<boolean>(false);
	const { store, setStoreStatus } = useStoreState();
	const storeStatus = store?.status || "Draft";

	console.log("Props in CreateStore", props);

	const createStore = async () => {
		// If the store object is null or undefined, log an error and return
		if (!props.store) {
			console.error("Store object is null or undefined");
			return;
		}

		const storeCreationItems = {
			store: props.store,
			category_list: props.category_list,
		};

		setLoading(true);
		console.log("Creating store on BigCommerce...");
		try {
			const response = await fetch("/api/store_creation/bigcommerce/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(storeCreationItems),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to create store on BigCommerce. Status: ${response.status}, Message: ${response.statusText}, Error`
				);
			}

			console.log("Store created successfully on BigCommerce.");
			// props.setLogUrl(response.headers.get("logUrl"));
			// props.setReportUrl(response.headers.get("reportUrl"));
			setLoading(false);
			setStoreStatus("Approved");
		} catch (e) {
			console.error("Error creating the store [Client Side]:", e);
			setLoading(false);
			toast.error("Error creating the store. Please contact support.")
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
