"use client";

import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DesignItemProps } from "@/types/store";
import { createClient } from "@/utils/supabase/ssr_client/client";
import { FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

interface AddNewDesignProps {
	designItems: DesignItemProps[];
	designList?: string[]; // Contains the list of design IDs added to the store
	setDesignItems: (designItems: DesignItemProps[]) => void;
	setCurrentDesign: ({
		image,
		designId,
		Design_Guideline,
	}: {
		image: string;
		designId: string;
		Design_Guideline: string;
	}) => void;
}

const AddNewDesign: React.FC<AddNewDesignProps> = ({
	designItems,
	designList,
	setDesignItems,
	setCurrentDesign,
}) => {
	const [newDesign, setNewDesign] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);

	const [uploading, setUploading] = useState(false);

	const inputRef = useRef(null);

	const supabase = createClient();

	console.log("Design Items:", designItems, "and Design List:", designList);

	// Prioritize selected designs and mark them as "Added"
	const sortedDesignItems = !designList
		? designItems
		: [...designItems]
				.sort((a, b) => {
					const aIndex = designList.indexOf(a.Design_Id);
					const bIndex = designList.indexOf(b.Design_Id);
					if (aIndex === -1 && bIndex === -1) return 0; // neither in designList
					if (aIndex === -1) return 1; // b is in designList, so b comes first
					if (bIndex === -1) return -1; // a is in designList, so a comes first
					return aIndex - bIndex; // maintain order from designList
				})
				.map((item) => ({
					...item,
					Design_Guideline: designList.includes(item.Design_Id)
						? `${item.Design_Guideline} (Added)`
						: item.Design_Guideline,
				}));

	console.log("Sorted Design Items:", sortedDesignItems);
	console.log("Design List:", designList);

	// Handle the file upload
	const uploadImage = async (imageFile: File) => {
		try {
			setUploading(true);

			const file = imageFile;
			if (!file) throw new Error("No file selected");

			// Generate a unique file path
			const filePath = `Logo_Images/${uuidv4()}-${file.name}`;

			// Upload the file to Supabase Storage
			const { error: uploadError } = await supabase.storage
				.from("design-logo-images")
				.upload(filePath, file);

			if (uploadError) {
				console.error("Error uploading image:", uploadError);
				return { publicUrl: "" };
			}

			// Get the public URL of the uploaded file
			const { data: publicUrl } = supabase.storage
				.from("design-logo-images")
				.getPublicUrl(filePath);

			console.log("Image uploaded successfully:", publicUrl);

			return publicUrl;
		} catch (error) {
			console.error("Error uploading image:", error);
		} finally {
			setUploading(false);
		}
	};

	const addNewDesign = async (design_item: DesignItemProps) => {
		try {
			const response = await fetch("/api/add_design_items", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(design_item),
			});

			if (response.ok) {
				console.log("Added the design");
			} else {
				console.log("Error adding the design: Response not Okay ", response);
				throw new Error(`Failed to add design: ${response.statusText}`);
			}
		} catch (error) {
			console.error("Error adding the design", error);
			throw new Error(`Failed to add design: ${error instanceof Error ? error.message : "Unknown error"}`);
		}
	};

	// Handle adding a new design
	const handleAddNewDesign = async () => {
		if (newDesign && newDescription && imageFile) {
			// Uploading and get the Public URL for the image
			const { publicUrl } = (await uploadImage(imageFile)) ?? { publicUrl: "" };

			console.log("Public URL :", publicUrl);

			// Create a new design item
			const newDesignItem: DesignItemProps = {
				Design_Id: uuidv4(),
				Design_Guideline: newDesign,
				Design_Description: newDescription,
				Image_URL: publicUrl,
			};

			// Update the list of design items

			const updatedDesignItems = [...designItems, newDesignItem];
			setDesignItems(updatedDesignItems);

			
			try {
				addNewDesign(newDesignItem);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error : any) {
				console.error("Error adding new design:", error);
				toast.error(`Failed to add new design: ${error.message}`);
				return;
			}
			
			setCurrentDesign({
				image: newDesignItem.Image_URL,
				designId: newDesignItem.Design_Id,
				Design_Guideline: newDesignItem.Design_Guideline,
			});
			// Clear input fields
			setNewDesign("");
			setNewDescription("");
		} else {
			alert("Please fill in both fields!");
		}
	};

	// Handle selecting an existing design
	const handleSelectExistingDesign = (design_ID: string) => {
		const selectedDesign = designItems.find(
			(item) => item.Design_Id === design_ID
		);
		if (selectedDesign) {
			setSelectedDesignId(selectedDesign.Design_Id);
			setNewDesign(selectedDesign.Design_Guideline);
			setNewDescription(selectedDesign.Design_Description);
			setCurrentDesign({
				image: selectedDesign.Image_URL,
				designId: selectedDesign.Design_Id,
				Design_Guideline: selectedDesign.Design_Guideline,
			});
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4 border border-gray-300 rounded-md bg-gray-100 w-full max-w-lg">
			<h2 className="text-lg font-bold mb-2 text-black">
				Add or Select a Design
			</h2>

			{/* Dropdown to Select an Existing Design */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="existingDesign"
					className="text-gray-700"
				>
					Select Existing Design:
				</label>
				<select
					id="existingDesign"
					className="border border-gray-400 p-2 rounded-md text-black"
					onChange={(e) => handleSelectExistingDesign(e.target.value)}
					value={selectedDesignId || ""}
				>
					<option
						value=""
						disabled
						hidden
					>
						-- Select a Design --
					</option>
					{sortedDesignItems.map((item) => {
						const isAdded = designList?.includes(item.Design_Id);
						return (
							<option
								key={item.Design_Id}
								value={item.Design_Id}
								style={{
									color: isAdded ? "green" : "black", // very limited effect
								}}
							>
								{isAdded
									? `🟢 ${item.Design_Guideline}`
									: item.Design_Guideline}
							</option>
						);
					})}
				</select>
			</div>

			{/* Input for Design Guideline */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="designGuideline"
					className="text-gray-700"
				>
					Design Guideline:
				</label>
				<input
					id="designGuideline"
					type="text"
					className="border border-gray-400 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
					value={newDesign}
					onChange={(e) => setNewDesign(e.target.value)}
					placeholder="Enter Design Guideline"
				/>
			</div>

			{/* Input for Design Description */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="designDescription"
					className="text-gray-700"
				>
					Design Description:
				</label>
				<input
					id="designDescription"
					type="text"
					className="border border-gray-400 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
					value={newDescription}
					onChange={(e) => setNewDescription(e.target.value)}
					placeholder="Enter Design Description"
				/>
			</div>
			{/* File Input for Image */}
			<div className="flex flex-col gap-2">
				<label
					htmlFor="designImage"
					className="text-gray-700"
				>
					Design Image:
				</label>
				<input
					id="designImage"
					type="file"
					accept="image/*"
					ref={inputRef}
					className="border border-gray-400 p-2 rounded-md text-black"
					onChange={(e) =>
						setImageFile(e.target.files ? e.target.files[0] : null)
					}
				/>
			</div>

			{/* Button to Add New Design */}
			{!uploading ? (
				<button
					className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 h-10"
					onClick={handleAddNewDesign}
				>
					Add Design
				</button>
			) : (
				<button
					className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600 h-10 flex justify-center items-center"
					disabled={true}
				>
					<div>
						<FaSpinner className="animate-spin" />
					</div>
				</button>
			)}
		</div>
	);
};

export default AddNewDesign;
