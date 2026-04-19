/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from "react";

export const useDesignItems = () :{
    designItems: any[];
    setDesignItems: React.Dispatch<React.SetStateAction<any[]>>
} => {
	
	const [designItems, setDesignItems] = useState<any[]>([]);

	/**
	 * Loads the shared design-item catalog once for the current client session.
	 * Consumers can still mutate local state afterward through `setDesignItems`.
	 */
	const fetchDesignItems = async () => {
		const response = await fetch("/api/initial_fetch/get_design_items", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		console.log("Response from get_design_items API:", response);
		if (!response.ok) {
			throw new Error("Failed to fetch design items");
		}
		const design_items = await response.json();
		return design_items.designItems;
	};

	useEffect(() => {
		// This hook intentionally does a one-time bootstrap fetch; it does not auto-refresh after mutations elsewhere.
		fetchDesignItems().then((data) => {
			console.log("Fetched design items:", data);
            setDesignItems(data)
        }).catch((error) => {
            console.error("Error fetching design items:", error);
        });
	}, []);

    return {designItems, setDesignItems}
    
};
