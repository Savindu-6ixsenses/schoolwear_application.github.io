"use client";

import React, { useState } from "react";
import AddColorForm from "./AddColorForm";
import SingleAddForm from "./SingleAddForm";
import BulkCsvUploader from "./BulkCsvUploader";
import EditProductForm from "./EditProductForm";

/**
 * Hosts the product admin workflows and defaults to the edit tab when a SAGE code
 * is supplied from navigation elsewhere in the app.
 */
export default function ProductsManager(params: {
	sageCode: string | undefined;
}) {
	const [activeTab, setActiveTab] = useState<
		"single" | "bulk" | "color" | "edit"
	>(params.sageCode ? "edit" : "single");

	return (
		<div className="w-full max-w-5xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Products Manager</h1>

			{/* Tabs */}
			<div className="inline-flex rounded-xl bg-gray-100 p-1 mb-6">
				<button
					onClick={() => setActiveTab("single")}
					className={`px-4 py-2 rounded-lg text-sm font-medium ${
						activeTab === "single"
							? "bg-white shadow"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Add Single
				</button>
				<button
					onClick={() => setActiveTab("bulk")}
					className={`px-4 py-2 rounded-lg text-sm font-medium ${
						activeTab === "bulk"
							? "bg-white shadow"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Bulk CSV Upload
				</button>
				<button
					onClick={() => setActiveTab("color")}
					className={`px-4 py-2 rounded-lg text-sm font-medium ${
						activeTab === "color"
							? "bg-white shadow"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Add Color
				</button>
				<button
					onClick={() => setActiveTab("edit")}
					className={`px-4 py-2 rounded-lg text-sm font-medium ${
						activeTab === "edit"
							? "bg-white shadow"
							: "text-gray-600 hover:text-gray-800"
					}`}
				>
					Edit Product
				</button>
			</div>

			{activeTab === "single" && <SingleAddForm />}
			{activeTab === "bulk" && <BulkCsvUploader />}
			{activeTab === "color" && <AddColorForm />}
			{activeTab === "edit" && <EditProductForm sageCode={params.sageCode} />}
		</div>
	);
}
