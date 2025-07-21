"use client";

import React, { startTransition, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/ssr_client/client";
import ListItem from "./ListItem";
import { StoreCreationProps } from "@/types/store";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { ImSpinner8 } from "react-icons/im";

const ListPage = () => {
	const [data, setData] = useState<StoreCreationProps[]>([]);
	const [filteredData, setFilteredData] = useState<StoreCreationProps[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			const supabase = createClient();
			const { data, error } = await supabase.from("stores").select("*");

			if (data) {
				setData(data);
				setFilteredData(data);
			}
			if (error) console.error(error);

			setIsLoading(false);
		};
		fetchData();
	}, []);

	useEffect(() => {
		const term = searchTerm.toLowerCase();
		const results = data.filter(
			(item) =>
				item.store_code.toLowerCase().includes(term) ||
				item.store_name.toLowerCase().includes(term)
		);
		setFilteredData(results);
	}, [searchTerm, data]);

	const handleSearch = (query: string) => {
		startTransition(() => {
			setSearchTerm(query);
		});
	};

	return (
		<div className="space-y-4 p-4">
			<div className="relative w-full sm:w-[400px]">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
					<FaMagnifyingGlass />
				</div>
				<input
					type="text"
					placeholder="Search by Store Code or Name..."
					value={searchTerm}
					onChange={(e) => handleSearch(e.target.value)}
					className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
				/>
			</div>

			{isLoading ? (
				<div className="flex justify-center items-center mt-10">
					<ImSpinner8 className="animate-spin text-3xl text-gray-500" />
				</div>
			) : filteredData.length > 0 ? (
				filteredData.map((item) => (
					<ListItem key={item.store_code} item={item} />
				))
			) : (
				<div className="text-center text-gray-500 mt-10">
					No stores found.
				</div>
			)}
		</div>
	);
};

export default ListPage;
