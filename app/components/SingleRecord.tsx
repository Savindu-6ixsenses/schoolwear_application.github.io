"use client";

import React, { useEffect, useState } from "react";
import AddToList from "./AddToList";
import { StoreProduct } from "@/types/products";

interface SingleRecordProps {
	item: StoreProduct;
	store_code: string;
	design_id: string;
}

// Define the methods and what fields they need
const namingMethods = {
	"1": ["brandName"],
	"2": [],
	"3": ["brandName", "subCategory"],
	"4": ["brandName", "subCategory", "designName"],
	"5": ["specialName"],
	"6": ["specialName", "printingMethod"],
	"7": ["specialName"],
	"8": ["gradLabel"],
} as const;

const SingleRecord = ({ item, store_code, design_id }: SingleRecordProps) => {
	// State to track selected sizes
	const [selectedSizes, setSelectedSizes] = useState<{
		[key: string]: boolean;
	}>({});

	type MethodKey = keyof typeof namingMethods;

	const [selectedMethod, setSelectedMethod] = useState<MethodKey>(item.naming_method as MethodKey || "1");
	const [methodFields, setMethodFields] = useState<{ [key: string]: string }>(
		item.naming_fields || {}
	);

	// Initialize size state from size variations
	useEffect(() => {
		const sizesArray = item.sizeVariations?.split(",") || [];
		const initialSizes: { [key: string]: boolean } = {};

		sizesArray.forEach((size) => {
			initialSizes[size.trim()] = true;
		});

		setSelectedSizes(initialSizes);
	}, [item]);

	const handleFieldChange = (field: string, value: string) => {
		setMethodFields((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Toggle size selection
	const toggleSize = (size: string) => {
		setSelectedSizes((prev) => ({
			...prev,
			[size]: !prev[size],
		}));
	};

	const sizes = ["SM", "MD", "LG", "XL", "X2", "X3"];

	return (
		<div className="border border-gray-300 rounded-lg shadow-md bg-white mb-2">
			{/* Product Title */}
			<div className="bg-gray-800 text-white px-4 py-2 rounded-t-md">
				<h2 className="text-md font-semibold truncate">{item.productName}</h2>
			</div>

			{/* Product Details Row */}
			<div className="flex grid-cols-[150px_1fr_150px] gap-4 p-4 items-center justify-between">
				{/* Sage Code */}
				<div className="flex">
					<div className="flex items-center">
						<button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md border border-gray-300 shadow-sm">
							{item.sageCode}
						</button>
					</div>
				</div>

				{/* Product Naming Method Selector */}
				<div className="flex flex-col border-t border-gray-300 pt-4">
					<label className="block text-sm font-medium text-gray-700">
						Product Naming Method:
					</label>
					<select
						className="mt-1 p-2 border rounded w-full text-black"
						value={selectedMethod}

						onChange={(e) => setSelectedMethod(e.target.value as MethodKey)}
					>
						{Object.keys(namingMethods).map((key) => (
							<option
								key={key}
								value={key}
							>
								Method {key}
							</option>
						))}
					</select>

					{/* Dynamically render required inputs */}
					{namingMethods[selectedMethod].map((field) => (
						<div
							key={field}
							className="mt-2"
						>
							<label className="block text-sm text-gray-700 capitalize">
								{field.replace(/([A-Z])/g, " $1")}:
							</label>
							<input
								type="text"
								className="mt-1 p-2 border rounded w-full text-black"
								value={methodFields[field] || ""}
								onChange={(e) => handleFieldChange(field, e.target.value)}
								placeholder={`Enter ${field}`}
							/>
						</div>
					))}
				</div>

				{/* Sizes */}
				<div className="flex flex-wrap gap-2">
					{sizes.map(
						(size) =>
							item[size as keyof StoreProduct] && (
								<button
									key={size}
									onClick={() => toggleSize(size)}
									className={`px-3 py-1 rounded border ${
										selectedSizes[size]
											? "bg-purple-500 text-white"
											: "bg-gray-100 text-gray-700 hover:bg-gray-200"
									}`}
								>
									{size}
								</button>
							)
					)}
				</div>

				{/* Action Button */}
				<div className="flex justify-end">
					<AddToList
						store_code={store_code}
						product_id={item.productId}
						design_id={design_id}
						size_variations={selectedSizes}
						added_to_list={item.isAdded || false}
            method = {selectedMethod}
            naming_fields={methodFields}
					/>
				</div>
			</div>
		</div>
	);
};

export default SingleRecord;
