"use client";

import { useEffect, useState } from "react";

export const useStoreCategories = (
	store_code: string
): {
	added_category_list: string[];
	setAddedCategoryList: React.Dispatch<React.SetStateAction<string[]>>;
} => {
	const [added_category_list, setAddedCategoryList] = useState<string[]>([]);

	const fetchStoreCategories = async () => {
		const response = await fetch("/api/initial_fetch/get_store_categories", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				store_code: store_code,
			}),
		});
		if (!response.ok) {
			throw new Error("Failed to fetch store categories");
		}
		const categories = await response.json();
		console.log("Fetched Categories from API: ", categories);
		return categories;
	};

	useEffect(() => {
		fetchStoreCategories()
			.then((data) => {
				setAddedCategoryList(data.relatedCategories);
			})
			.catch((error) => {
				console.error("Error fetching store categories:", error);
			});
	}, []);

	return {
		added_category_list,
		setAddedCategoryList,
	};
};
