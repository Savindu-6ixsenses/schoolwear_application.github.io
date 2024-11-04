"use client";

import React from "react";

const AddToList = ({
	store_code,
	sage_code,
	design_id,
	size_variations,
}: {
	store_code: string;
	sage_code: string;
	design_id: string;
	size_variations: { [key: string]: boolean };
}) => {
	const [addedToList, setAddedToList] = React.useState(false);
	const [selected_sizes, setSelectedSizes] = React.useState<string[]>([]);

	React.useEffect(() => {
		setSelectedSizes(Object.keys(size_variations).filter((size) => size_variations[size] === true));
	},[size_variations])

	const handleClick = async () => {
		console.log(store_code, sage_code, design_id,selected_sizes);
		try {
			const response = await fetch("/api/add_to_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
                body: JSON.stringify({store_code, sage_code, design_code: design_id, size_variations: selected_sizes}),
			});

			if (response.ok) {
				console.log("Added to list");
				setAddedToList(true);
			}
            else {
                console.log("Error adding to list: Response not Okay ", response);
            }
		} catch (error) {
			console.error("Error adding to list", error);
		}
	};

	const handleClickEdit = async () => {
		console.log(store_code, sage_code, design_id,selected_sizes);
		try {
			const response = await fetch("/api/add_to_list", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
                body: JSON.stringify({store_code, sage_code, design_code: design_id, size_variations: selected_sizes}),
			});

			if (response.ok) {
				console.log("Item is Edited");
				setAddedToList(true);
			}
            else {
                console.log("Error editing the item because Response not Okay ", response);
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
