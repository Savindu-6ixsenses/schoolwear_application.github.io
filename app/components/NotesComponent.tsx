"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useStoreState } from "../store/useStoreState";
import { DesignView } from "@/types/designs";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface NotesComponentProps {
	note: string | null;
	setNote: React.Dispatch<React.SetStateAction<string | null>>;
	storeCode: string;
	design: DesignView | null;
}

const NotesComponent: React.FC<NotesComponentProps> = ({
	note,
	setNote,
	storeCode,
	design,
}) => {
	const [isSaving, setIsSaving] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isExpanded, setIsExpanded] = useState(false);
	const { initializeDesignItems } = useStoreState();

	useEffect(() => {
		if (design) {
			setIsUpdating(design.notes != null);
		} else {
			setIsUpdating(false);
		}
	}, [design]);

	const handleSaveNote = async () => {
		if (!design || !design.design_id || !storeCode) {
			toast.error("A design must be selected to save a note.");
			return;
		}

		setIsSaving(true);
		console.log(
			"Saving note for design ID:",
			design.design_id,
			"with note:",
			note
		);

		try {
			const endpoint = isUpdating
				? "/api/notes/update_note"
				: "/api/notes/create_note";
			const method = isUpdating ? "PATCH" : "POST";

			const response = await fetch(endpoint, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					note,
					design_id: design.design_id,
					store_code: storeCode,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error ||
						`Failed to ${isUpdating ? "update" : "create"} note.`
				);
			}
			initializeDesignItems(storeCode);
			setIsUpdating(true);

			toast.success(`Note ${isUpdating ? "updated" : "saved"} successfully!`);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred.";
			toast.error(errorMessage);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
			<div
				className="flex justify-between items-center cursor-pointer"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				<h3 className="text-lg font-semibold text-gray-800">
					Notes for Design
				</h3>
				<button className="text-gray-600 hover:text-gray-800">
					{isExpanded ? <FaChevronUp /> : <FaChevronDown />}
				</button>
			</div>
			{isExpanded && (
				<div className="mt-2">
					<textarea
						className="w-full p-2 border border-gray-300 rounded-md text-black disabled:bg-gray-100"
						rows={4}
						value={note || ""}
						onChange={(e) => setNote(e.target.value)}
						placeholder={
							design
								? "Enter any notes for this design..."
								: "Select a design to add notes."
						}
						disabled={!design}
					/>
					<button
						onClick={handleSaveNote}
						disabled={isSaving || !design}
						className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						{isSaving ? "Saving..." : "Save Note"}
					</button>
				</div>
			)}
		</div>
	);
};

export default NotesComponent;
