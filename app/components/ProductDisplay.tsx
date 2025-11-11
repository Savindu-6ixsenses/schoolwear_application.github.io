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
import NotesComponent from "./NotesComponent";

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
	const [note, setNote] = useState<string | null>(null);
	const router = useRouter();

	const { store, category_list, designList, setStore, setCategoryList, setStoreStatus } =
		useStoreState();

	const handleSearch = (q: string) => {
		setQuery({ q, page: 1 });
	};

	const handleGeneratePL = async () => {
		try {
			console.log("Store Status :", store?.status);

			if (store?.status?.toLowerCase() == "approved") {
				toast.error(
					"Product List has already been approved. Cannot generate again."
				);
				return;
			}
			const data = await generate_pl(storeCode ? storeCode : "");

			console.log("Generate PL Data :", data);
			toast.success("Product list generation has started!");
			setStoreStatus("Pending");
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

	const handleReportGenerationClick = () => {
		router.push(`${storeCode}/report`);
	};

	// Reset store state when the component mounts
	useEffect(() => {
		async function syncStoreState() {
			if (storeCode) {
				console.log("→ store_code:", storeCode);
				setStore(storeCode);
				console.log("[Sync] Zustand state updated:");
			}
		}
		syncStoreState();
	}, [storeCode]);

	useEffect(() => {
		if (design) {
			setNote(design.notes);
		}
	}, [design]);

	useEffect(() => {
		if (query.designId && designList.length > 0) {
			const currentDesign = designList.find(
				(d) => d.design_id === query.designId
			);
			if (currentDesign) {
				setDesign(currentDesign);
			}
		}
	}, [query.designId, designList]);

	return (
		<div className="w-full min-h-screen bg-[#F6F6F6] p-4">
			<header className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex items-center justify-between text-black gap-3">
				{/* Left Section: Store Info */}
				<div className="flex items-center gap-3">
					<div className="flex items-baseline gap-2">
						<h2 className="text-xl font-bold text-gray-800">
							{store?.store_name}
						</h2>
						<span className="text-sm font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
							{store?.store_code}
						</span>
					</div>
				</div>

				{/* Middle Section: Design Info */}
				<div className="flex items-center gap-4">
					{design && (
						<>
							<div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
								<span className="text-sm font-medium text-gray-600">
									Design:
								</span>
								<div className="bg-gray-100 rounded-full w-8 h-8 overflow-hidden flex items-center justify-center">
									<Image
										src={design.image_url || ""}
										alt="Design"
										width={32}
										height={32}
										className="object-cover"
									/>
								</div>
								<span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
									{design.design_guideline}
								</span>
							</div>
							<button
								className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 active:bg-gray-800"
								onClick={() => changeDesign()}
							>
								Add New Design
							</button>
						</>
					)}
				</div>

				{/* Right Section: Search */}
				<div className="ml-auto pl-4">
					<Search onSearch={handleSearch} />
				</div>
			</header>

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
						className="mt-4 mr-3 py-2 px-4 bg-blue-500 text-white rounded-md align-end hover:bg-blue-600 disabled:bg-blue-300"
						onClick={() => handleGeneratePL()}
						disabled={store?.status?.toLowerCase() == "approved"}
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
								key={item.sageCode}
								item={item}
								store_code={`${store?.store_code}`}
								design_id={design ? design.design_id : ""}
								designGuideline={design ? design.design_guideline : ""}
								category_list={category_list}
								setCategoryList={setCategoryList}
								storeStatus={store?.status || "Draft"}
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
			<div className="mt-4">
				{design && (
					<NotesComponent
						note={note}
						setNote={setNote}
						storeCode={storeCode}
						design={design}
					/>
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
