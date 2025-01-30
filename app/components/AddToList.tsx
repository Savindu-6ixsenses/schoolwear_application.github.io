"use client";

import React, { useEffect } from "react";

const AddToList = ({
	store_code,
	product_id,
	design_id,
	size_variations,
	added_to_list,
	set_added_to_list,
	added_list,
}: {
	store_code: string;
	product_id: string;
	design_id: string;
	size_variations: { [key: string]: boolean };
	added_to_list: boolean;
	set_added_to_list: React.Dispatch<React.SetStateAction<string[]>>;
	added_list: string[];
}) => {
	const [addedToList, setAddedToList] = React.useState(added_to_list);
	const [selected_sizes, setSelectedSizes] = React.useState<string>("");

	React.useEffect(() => {
		setSelectedSizes(
			Object.keys(size_variations)
				.filter((size) => size_variations[size] === true)
				.join(",") // Create a comma-separated string
		);
	}, [size_variations]);

	const handleClick = async () => {
		console.log(store_code, product_id, design_id, selected_sizes);
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
		console.log(store_code, product_id, design_id, selected_sizes);
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
