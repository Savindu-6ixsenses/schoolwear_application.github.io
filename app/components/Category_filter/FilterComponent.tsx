import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { MultiSelect, Option } from "react-multi-select-component";

const FilterComponent = () => {
    const router = useRouter() 
	const categories = [
		{ label: "Adult", value: "adult" },
		{ label: "Men", value: "men" },
		{ label: "Women", value: "women" },
		{ label: "Youth", value: "youth" },
		{ label: "Accessories", value: "accessories" },
	];
	const [selectedCategories, setSelectedCategories] = useState<Option[]>([]);
	const searchParams = useSearchParams();

    const handleCategorySelect = (selectedCategories: Option[]) => {
        setSelectedCategories(selectedCategories);
    
        // Create a new URLSearchParams object from the current searchParams
        const params = new URLSearchParams(searchParams.toString());
    
        // Remove existing "category" params
        params.delete("category");
    
        // Append the new selected categories
        selectedCategories.forEach((category) => {
          params.append("category", category.value);
        });
    
        // Update the URL with the new query parameters
        router.push(`?${params.toString()}`);
      };

	return (
		<div className="flex flex-row gap-4">
			<div>
				<h3>Category</h3>
				<MultiSelect
					className="w-52"
					options={categories}
					value={selectedCategories}
					onChange={handleCategorySelect}
					labelledBy="Select"
				/>
			</div>
			{/* <div>
				<h3>Category</h3>
				<select className="mt-1 w-36 h-10">
					<option value="All">All</option>
					{categories &&
						categories.map((category) => (
							<option
								key={category}
								value={category}
							>
								{category}
							</option>
						))}
				</select>
			</div>
			<div>
				<h3>Category</h3>
				<select className="mt-1 w-36 h-10">
					<option value="All">All</option>
					{categories &&
						categories.map((category) => (
							<option
								key={category}
								value={category}
							>
								{category}
							</option>
						))}
				</select>
			</div> */}
		</div>
	);
};

export default FilterComponent;
