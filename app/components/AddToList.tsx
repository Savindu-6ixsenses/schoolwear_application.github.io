"use client";

import { GLOBAL_NAMING_METHODS } from "@/constants/products";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type NamingFieldSet = {
	[key: string]: string; // e.g. brandName, subCategory, specialName, etc.
};

// TODO: Handle when there are no sizes originally.
const AddToList = ({
	store_code,
	product_id,
	design_id,
	size_variations,
	added_to_list,
	method,
	naming_fields,
}: {
	store_code: string;
	product_id: string;
	design_id: string;
	size_variations: { [key: string]: boolean };
	added_to_list: boolean;
	method: string;
	naming_fields: { [key: string]: string };
}) => {
	const [addedToList, setAddedToList] = useState(added_to_list);
	const [selected_sizes, setSelectedSizes] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setSelectedSizes(
			Object.keys(size_variations)
				.filter((size) => size_variations[size] === true)
				.join(",") // Create a comma-separated string
		);
	}, [size_variations]);

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
			method,
			naming_fields
		);

		try {
			setIsLoading(true);
			
			// Validate naming fields before making the request
			validateNamingFields(
				method as keyof typeof GLOBAL_NAMING_METHODS,
				naming_fields
			);


			const response = await fetch("/api/add_to_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					store_code,
					product_id,
					design_code: design_id,
					size_variations: selected_sizes,
					method: method,
					naming_fields: naming_fields,
				}),
			});

			if (response.ok) {
				console.log("Added to list");
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
			method,
			naming_fields
		);

		
		// Logging the parameters to be sent for editing
		try {
			setIsLoading(true);

			// Validate naming fields before making the request
			validateNamingFields(
				method as keyof typeof GLOBAL_NAMING_METHODS,
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
					method: method,
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
			{!isLoading? <div>
				{!addedToList ? (
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
			</div> : <div>
				{!addedToList ? (
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
			</div>}
		</div>
	);
};

export default AddToList;
