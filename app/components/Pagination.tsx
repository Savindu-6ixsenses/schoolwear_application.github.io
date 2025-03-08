import React from "react";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	currentPage,
	totalPages,
	onPageChange,
}) => {
	const handlePrevious = () => {
		if (currentPage > 1) {
			onPageChange(currentPage - 1);
		}
	};

	const handleNext = () => {
		if (currentPage < totalPages) {
			onPageChange(currentPage + 1);
		}
	};

	const handleLast = () => {
		if (currentPage < totalPages) {
			onPageChange(totalPages);
		}
	};
	const handleFirst = () => {
		if (currentPage > 1) {
			onPageChange(1);
		}
	};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emptyPageNumbers = (pageNumbers : any[]) => {
    while ( pageNumbers.length > 0) {
      pageNumbers.length = 0; 
    }

  }
    

	const renderPageNumbers = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pageNumbers: any[] = [];
		if (totalPages <= 10) {
      emptyPageNumbers(pageNumbers);
			for (let i = 1; i <= totalPages + 1; i++) {
				pageNumbers.push(
					<button
						key={i}
						onClick={() => onPageChange(i)}
						className={`px-3 py-2 mx-1 border rounded-md ${
							i === currentPage
								? "bg-blue-500 text-white border-blue-500"
								: "border-gray-600 hover:bg-gray-200 text-black"
						}`}
					>
						{i}
					</button>
				);
			}
		} else {
			const firstPages = 4;
			const lastPages = totalPages - 4;

			if (currentPage <= firstPages) {
        emptyPageNumbers(pageNumbers);
        console.log("Current page is in First")
				for (let i = 1; i <= firstPages + 1; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
				pageNumbers.push(
					<button
						className="px-3 py-2 mx-1 border rounded-md
            border-gray-600 hover:bg-gray-200 text-black"
					>
						..
					</button>
				);
				for (let i = lastPages + 2; i <= totalPages; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
			} else if (currentPage > lastPages) {
        emptyPageNumbers(pageNumbers);
        console.log("Current page is in last")
				for (let i = 1; i <= 2; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
				pageNumbers.push(
					<button
						className="px-3 py-2 mx-1 border rounded-md
            border-gray-600 hover:bg-gray-200 text-black"
					>
						..
					</button>
				);
				for (let i = lastPages; i <= totalPages; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
			} else if (currentPage > firstPages && currentPage <= lastPages) {
        emptyPageNumbers(pageNumbers);
        console.log("Current page is in Middle")
				for (let i = 1; i <= 2; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
				pageNumbers.push(
					<button
						className="px-3 py-2 mx-1 border rounded-md
            border-gray-600 hover:bg-gray-200 text-black"
					>
						..
					</button>
				);
				for (let i = currentPage - 1; i <= currentPage + 2; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
        pageNumbers.push(
					<button
						className="px-3 py-2 mx-1 border rounded-md
            border-gray-600 hover:bg-gray-200 text-black"
					>
						..
					</button>
				);
        for (let i = (totalPages-1); i <= totalPages; i++) {
					pageNumbers.push(
						<button
							key={i}
							onClick={() => onPageChange(i)}
							className={`px-3 py-2 mx-1 border rounded-md ${
								i === currentPage
									? "bg-blue-500 text-white border-blue-500"
									: "border-gray-600 hover:bg-gray-200 text-black"
							}`}
						>
							{i}
						</button>
					);
				}
			}
		}
		return pageNumbers;
	};

  // TODO: Add debounce effect here to these buttons
	return (
		<div className="flex justify-center items-center space-x-2 mt-4">
			<button
				onClick={handleFirst}
				disabled={currentPage === 1}
				className={`px-4 py-2 border rounded-md ${
					currentPage === 1
						? "text-gray-400 border-gray-300 cursor-not-allowed"
						: "text-blue-500 border-blue-500 hover:bg-blue-100"
				}`}
			>
				First Page
			</button>
			<button
				onClick={handlePrevious}
				disabled={currentPage === 1}
				className={`px-4 py-2 border rounded-md ${
					currentPage === 1
						? "text-gray-400 border-gray-300 cursor-not-allowed"
						: "text-blue-500 border-blue-500 hover:bg-blue-100"
				}`}
			>
				Previous
			</button>
			<div className="flex space-x-1">{renderPageNumbers()}</div>
			<button
				onClick={handleNext}
				disabled={currentPage === totalPages}
				className={`px-4 py-2 border rounded-md ${
					currentPage === totalPages
						? "text-gray-400 border-gray-300 cursor-not-allowed"
						: "text-blue-500 border-blue-500 hover:bg-blue-100"
				}`}
			>
				Next
			</button>
			<button
				onClick={handleLast}
				disabled={currentPage === totalPages}
				className={`px-4 py-2 border rounded-md ${
					currentPage === totalPages
						? "text-gray-400 border-gray-300 cursor-not-allowed"
						: "text-blue-500 border-blue-500 hover:bg-blue-100"
				}`}
			>
				Last Page
			</button>
		</div>
	);
};

export default Pagination;
