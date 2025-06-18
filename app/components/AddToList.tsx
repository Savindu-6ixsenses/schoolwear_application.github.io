"use client";

import { useState, useEffect } from "react";

// TODO: Handle when there are no sizes originally.
const AddToList = ({
	store_code,
	product_id,
	design_id,
	size_variations,
	added_to_list,
	method,
	naming_fields

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

	useEffect(() => {
		setSelectedSizes(
			Object.keys(size_variations)
				.filter((size) => size_variations[size] === true)
				.join(",") // Create a comma-separated string
		);
	}, [size_variations]);

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
		} catch (error) {
			console.error("Error adding to list", error);
		}
	};

	const handleClickEdit = async () => {
		console.log("Editing Parameters: ",store_code, product_id, design_id, selected_sizes, method, naming_fields);
		// Logging the parameters to be sent for editing
		try {
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
		} catch (error) {
			console.error("Error editing item", error);
		}
	};

	return (
		<div>
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
		</div>
	);
};

export default AddToList;
