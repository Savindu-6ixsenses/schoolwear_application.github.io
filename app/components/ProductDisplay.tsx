"use client";

import { StoreProduct } from "@/types/products";
import { StoreCreationProps } from "@/types/store";
import { useRouter, useSearchParams } from "next/navigation";
import React, { startTransition, useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import { generate_pl, get_products_list } from "../[store_code]/actions";
import AddNewDesign from "./AddNewDesign";
import FilterComponent from "./Category_filter/FilterComponent";
import CreateStore from "./CreateStore";
import Search from "./Search";
import SingleRecord from "./SingleRecord";
import Pagination from "./Pagination";
import PageSize from "./PageSize";

interface ProductDisplayProps {
	store: StoreCreationProps | null;
}
const ProductDisplay: React.FC<ProductDisplayProps> = ({ store }) => {
	// TODO: Temporary total pages
	const [totalPages,setTotalPages] = useState<number>(10);
	const [imageUrl, setImageUrl] = useState<string>(
		"https://via.placeholder.com/150"
	);

	const [productData, setProductData] = useState<StoreProduct[]>([]);
	const [designGuideline, setDesignGuideline] = useState<string>("");
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [designItems, setDesignItems] = useState<any[]>([]);
	const searchParams = useSearchParams();
	const router = useRouter();
	const query = searchParams.get("q") || "";
	const [designId, setDesignId] = useState<string>(
		searchParams.get("designId") || "0"
	);
	const page_size = searchParams.get("page_size") ? parseInt(searchParams.get("page_size") as string, 10) : 20;
	const page = searchParams.get("page") ? parseInt(searchParams.get("page") as string, 10) : 1;
	const [currentPage, setCurrentPage] = useState<number>(page);
	const [currentPageSize, setCurrentPageSize] = useState<number>(page_size);
	const categories = searchParams.getAll("category");

	// Fetch design items from Supabase
	const fetchDesignItems = async () => {
		const response = await fetch("/api/get_design_items", {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const design_items = await response.json();
		console.log("Design Items", design_items.designItems);
		return design_items.designItems;
	};

	// TODO: Same as the handleSearch function. Check with it.
	const fetchFilteredProducts = async () => {
		try {
			// Construct base URL
			let url = `/api/search_products?store_code=${store?.store_code}&design_id=${designId}&page=${currentPage}&page_size=${currentPageSize}`;

			// Add query and categories if they exist
			if (query) url += `&q=${query}`;
			if (categories.length > 0) url += `&categories=${categories.join(",")}`;

			const response = await fetch(url);
			const response_data:{products: StoreProduct[],totalPages: number} = await response.json();
			const products: StoreProduct[] = response_data.products;
			const totalPages: number = response_data.totalPages;
			setTotalPages(totalPages);
			setProductData(products || []);
		} catch (error) {
			console.error("Error fetching products:", error);
		} finally {
			// TODO: Add something
		}
	};

	// Function to handle search queries
	// TODO: Add Debounce Effect for this.
	const handleSearch = (query: string) => {
		console.log("Handle search invoked");
		startTransition(async () => {
			// Construct base URL
			let url = `/api/search_products?store_code=${store?.store_code}&design_id=${designId}&page=${currentPage}&page_size=${currentPageSize}`;

			// Add query and categories if they exist
			if (query) url += `&q=${query}`;
			if (categories.length > 0) url += `&categories=${categories.join(",")}`;

			const response = await fetch(url);
			const response_data:{products: StoreProduct[],totalPages: number} = await response.json();
			const products: StoreProduct[] = response_data.products;
			const totalPages: number = response_data.totalPages;
			setTotalPages(totalPages);
			setProductData(products || []);
		});
	};

	const handleGeneratePL = async () => {
		const data = await generate_pl(store ? store.store_code : "");
		console.log(data);
		router.push("/list");
	};

	const handlePageSizeChange = (page_size: number) => {
		setCurrentPageSize(page_size);
		
		const params = new URLSearchParams(searchParams);
		params.delete("page_size");
		params.set("page_size", page_size.toString());
		
		router.push(`?${params.toString()}`);
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		
		const params = new URLSearchParams(searchParams);
		params.delete("page");
		params.set("page", page.toString());
		
		router.push(`?${params.toString()}`);
	};

	
	const changeDesign = () => {
		setDesignGuideline("");
		setDesignId("0");
		// Update the URL params
		const params = new URLSearchParams(searchParams);
		params.delete("designId");
		params.delete("page");
		params.delete("page_size");
		
		router.push(`?${params.toString()}`);
	};
	
	const get_products_list_by_design = async (
		design_id: string,
		store_code: string
	) => {
		const data: [StoreProduct[],number] = await get_products_list(store_code, design_id,currentPageSize,currentPage);
		setTotalPages(data[1])
		setProductData(data[0] || []);
		productData.map((item) => console.log(`Product: ${item.productName}`));
	};

	const setCurrentDesign = ({
		image,
		designId,
		Design_Guideline,
	}: {
		image: string;
		designId: string;
		Design_Guideline: string;
	}) => {
		setImageUrl(`${image}`);
		setDesignId(`${designId}`);
		setDesignGuideline(`${Design_Guideline}`);
		get_products_list_by_design(designId, store ? store.store_code : "");

		// Update the URL params
		const params = new URLSearchParams(searchParams);
		params.set("designId", designId);
		params.set("page", currentPage.toString());
		params.set("page_size", currentPageSize.toString());
		router.push(`?${params.toString()}`);
	};

	// Make sure state is updated before making the API call
	useEffect(() => {
		if (currentPageSize && currentPage) {
			fetchFilteredProducts();
		}
	}, [currentPageSize, currentPage]); // Fetch products on page change
	
	useEffect(() => {
		fetchDesignItems()
			.then((data) => {
				setDesignItems(data);
			})
			.catch((error) => {
				console.error("Error fetching design items:", error);
			});
	}, []); // Fetch design items on mount

	useEffect(() => {
		if (designId !== "0" && designItems.length > 0) {
			const selectedDesign = designItems.find(
				(item) => item.Design_Id === designId
			);
			console.log("Selected Design", selectedDesign);

			if (selectedDesign) {
				setDesignGuideline(selectedDesign.Design_Guideline);
			}

			if (query !== "" && categories.length > 0) {
				console.log("Query and Categories", query, categories);
				fetchFilteredProducts();
			} else {
				get_products_list_by_design(designId, store ? store.store_code : "");
			}
		}
	}, [designItems]); // Run after designItems are updated

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
						<div className="bg-gray-200 rounded-full w-10 h-10 overflow-hidden flex items-center justify-center">
							<img
								src={`${imageUrl}`}
								alt="Profile"
								className="object-cover w-full h-full"
							/>
						</div>
					</div>
					{designGuideline != "" && (
						<div className="flex flex-row gap-2">
							<div className="border border-gray-300 px-4 py-2 w-20 h-10 flex items-center justify-center rounded ">
								{designGuideline}
							</div>
							<div
								className="px-4 py-2 bg-blue-500 rounded-md text-white hover:bg-blue-200  active:bg-blue-400"
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
					<FilterComponent preSelectedCategories={categories}/>

					<button
						onClick={fetchFilteredProducts}
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
			<div className="mt-4 bg-gray-200 w-full h-[400px] grid grid-cols-1 gap-3 overflow-y-auto items-center justify-center">
				{designId != "0" && ( productData.length > 0 ?
					productData.map((item) => (
						<SingleRecord
							key={item.productId}
							item={item}
							store_code={`${store?.store_code}`}
							design_id={designId ? designId : ""}
						/>
					)): <div className="text-center text-gray-500">No products found</div>)}
				{designId == "0" && (
					<AddNewDesign
						designItems={designItems}
						setDesignItems={setDesignItems}
						setCurrentDesign={setCurrentDesign}
					/>
				)}
			</div>
			<div className="mt-4 flex justify-between">
				<PageSize pageSize={currentPageSize} setPageSize={handlePageSizeChange}/>
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={handlePageChange}
				/>
				<CreateStore
					store={store}
					design_item={designId}
				/>
			</div>
		</div>
	);
};

export default ProductDisplay;
