"use client";

import { GLOBAL_NAMING_METHODS } from "@/constants/products";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useStoreState } from "../store/useStoreState";

type MethodKey = keyof typeof GLOBAL_NAMING_METHODS;

interface RemoveFromListProps {
	store_code: string;
	design_id: string;
	product_id: string;
	added_to_list: boolean;
    setAddedToList: React.Dispatch<React.SetStateAction<boolean>>;
    setMethodFields: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
    setSelectedMethod: React.Dispatch<React.SetStateAction<MethodKey>>;
    setSelectedSizes: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

const RemoveFromList: React.FC<RemoveFromListProps> = ({
    store_code,
    design_id,
	product_id,
	added_to_list,
    setAddedToList,
    // setMethodFields,
    setSelectedMethod,
    setSelectedSizes
}) => {
	const [isRemoving, setIsRemoving] = useState(false);

	const {removeProduct} = useStoreState();
	const handleRemove = async () => {
		try {
			setIsRemoving(true);

			const response = await fetch("/api/products/remove_from_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					store_code,
					product_id,
					design_code: design_id
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to remove item from the list.");
			}

			toast.success("Item removed successfully");
			// Optionally: trigger parent state update via props or context
			removeProduct(design_id, product_id);
			setAddedToList(false);
			// setMethodFields({}); // Do not reset method fields because it's always Brand Name for now
            setSelectedMethod("1" as MethodKey); // Reset to default method
            setSelectedSizes({}); // Reset selected sizes
		} catch (error) {
			if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error("Unknown error occurred while removing item.");
			}
		} finally {
			setIsRemoving(false);
		}
	};

	return (
		<button
			onClick={handleRemove}
			className={`py-1 px-2 rounded-md shadow-red-950 bg-red-500 hover:bg-red-400 hover:shadow-lg active:bg-red-500 active:shadow-sm disabled:opacity-50`}
			disabled={!added_to_list || isRemoving}
		>
			{isRemoving ? "Removing..." : "Remove"}
		</button>
	);
};

export default RemoveFromList;
