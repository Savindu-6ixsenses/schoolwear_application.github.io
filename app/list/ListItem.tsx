"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaEdit, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { StoreSummary } from "./page";

interface ListItemProps {
	item: StoreSummary;
}

// Change the status button color
const getStatusColor = (status: string) => {
	switch (status) {
		case "Pending":
			return "bg-yellow-500";
		case "Approved":
			return "bg-green-500";
		case "Rejected":
			return "bg-red-500";
		default:
			return "bg-gray-500";
	}
};

const ListItem: React.FC<ListItemProps> = ({ item }) => {
	const router = useRouter();
	const [isExpanded, setIsExpanded] = useState(false);

	const handleEditClick = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent triggering the expand/collapse
		router.push(`/${item.store_code}`);
	};

	const statusColor = getStatusColor(item.status);

	return (
		<div className="border-2 border-gray-200 rounded-lg bg-white shadow-sm transition-all duration-300">
			{/* Collapsed View */}
			<div
				className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
				onClick={() => setIsExpanded(!isExpanded)}
			>
				{/* Left side info */}
				<div className="flex items-center gap-4 flex-wrap">
					<span className="text-blue-600 font-bold min-w-[80px]">
						{item.store_code}
					</span>
					<span className="text-gray-800 font-medium">{item.store_name}</span>
					<div className="flex gap-4 text-sm text-gray-600">
						<span>
							Designs: <span className="font-semibold">{item.total_designs}</span>
						</span>
						<span>
							Products:{" "}
							<span className="font-semibold">{item.total_products}</span>
						</span>
					</div>
				</div>

				{/* Right side actions */}
				<div className="flex items-center gap-4">
					<span
						className={`${statusColor} text-white px-3 py-1 rounded-full text-xs font-semibold`}
					>
						{item.status}
					</span>
					<button
						onClick={handleEditClick}
						className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
					>
						<FaEdit />
						<span>Edit</span>
					</button>
					<button className="p-2 rounded-full hover:bg-gray-200">
						{isExpanded ? <FaChevronUp /> : <FaChevronDown />}
					</button>
				</div>
			</div>

			{/* Expanded View */}
			{isExpanded && (
				<div className="p-4 border-t border-gray-200 bg-gray-50">
					<h4 className="font-semibold text-gray-700 mb-2">Design Details</h4>
					{item.designs.length > 0 ? (
						<div className="space-y-2">
							{item.designs.map((design, index) => (
								<div
									key={design.design_id || index}
									className="grid grid-cols-3 gap-4 p-2 bg-white rounded border"
								>
									<div>
										<span className="text-xs text-gray-500">Design ID</span>
										<p className="font-medium text-gray-800">
											{design.design_id}
										</p>
									</div>
									<div>
										<span className="text-xs text-gray-500">Products</span>
										<p className="font-medium text-gray-800">
											{design.product_count}
										</p>
									</div>
									<div>
										<span className="text-xs text-gray-500">Categories</span>
										<p
											className="font-medium text-gray-800 text-sm truncate"
											title={design.categories || ""}
										>
											{design.categories || "N/A"}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-gray-500">
							No designs have been added to this store yet.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

export default ListItem;

