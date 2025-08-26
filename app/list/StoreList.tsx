"use client";

import React, { useState, useEffect, useTransition } from "react";
import ListItem from "./ListItem";
import { StoreSummary } from "./page";
import { FaMagnifyingGlass } from "react-icons/fa6";

interface StoreListProps {
	initialStores: StoreSummary[];
}

const StoreList: React.FC<StoreListProps> = ({ initialStores }) => {
	const [filteredData, setFilteredData] =
		useState<StoreSummary[]>(initialStores);
	const [searchTerm, setSearchTerm] = useState("");
	const [isPending, startTransition] = useTransition();

	useEffect(() => {
		startTransition(() => {
			if (searchTerm.trim() === "") {
				setFilteredData(initialStores);
				return;
			}
			const term = searchTerm.toLowerCase();
			const results = initialStores.filter(
				(item) =>
					item.store_code.toLowerCase().includes(term) ||
					item.store_name.toLowerCase().includes(term)
			);
			setFilteredData(results);
		});
	}, [searchTerm, initialStores]);

	return (
		<div className="space-y-4">
			<div className="relative w-full sm:w-[400px]">
				<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
					<FaMagnifyingGlass />
				</div>
				<input
					type="text"
					placeholder="Search by Store Code or Name..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300"
				/>
			</div>

			{filteredData.length > 0 ? (
				filteredData.map((item) => (
					<ListItem
						key={item.store_code}
						item={item}
					/>
				))
			) : (
				<div className="text-center text-gray-500 mt-10">
					No stores found matching your search.
				</div>
			)}
            {isPending && (
                <div className="text-center text-gray-500 mt-4">Updating results...</div>
            )}
		</div>
	);
};

export default StoreList;
