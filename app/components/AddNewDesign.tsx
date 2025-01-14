"use client";

import React, { useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { DesignItemProps } from "@/types/store";
import { createClient } from "@/utils/supabase/ssr_client/client";

interface AddNewDesignProps {
	designItems: DesignItemProps[];
	setDesignItems: React.Dispatch<React.SetStateAction<DesignItemProps[]>>;
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


	async function listBuckets() {
		try {
			const { data, error } = await supabase.storage.listBuckets();

			if (error) {
				console.error("Error listing buckets:", error);
				return;
			}

			console.log("Buckets:", data);
		} catch (error) {
			console.error("Unexpected error:", error);
		}
	}

	const uploadImage3 = async (file: File) => {
		try {
			const formData = new FormData();
			formData.append("file", file);

			// Generate a unique file path
			const filePath = `${uuidv4()}-${file.name}`;

			// Replace with your Supabase project details
			const projectUrl = "https://fceaelwbsvllwgbqaeck.supabase.co";
			const bucketName = "uploads";

			listBuckets()

			const response = await fetch(
				`${projectUrl}/storage/v1/object/${bucketName}/${filePath}`,
				{
					method: "POST",
					body: formData,
					headers: {
						Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
					},
				}
			);

			if (!response.ok) {
				throw new Error("Failed to upload image");
			}

			const data = await response.json();
			console.log("Image uploaded successfully:", data);
			return data;
		} catch (error) {
			console.error("Error uploading image:", error);
		}
	};

	// Handle the file upload
	const uploadImage2 = async (imageFile: File) => {
		try {
			setUploading(true);

			const file = imageFile;
			if (!file) throw new Error("No file selected");

			// Generate a unique file path
			const filePath = `${uuidv4()}-${file.name}`;


			// Upload the file to Supabase Storage
			const { data: uploadData, error: uploadError } = await supabase.storage
				.from("design-logo-images")
				.upload(filePath, file);

			if (uploadError) throw uploadError;

			// Get the public URL of the uploaded file
			const { data: publicUrl } = supabase.storage
				.from("design-logo-images")
				.getPublicUrl(filePath);

			console.log("Image uploaded successfully:", publicUrl);

			return publicUrl
		} catch (error) {
			console.error("Error uploading image:", error);
		} finally {
			setUploading(false);
		}
	};

	const uploadImage = async (imageFile: File) => {
		try {
			const formData = new FormData();
			formData.append("file", imageFile); // Append the image file to the form data

			const response = await fetch("/api/upload_image", {
				method: "POST",
				body: formData, // Use formData as the body
				// duplex: "half"
			});

			if (response.ok) {
				const responseData = await response.json(); // Parse the JSON response
				console.log("Image uploaded successfully:", responseData);
				return responseData; // Return the uploaded image URL or metadata
			} else {
				console.error(
					"Error uploading the image: Response not Okay ",
					response
				);
			}
		} catch (error) {
			console.error("Error uploading the image", error);
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
			}
		} catch (error) {
			console.error("Error adding the design", error);
		}
	};

	// Handle adding a new design
	const handleAddNewDesign = async () => {
		if (newDesign && newDescription && imageFile) {
			// Uploading and get the Public URL for the image
			const publicUrl = await uploadImage2(imageFile);

			console.log("Public URL :", publicUrl);

			await listBuckets()

			// Create a new design item
			const newDesignItem: DesignItemProps = {
				Design_Id: uuidv4(),
				Design_Guideline: newDesign,
				Design_Description: newDescription,
				Image_URL:
					"https://fceaelwbsvllwgbqaeck.supabase.co/storage/v1/object/public/design-logo-images/Logo_Images/bird-colorful-logo-gradient-vector_343694-1365.jpg?t=2024-11-03T08%3A13%3A54.194Z",
			};

			// Update the list of design items
			setDesignItems((prevItems) => [...prevItems, newDesignItem]);

			setCurrentDesign({
				image: newDesignItem.Image_URL,
				designId: newDesignItem.Design_Id,
				Design_Guideline: newDesignItem.Design_Guideline,
			});

			addNewDesign(newDesignItem);
			// Clear input fields
			setNewDesign("");
			setNewDescription("");
		} else {
			alert("Please fill in both fields!");
		}
	};

	// Handle selecting an existing design
	const handleSelectExistingDesign = (designId: string) => {
		const selectedDesign = designItems.find(
			(item) => item.Design_Id === designId
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
					className="border border-gray-400 p-2 rounded-md"
					onChange={(e) => handleSelectExistingDesign(e.target.value)}
					value={selectedDesignId || ""}
				>
					<option
						value=""
						disabled
					>
						-- Select a Design --
					</option>
					{designItems.map((item) => (
						<option
							key={item.Design_Id}
							value={item.Design_Id}
						>
							{item.Design_Guideline}
						</option>
					))}
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
			<button
				className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
				onClick={handleAddNewDesign}
			>
				Add Design
			</button>
		</div>
	);
};

export default AddNewDesign;
