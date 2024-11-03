"use client";

import { createClient } from "@/utils/supabase/ssr_client/client";
import React from "react";

const AddToList = ({
	store_code,
	sage_code,
	design_code,
}: {
	store_code: string;
	sage_code: string;
	design_code: string;
}) => {
	const [addedToList, setAddedToList] = React.useState(false);

	const handleClick = async () => {
		console.log(store_code, sage_code, design_code);
		try {
			const response = await fetch("/api/add_to_list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
                body: JSON.stringify({store_code, sage_code, design_code })
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
					onClick={handleClick}
				>
					Edit
				</button>
			)}
		</div>
	);
};

export default AddToList;
