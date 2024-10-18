"use client";

import React, { useState } from "react";
import { FaFilter } from "react-icons/fa";
import SingleRecord from "../components/SingleRecord";

const ProductPage = () => {
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	return (
		<div className="w-full min-h-screen bg-[#F6F6F6] p-4">
			<div className="bg-white border border-gray-300 p-4 rounded-lg shadow-md flex items-center space-x-4 text-black">
				<div className="flex items-center space-x-2">
					<input
						type="text"
						className="border border-gray-300 rounded-md p-2"
						value="BRS | Blair Ridge P.S | Required on 02/10/2024"
						readOnly
					/>
					<button className="p-2 border border-gray-400 rounded-md hover:bg-gray-200">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</button>
				</div>

				<div className="flex items-center space-x-2">
					<div className="p-2 border border-gray-300 rounded-md flex items-center space-x-2">
						<span className="text-black">Design 01</span>
						<div className="flex items-center justify-center bg-gray-200 rounded-full w-10 h-10">
							Logo
						</div>
					</div>
					<input
						type="text"
						className="border border-gray-300 rounded-md p-2 text-black"
						value="F-FF"
						readOnly
					/>
				</div>
			</div>

			<div className="flex flex-row justify-between">
				{/* Tabs Section */}
				<div className="mt-4 flex space-x-4 text-black">
					{["Adult", "Men", "Women", "Youth", "Accessories"].map((category) => (
						<button
							key={category}
							className="py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-100"
						>
							{category}
						</button>
					))}

					{/* Filter Icon */}
					<button
						onClick={() => setIsFilterOpen(!isFilterOpen)}
						className="py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
					>
						<FaFilter className="mr-2" />
						Filter
					</button>
				</div>
				{/* Generate PL button */}
				<button className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md align-end hover:bg-blue-600">
					Generate PL
				</button>
			</div>
			{/* Filter Dropdown */}
			{isFilterOpen && (
				<div className="relative mt-4">
					<div className="absolute right-0 top-0 w-64 bg-gray-800 text-white rounded-lg p-4 shadow-lg">
						<div className="mb-4">
							<p className="font-bold">Brand</p>
							{["ATC", "Athletic Knit", "Champion", "Gildan"].map((brand) => (
								<div
									key={brand}
									className="flex items-center space-x-2"
								>
									<input
										type="checkbox"
										className="form-checkbox"
									/>
									<label>{brand}</label>
								</div>
							))}
						</div>
						<div>
							<p className="font-bold">Choose Your Size</p>
							{[
								"2X-Large",
								"3X-Large",
								"Large",
								"Medium",
								"Small",
								"X-Large",
							].map((size) => (
								<div
									key={size}
									className="flex items-center space-x-2"
								>
									<input
										type="checkbox"
										className="form-checkbox"
									/>
									<label>{size}</label>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Product Section */}
			<div className="mt-4 bg-gray-200 w-full h-[400px] flex items-center justify-center">
				{/* Placeholder for product images */}
				<SingleRecord />
			</div>
			<div className="flex flex-row justify-between">
				<div className="border-2 border-gray-600 w-[177px] h-[40px] mt-5 ml-5 p-2 text-black text-center bg-green-500 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-green-300 active:bg-green-700">
					&lt;Previous
				</div>
				<div className="border-2 border-gray-600 w-[177px] h-[40px] mt-5 ml-5 p-2 text-black text-center bg-green-500 rounded-lg cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-green-300 active:bg-green-700">
					Next&gt;
				</div>
			</div>
		</div>
	);
};

export default ProductPage;
