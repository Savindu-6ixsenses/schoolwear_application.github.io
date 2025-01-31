"use client";

import React, { useEffect, useState } from "react";
import AddToList from "./AddToList";
import { StoreProduct } from "@/types/products";

interface SingleRecordProps {
	item: StoreProduct;
	store_code: string;
	design_id: string;
}

const SingleRecord = ({
	item,
	store_code,
	design_id,
}: SingleRecordProps) => {
	// State to track selected sizes
	const [selectedSizes, setSelectedSizes] = useState<{
		[key: string]: boolean;
	}>({});

	// Parse the size_variations string and initialize selectedSizes state
	useEffect(() => {
		const sizesArray = item.sizeVariations?.split(",") || []; // Split string into array
		const initialSizes: { [key: string]: boolean } = {};

		// Initialize sizes as true if they exist in size_variations
		sizesArray.forEach((size) => {
			initialSizes[size] = true;
		});

		// Set the state with the initialized sizes
		setSelectedSizes(initialSizes);
	}, [item]);

	// Toggle size selection
	const toggleSize = (size: string) => {
		setSelectedSizes((prevSelectedSizes) => ({
			...prevSelectedSizes,
			[size]: !prevSelectedSizes[size],
		}));
	};

	// Array of sizes to iterate through
	const sizes = ["SM", "MD", "LG", "XL", "X2", "X3"];

	return (
		<table className="w-full border-collapse border border-gray-700 mx-2">
			<thead>
				<tr className="bg-gray-800 text-white">
					<th
						colSpan={4}
						className="border border-gray-700 p-2 text-left"
					>
						{item.productName}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr className="text-black">
					{/* ID Column */}
					<td className="border border-gray-700 p-2 bg-gray-200 text-gray-900 ">
						<button className="bg-gray-300 text-gray-900 px-3 py-1 rounded">
							{item.sageCode}
						</button>
					</td>

					{/* Sizes Column */}
					<td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
						<div className="flex flex-wrap gap-2">
							{sizes.map(
								(size) =>
									item[size as keyof StoreProduct] && ( // Only render if size is true
										<button
											key={size}
											onClick={() => toggleSize(size)}
											className={`px-3 py-1 rounded border border-gray-700 hover:shadow-lg ${
												selectedSizes[size]
													? "bg-purple-400 text-white"
													: "bg-gray-300 text-gray-900"
											}`}
										>
											{size}
										</button>
									)
							)}
						</div>
					</td>

					{/* Price Column
					<td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
						<span className="bg-gray-300 px-3 py-1 rounded">
							{item["Price"]}
						</span>
					</td> */}

					{/* Actions Column */}
					<td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
						{/* TODO: Here checking whether added to list from item variations being null is not correct. To check it it should be "" instead of null and for the products without item variations then this added to list won't change.*/}
						{item.isAdded == false ? (
							<AddToList
								store_code={`${store_code}`}
								product_id={`${item.productId}`}
								design_id={`${design_id}`}
								size_variations={selectedSizes}
								added_to_list={false}
							/>
						) : (
							<AddToList
								store_code={`${store_code}`}
								product_id={`${item.productId}`}
								design_id={`${design_id}`}
								size_variations={selectedSizes}
								added_to_list={true}
							/>
						)}
					</td>
				</tr>
			</tbody>
		</table>
	);
};

export default SingleRecord;
