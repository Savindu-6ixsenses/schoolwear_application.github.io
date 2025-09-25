"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import AddToList from "./AddToList";
import { StoreProduct } from "@/types/products";
import { GLOBAL_NAMING_METHODS, GLOBAL_SIZES } from "@/constants/products";
import RemoveFromList from "./RemoveFromList";

interface SingleRecordProps {
	item: StoreProduct;
	store_code: string;
	design_id: string;
	designGuideline?: string;
	category_list: string[];
	setCategoryList: (categories: string[]) => void;
	storeStatus: string;
}

// Define the methods and what fields they need
// const namingMethods = GLOBAL_NAMING_METHODS;

const SingleRecord = ({
	item,
	store_code,
	design_id,
	designGuideline,
	category_list,
	setCategoryList,
	storeStatus,
}: SingleRecordProps) => {
	// State to track selected sizes
	const [selectedSizes, setSelectedSizes] = useState<{
		[key: string]: boolean;
	}>({});

	type MethodKey = keyof typeof GLOBAL_NAMING_METHODS;

	const [selectedMethod, setSelectedMethod] = useState<MethodKey>(
		(item.naming_method as MethodKey) || "1"
	);
	const [methodFields, setMethodFields] = useState<{ [key: string]: string }>(
		item.naming_fields || {}
	);

	const [added_to_list, setAddedToList] = useState(item.isAdded || false);

	// Initialize size state from size variations
	useEffect(() => {
		const sizesArray = item.sizeVariations?.split(",") || [];
		const initialSizes: { [key: string]: boolean } = {};

		sizesArray.forEach((size) => {
			initialSizes[size.trim()] = true;
		});

		setSelectedSizes(initialSizes);
		setMethodFields(item.naming_fields || {});
		setSelectedMethod((item.naming_method as MethodKey) || "1");
		setAddedToList(item.isAdded || false);
	}, [item]);

	// const handleFieldChange = (field: string, value: string) => {
	// 	setMethodFields((prev) => ({
	// 		...prev,
	// 		[field]: value,
	// 	}));
	// };

	// Toggle size selection
	const toggleSize = (size: string) => {
		setSelectedSizes((prev) => ({
			...prev,
			[size]: !prev[size],
		}));
	};

	const handleCopyDetails = async () => {
		const sizesToCopy = Object.keys(selectedSizes)
			.filter((size) => selectedSizes[size])
			.join(", ");

		let detailsString = `Product Name: ${item.productName}\nSAGE Code: ${item.sageCode}`;

		if (sizesToCopy) {
			detailsString += `\nSizes: ${sizesToCopy}`;
		}

		detailsString += `\nNaming Method: Method ${selectedMethod}`;

		const fieldEntries = Object.entries(methodFields).filter(
			([, value]) => value
		);
		if (fieldEntries.length > 0) {
			detailsString += `\nFields:\n`;
			detailsString += fieldEntries
				.map(([key, value]) => `  ${key.replace(/([A-Z])/g, " $1")}: ${value}`)
				.join("\n");
		}

		try {
			await navigator.clipboard.writeText(detailsString);
			toast.success("Product info copied!");
		} catch (err) {
			console.error("Failed to copy text: ", err);
			toast.error("Failed to copy product info.");
		}
	};

	const sizes = GLOBAL_SIZES;

	return (
		<div className="border border-gray-300 rounded-lg shadow-md bg-white mb-2">
			{/* Product Title */}
			<div className="bg-gray-800 text-white px-4 py-2 rounded-t-md flex flex-row gap-3">
				<h2 className="text-md font-semibold truncate">{item.productName}</h2>
				<button
					onClick={handleCopyDetails}
					className="p-2 text-gray-200 rounded-md hover:text-gray-300"
					title="Copy product details"
				>
					<FaCopy />
				</button>
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

				{/* Naming Method */}
				{/*
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

					{/* Dynamically render required inputs *
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
				</div> */}

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
				{storeStatus !== "Approved" ? (
					<div className="flex justify-end gap-2 items-center">
						{/* TODO: Restrict these buttons from the logic inside to restrict if the store  */}
						<AddToList
							store_code={store_code}
							product_id={item.productId}
							product_name={item.productName}
							design_id={design_id}
							designGuideline={designGuideline || ""}
							size_variations={selectedSizes}
							added_to_list={added_to_list || false}
							method={selectedMethod}
							naming_fields={methodFields}
							product_category={item.category || ""}
							categoryList={category_list}
							setCategoryList={setCategoryList}
							setAddedToList={setAddedToList}
						/>
						<div>
							<RemoveFromList
								store_code={store_code}
								design_id={design_id}
								product_id={item.productId}
								added_to_list={added_to_list || false}
								setAddedToList={setAddedToList}
								setMethodFields={setMethodFields}
								setSelectedMethod={setSelectedMethod}
								setSelectedSizes={setSelectedSizes}
							/>
						</div>
					</div>
				) : (
					<div className="flex justify-end gap-2 items-center">
						<div className="text-gray-500 italic">Store approved</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default SingleRecord;
