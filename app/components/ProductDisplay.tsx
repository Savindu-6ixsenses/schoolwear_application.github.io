"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import { generate_pl } from "../[store_code]/actions";
import AddNewDesign from "./AddNewDesign";
import FilterComponent from "./Category_filter/FilterComponent";
import Search from "./Search";
import SingleRecord from "./SingleRecord";
import Pagination from "./Pagination";
import PageSize from "./PageSize";
import { useStoreState } from "../store/useStoreState";
import { useProductsQueryState } from "../hooks/useProductsQueryState";
import { useProducts } from "../hooks/useProducts";
import Image from "next/image";
import toast from "react-hot-toast";
import { DesignGuideline, DesignView } from "@/types/designs";

interface ProductDisplayProps {
	storeCode: string;
	designGuideLinesList?: DesignGuideline[];
}
const ProductDisplay: React.FC<ProductDisplayProps> = ({
	storeCode,
	designGuideLinesList,
}) => {
	const { query, setQuery } = useProductsQueryState({
		store_code: storeCode,
	});
	const { data, isLoading, isError } = useProducts(query);

	const productData = data?.products ?? [];
	const totalPages = data?.totalPages ?? 0;

	const [design, setDesign] = useState<DesignView | null>(null);
	const router = useRouter();

	const { store, category_list, setStore, setCategoryList } = useStoreState();

	const handleSearch = (q: string) => {
		setQuery({ q, page: 1 });
	};

	const handleGeneratePL = async () => {
		try {
			const data = await generate_pl(storeCode ? storeCode : "");
			console.log("Generate PL Data :", data);
			toast.success("Product list generation has started!");
			router.push("/list");
		} catch (error) {
			console.error("Failed to generate PL:", error);
			toast.error(
				error instanceof Error ? error.message : "An unknown error occurred."
			);
		}
	};

	const handlePageSizeChange = (page_size: number) => {
		setQuery({ pageSize: page_size });
	};

	const handlePageChange = (page: number) => {
		setQuery({ page });
	};

	const changeDesign = () => {
		setDesign(null);
		setQuery({ designId: null, page: 1, pageSize: 20 });
	};

	// const setCurrentDesign = (currentDesign: DesignView) => {
	// 	setDesign(currentDesign);
	// 	const { design_id: design_Id, design_guideline: Design_Guideline } =
	// 		currentDesign;

	// 	console.log(
	// 		"Current Design ID:",
	// 		design_Id,
	// 		" \nDesign Guideline:",
	// 		Design_Guideline
	// 	);

		// setQuery({
		// 	designId: design_Id,
		// 	page: query.page,
		// });
	// };

	const handleReportGenerationClick = () => {
		router.push(`${storeCode}/report`);
	};

	// Reset store state when the component mounts
	useEffect(() => {
		async function syncStoreState() {
			if (storeCode) {
				setStore(storeCode);
				console.log("[Sync] Zustand state updated:");
				console.log("→ store_code:", store.store_code);
			}
		}
		syncStoreState();
	}, [storeCode]);

	return (
		<div className="w-full min-h-screen bg-[#F6F6F6] p-4">
			<div className="bg-white border border-gray-300 p-4 rounded-lg shadow-md flex items-center justify-between text-black">
				<div className="flex items-center space-x-2">
					<input
						type="text"
						className="border border-gray-300 rounded-md p-2"
						value={`${store?.store_code} | ${store?.store_name}`}
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
						<span className="text-black">Design</span>
						<div className="bg-gray-200 rounded-full w-10 h-10 overflow-hidden flex items-center justify-center object-contain">
							<Image
								src={`${design ? design.image_url : ""}`}
								alt="Profile"
								width={40}
								height={40}
							/>
						</div>
					</div>
					{design?.design_guideline != "" && (
						<div className="flex flex-row gap-2">
							<div className="border border-gray-300 px-4 py-2 w-20 h-10 flex items-center justify-center rounded ">
								{design?.design_guideline}
							</div>
							<div
								className="px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-400  active:bg-blue-500
								hover:cursor-pointer"
								onClick={changeDesign}
							>
								Change Design
							</div>
						</div>
					)}
					<div></div>
				</div>
				<div className="ml-auto">
					<Search onSearch={handleSearch} />
				</div>
			</div>

			<div className="flex flex-row justify-between">
				<div className="mt-4 flex space-x-4 text-black">
					<FilterComponent
						query={query}
						setQuery={setQuery}
					/>

					<button
						onClick={() => setQuery({})}
						className="py-2 px-4 bg-white border border-gray-300 rounded-md hover:bg-gray-100 flex items-center"
					>
						<FaFilter className="mr-2" />
						Filter
					</button>
				</div>
				<div>
					<button
						className="mt-4 mr-3 py-2 px-4 bg-blue-500 text-white rounded-md align-end hover:bg-blue-600"
						onClick={() => handleGeneratePL()}
					>
						Generate PL
					</button>
					<button
						className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md align-end hover:bg-blue-600"
						onClick={() => {
							router.push("/list");
						}}
					>
						Go to List
					</button>
				</div>
			</div>

			{/* Product Section */}
			<div className="mt-4 bg-gray-200 w-full h-[800px] grid grid-cols-1 gap-3 overflow-y-auto items-center justify-center">
				{query.designId !== null &&
					(isLoading ? (
						<div className="text-center text-gray-500">Loading products...</div>
					) : isError ? (
						<div className="text-center text-red-500">
							Error loading products
						</div>
					) : productData.length > 0 ? (
						productData.map((item) => (
							<SingleRecord
								key={item.productId}
								item={item}
								store_code={`${store?.store_code}`}
								design_id={design ? design.design_id : ""}
								designGuideline={design ? design.design_guideline : ""}
								category_list={category_list}
								setCategoryList={setCategoryList}
							/>
						))
					) : (
						<div className="text-center text-gray-500">No products found</div>
					))}
				{query.designId == null && (
				<div className="flex items-center justify-center">
					<AddNewDesign
						designGuidelinesList={designGuideLinesList}
						setDesign={setDesign}
						design={design}
						storeCode={storeCode}
					/>
				</div>
				 )} 
			</div>
			<div className="mt-4 flex justify-between">
				<PageSize
					pageSize={query.pageSize}
					setPageSize={handlePageSizeChange}
				/>
				<Pagination
					currentPage={query.page}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
				<button
					className="mt-4 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
					onClick={handleReportGenerationClick}
				>
					Go to Report
				</button>
			</div>
		</div>
	);
};

export default ProductDisplay;
