"use client";

import { GLOBAL_NAMING_METHODS } from "@/constants/products";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useStoreState } from "../store/useStoreState";

type NamingFieldSet = {
	[key: string]: string; // e.g. brandName, subCategory, specialName, etc.
};

// TODO: Handle when there are no sizes originally.
const AddToList = ({
	store_code,
	product_id,
	product_name,
	design_id,
	designGuideline,
	size_variations,
	added_to_list,
	method: naming_method,
	naming_fields,
	product_category,
	categoryList,
	setCategoryList,
	setAddedToList
}: {
	store_code: string;
	product_id: string;
	product_name: string;
	design_id: string;
	designGuideline: string;
	size_variations: { [key: string]: boolean };
	added_to_list: boolean;
	method: string;
	naming_fields: { [key: string]: string };
	categoryList: string[];
	product_category: string;
	setCategoryList: (categories: string[]) => void;
	setAddedToList: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
	const [selected_sizes, setSelectedSizes] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
	const {addProduct} = useStoreState();


	useEffect(() => {
		setSelectedSizes(
			Object.keys(size_variations)
				.filter((size) => size_variations[size] === true)
				.join(",") // Create a comma-separated string
		);
	}, [size_variations]);

	useEffect(() => {
		if (added_to_list && !categoryList.includes(product_category)) {
			setCategoryList([...categoryList,product_category]); // Update the state to trigger re-render
		}
	}, [added_to_list]);

	const validateNamingFields = (
		methodKey: keyof typeof GLOBAL_NAMING_METHODS,
		fields: NamingFieldSet
	): void => {
		const expectedFields = GLOBAL_NAMING_METHODS[methodKey] || [];

		const providedFieldNames = Object.keys(fields).filter(
			(key) => fields[key] !== undefined && fields[key] !== ""
		);

		// Check if all required fields are present
		const missingFields = expectedFields.filter(
			(requiredField) => !providedFieldNames.includes(requiredField)
		);

		if (missingFields.length > 0) {
			throw new Error(
				`Missing required fields for method ${methodKey}: ${missingFields.join(
					", "
				)}`
			);
		}
	};

	const handleClick = async () => {
		// Logging the parameters to be sent
		console.log(
			"Adding to list with parameters: ",
			store_code,
			product_id,
			design_id,
			selected_sizes,
			naming_method,
			naming_fields
		);

		try {
			setIsLoading(true);

			// Validate naming fields before making the request
			validateNamingFields(
				naming_method as keyof typeof GLOBAL_NAMING_METHODS,
				naming_fields
			);

			if (product_category !== "Accessories" && !selected_sizes) {
				throw new Error(
					"Please select at least one size variation for the product."
				);
			}

			const response = await fetch("/api/products/add_to_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					store_code,
					product_id,
					design_code: design_id,
					size_variations: selected_sizes,
					method: naming_method,
					naming_fields: naming_fields,
				}),
			});

			if (response.ok) {
				console.log("Added to list");
				addProduct(design_id, {productId: Number(product_id),productName: product_name, sizeVariations: selected_sizes, category: product_category, designGuideline: designGuideline, naming_method: naming_method, naming_fields: naming_fields});
				toast.success("Item added to list successfully");
				setAddedToList(true);
			} else {
				console.log("Error adding to list: Response not Okay ", response);
			}
			setIsLoading(false);
		} catch (error) {
			if (error instanceof Error) {
				console.error("Validation or server error:", error.message);
				toast.error(error.message); // ✅ show the validation error as toast
			} else {
				console.error("Unexpected error:", error);
				toast.error("An unknown error occurred. Please try again.");
			}
			setIsLoading(false);
		}
	};

	const handleClickEdit = async () => {
		console.log(
			"Editing Parameters: ",
			store_code,
			product_id,
			design_id,
			selected_sizes,
			naming_method,
			naming_fields
		);

		// Logging the parameters to be sent for editing
		try {
			setIsLoading(true);

			// Validate naming fields before making the request
			validateNamingFields(
				naming_method as keyof typeof GLOBAL_NAMING_METHODS,
				naming_fields
			);

			const response = await fetch("/api/edit_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					store_code,
					product_id,
					design_code: design_id,
					size_variations: selected_sizes,
					method: naming_method,
					naming_fields: naming_fields,
				}),
			});

			if (response.ok) {
				console.log("Item is Edited");
				setAddedToList(true);
			} else {
				console.log(
					"Error editing the item because Response not Okay ",
					response
				);
			}
			setIsLoading(false);
		} catch (error) {
			if (error instanceof Error) {
				console.error("Validation or server error:", error.message);
				toast.error(error.message); // ✅ show the validation error as toast
			} else {
				console.error("Unexpected error:", error);
				toast.error("An unknown error occurred. Please try again.");
			}
			setIsLoading(false);
		}
	};

	return (
		<div>
			{!isLoading ? (
				<div>
					{!added_to_list ? (
						<button
							className="bg-black text-white px-3 py-1 rounded hover:shadow-lg"
							onClick={handleClick}
						>
							Add to List
						</button>
					) : (
						<button
							className="bg-black text-white px-3 py-1 rounded hover:shadow-lg"
							onClick={handleClickEdit}
						>
							Edit
						</button>
					)}
				</div>
			) : (
				<div>
					{!added_to_list ? (
						<button
							className="bg-black text-white px-3 py-1 rounded hover:shadow-lg"
							disabled
						>
							Adding to List
						</button>
					) : (
						<button
							className="bg-black text-white px-3 py-1 rounded hover:shadow-lg"
							disabled
						>
							Editing
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default AddToList;
