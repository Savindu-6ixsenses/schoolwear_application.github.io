"use client";

import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/ssr_client/client";
import { FaEye, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import { useStoreState } from "../store/useStoreState";
import { DesignGuideline, DesignView } from "@/types/designs";
import ImageModal from "./ImageModal";
import { useProductsQueryState } from "../hooks/useProductsQueryState";

interface AddNewDesignProps {
	designGuidelinesList?: DesignGuideline[];
	design: DesignView | null;
	setDesign: (currentDesign: DesignView | null) => void;
	storeCode: string;
}

const AddNewDesign: React.FC<AddNewDesignProps> = ({
	designGuidelinesList,
	design,
	setDesign,
	storeCode,
}) => {
	const { query, setQuery } = useProductsQueryState({
		store_code: storeCode,
	});
	const [uploading, setUploading] = useState(false);
	const [isDesignGuidelineModalOpen, setIsDesignGuidelineModalOpen] =
		useState(false);
	const [isDesignModalOpen, setIsDesignModalOpen] = useState(false);

	const inputRef = useRef(null);

	const supabase = createClient();

	const { designList, setDesignList } = useStoreState();

	const [selectedDesignGuideline, setSelectedDesignGuideline] =
		useState<DesignGuideline | null>(null);

	const [designName, setDesignName] = useState<string>("");
	const [designWidth, setDesignWidth] = useState<number | null>(null);
	const [designHeight, setDesignHeight] = useState<number | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);

	useEffect(() => {
		// When an existing design is selected from the parent, populate the form fields
		if (design) {
			setDesignName(design.design_name || "");
			setDesignWidth(design.width || 7);
			setDesignHeight(design.height || 7);
			const guideline = designGuidelinesList?.find(
				(g) => g.design_guideline === design.design_guideline
			);
			setSelectedDesignGuideline(guideline || null);
		} else {
			// If no design is selected, clear the form for a new entry
			setDesignName("");
			setDesignWidth(7);
			setDesignHeight(7);
			setSelectedDesignGuideline(null);
		}
	}, [design, designGuidelinesList]);

	console.log(
		"Design Items:",
		designGuidelinesList,
		"and Design List:",
		designList
	);

	// Handle the file upload
	const uploadImage = async (imageFile: File) => {
		try {
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

	const addNewDesign = async (design_item: DesignView) => {
		try {
			const response = await fetch("/api/add_design_items", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					Design_Id: design_item.design_id,
					Design_Guideline: design_item.design_guideline,
					Design_Description: design_item.design_description,
					Image_URL: design_item.image_url,
					height: design_item.height,
					width: design_item.width,
					storeCode: design_item.store_code,
					Design_Name: design_item.design_name,
				}),
			});

			if (response.ok) {
				console.log("Added the design");
			} else {
				console.log("Error adding the design: Response not Okay ", response);
				throw new Error(`Failed to add design: ${response.statusText}`);
			}
		} catch (error) {
			console.error("Error adding the design", error);
			throw new Error(
				`Failed to add design: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	const updateDesign = async (design_item: DesignView) => {
		try {
			const response = await fetch("/api/add_design_items", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					design_id: design_item.design_id,
					Design_Guideline: design_item.design_guideline,
					Image_URL: design_item.image_url,
					height: design_item.height,
					width: design_item.width,
					Design_Name: design_item.design_name,
				}),
			});

			if (!response.ok) {
				console.log("Error updating the design: Response not Okay ", response);
				throw new Error(`Failed to update design: ${response.statusText}`);
			}
		} catch (error) {
			console.error("Error updating the design", error);
			throw new Error(
				`Failed to update design: ${
					error instanceof Error ? error.message : "Unknown error"
				}`
			);
		}
	};

	// Handle adding a new design
	const handleAddNewDesign = async () => {
		if (selectedDesignGuideline && imageFile) {
			// Uploading and get the Public URL for the image
			setUploading(true);

			const { publicUrl } = (await uploadImage(imageFile)) ?? { publicUrl: "" };

			console.log("Public URL :", publicUrl);

			// Create a new design item
			const newDesignItem: DesignView = {
				design_id: uuidv4(),
				design_guideline: selectedDesignGuideline.design_guideline,
				design_name: designName,
				design_description: selectedDesignGuideline.design_description,
				image_url: publicUrl,
				height: designHeight,
				width: designWidth,
				store_code: storeCode,
				notes: null
			};

			// Update the list of design items

			const updatedDesignItems = [...(designList ?? []), newDesignItem];
			setDesignList(updatedDesignItems);

			try {
				addNewDesign(newDesignItem);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				console.error("Error adding new design:", error);
				toast.error(`Failed to add new design: ${error.message}`);
				return;
			}

			setDesign(newDesignItem);
			setQuery({ designId: newDesignItem.design_id, page: 1, pageSize: 20 });

			// Clear input fields
			setSelectedDesignGuideline(null);
			setDesignName("");
			setDesignWidth(null);
			setDesignHeight(null);
			setImageFile(null);
			setUploading(false);

			toast.success("New design added successfully!");
			console.log("New design added successfully!");
		} else {
			alert("Please fill in both fields!");
		}
	};

	const handleUpdateDesign = async () => {
		if (!design || !selectedDesignGuideline) {
			toast.error("A design and guideline must be selected to update.");
			return;
		}

		try {
			setUploading(true);

			let imageUrl = design.image_url; // Default to the existing image URL

			// If a new image file is provided, upload it and get the new URL
			if (imageFile) {
				const uploadResult = await uploadImage(imageFile);
				if (uploadResult?.publicUrl) {
					imageUrl = uploadResult.publicUrl;
				} else {
					// Handle potential upload failure
					toast.error("Failed to upload new image. Update cancelled.");
					setUploading(false);
					return;
				}
			}

			const updatedDesignItem: DesignView = {
				design_id: design.design_id,
				design_guideline: selectedDesignGuideline.design_guideline,
				design_name: designName,
				design_description: selectedDesignGuideline.design_description,
				image_url: imageUrl,
				height: designHeight,
				width: designWidth,
				store_code: storeCode,
				notes: design.notes
			};

			await updateDesign(updatedDesignItem);

			// Update the design in the local state/store
			const updatedList = designList.map((d) =>
				d.design_id === updatedDesignItem.design_id ? updatedDesignItem : d
			);
			setDesignList(updatedList);
			setDesign(updatedDesignItem); // Update the currently selected design in parent
			setQuery({designId: updatedDesignItem.design_id, page: 1, pageSize: 20})

			toast.success("Design updated successfully!");
		} catch (error) {
			const err = error as Error;
			console.error("Error updating design:", err);
			toast.error(`Failed to update design: ${err.message}`);
		} finally {
			setUploading(false);
			setImageFile(null); // Clear the file input after update
		}
	};

	const handleDeleteDesign = async () => {
		if (!design) {
			toast.error("No design selected to delete.");
			return;
		}

		if (
			window.confirm(
				"Are you sure you want to delete this design? This cannot be undone."
			)
		) {
			try {
				setUploading(true);
				const response = await fetch(
					`/api/add_design_items?id=${design.design_id}`,
					{
						method: "DELETE",
					}
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.message || "Failed to delete design");
				}

				// Update local state
				const updatedList = designList.filter(
					(d) => d.design_id !== design.design_id
				);
				setDesignList(updatedList);
				setQuery({ designId: null, page: 1, pageSize: 20 }); // Clear the current design

				toast.success("Design deleted successfully!");
			} catch (error) {
				const err = error as Error;
				console.error("Error deleting design:", err);
				toast.error(`Failed to delete design: ${err.message}`);
			} finally {
				setUploading(false);
				setSelectedDesignGuideline(null);
				setImageFile(null)
				setDesignName("")
				setDesignWidth(null)
				setDesignHeight(null)
				setDesign(null)
			}
		}
	};

	const handleSelectDesign = () => {
		setQuery({designId: design?.design_id, page: 1, pageSize: query.pageSize})
	}

	// Handle selecting an existing design
	const handleSelectExistingDesign = (design_ID: string) => {
		const selectedDesign = designList?.find(
			(item) => item.design_id === design_ID
		);
		if (selectedDesign) {
			setDesign(selectedDesign);
		}
	};

	// Handle selecting a design guideline from dropdown
	const handleSelectDesignGuideline = (guideline: string) => {
		const selectedGuideline = designGuidelinesList?.find(
			(item) => item.design_guideline === guideline
		);
		if (selectedGuideline) {
			setSelectedDesignGuideline(selectedGuideline);
		}
	};

	return (
		<div className="flex flex-col gap-4 p-6 bg-white rounded-lg shadow-md w-full max-w-lg border border-gray-200">
			<h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
				Add or Select a Design
			</h2>

			{/* Dropdown to Select an Existing Design */}
			<div>
				<label
					htmlFor="existingDesign"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Select Existing Design:
				</label>
				<select
					id="existingDesign"
					className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
					onChange={(e) => handleSelectExistingDesign(e.target.value)}
					value={design ? design.design_id : ""}
				>
					<option
						value=""
						disabled
						hidden
					>
						-- Your Designs --
					</option>
					{designList?.map((item) => {
						return (
							<option
								key={item.design_id}
								value={item.design_id}
								className="text-black"
							>
								{item.design_name}
							</option>
						);
					})}
				</select>
			</div>

			{/* Input for Design Guideline */}
			<div>
				<label
					htmlFor="designGuideline"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Select Design Guideline:
				</label>
				<div className="flex items-center gap-2">
					<select
						id="designGuideline"
						className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
						onChange={(e) => handleSelectDesignGuideline(e.target.value)}
						value={selectedDesignGuideline?.design_guideline || ""}
					>
						<option
							value=""
							disabled
							hidden
						>
							-- Design Guidelines --
						</option>
						{designGuidelinesList?.map((item) => {
							return (
								<option
									key={item.design_guideline}
									value={item.design_guideline}
									className="text-black"
								>
									{item.design_guideline}
								</option>
							);
						})}
					</select>
					{selectedDesignGuideline !== null ? (
						<button
							type="button"
							onClick={() => setIsDesignGuidelineModalOpen(true)}
							disabled={!selectedDesignGuideline}
							className="p-2.5 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
							aria-label="View design guideline details"
						>
							<FaEye className="text-gray-600" />
						</button>
					) : null}
				</div>
			</div>

			{/* Input for Design Name */}
			<div>
				<label
					htmlFor="designName"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Design Name:
				</label>
				<input
					id="designName"
					className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
					value={designName}
					type="text"
					onChange={(e) => setDesignName(e.target.value)}
				/>
			</div>

			{/* File Input for Image */}
			<div>
				<label
					htmlFor="designImage"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Design Image:
				</label>
				<div className="flex flex-row items-center gap-2">
					<input
						id="designImage"
						className="flex-grow w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
						type="file"
						accept="image/*"
						ref={inputRef}
						onChange={(e) =>
							setImageFile(e.target.files ? e.target.files[0] : null)
						}
					/>
					{design && (
						<button
							type="button"
							onClick={() => setIsDesignModalOpen(true)}
							disabled={!selectedDesignGuideline}
							className="p-2.5 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors"
							aria-label="View design guideline details"
						>
							<FaEye className="text-gray-600" />
						</button>
					)}
				</div>
			</div>

			{/* Width Input */}
			<div>
				<label
					htmlFor="designWidth"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Design Width (cm):
				</label>
				<input
					id="designWidth"
					className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
					value={designWidth ? designWidth : 7}
					type={"number"}
					onChange={(e) => setDesignWidth(Number(e.target.value))}
				/>
			</div>

			{/* Height Input */}
			<div>
				<label
					htmlFor="designHeight"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Design Height (cm):
				</label>
				<input
					id="designHeight"
					className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-black"
					value={designHeight ? designHeight : 7}
					type={"number"}
					onChange={(e) => setDesignHeight(Number(e.target.value))}
				/>
			</div>

			{/* Button to Add New Design */}
			<div className="mt-6">
				{!uploading ? (
					<div className="flex gap-4">
						{design !== null ? (
							<>
								<button
									onClick={handleUpdateDesign}
									className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
								>
									Update Design
								</button>
								<button
									onClick={handleDeleteDesign}
									className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
								>
									Delete Design
								</button>
								<button
									onClick={handleSelectDesign}
									className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
								>
									Go to Design
								</button>
							</>
						) : (
							<button
								className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
								onClick={handleAddNewDesign}
							>
								Add Design
							</button>
						)}
					</div>
				) : (
					<button
						className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-400 cursor-not-allowed"
						disabled={true}
					>
						<FaSpinner className="animate-spin mr-2" />
						Processing...
					</button>
				)}
			</div>
			<ImageModal
				isOpen={isDesignGuidelineModalOpen}
				onClose={() => setIsDesignGuidelineModalOpen(false)}
				item={selectedDesignGuideline}
			/>
			<ImageModal
				isOpen={isDesignModalOpen}
				onClose={() => setIsDesignModalOpen(false)}
				item={design}
			/>
		</div>
	);
};

export default AddNewDesign;
