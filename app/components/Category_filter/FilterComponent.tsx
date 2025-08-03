import { ProductsQuery } from "@/types/products";
import { useState } from "react";
import { MultiSelect, Option } from "react-multi-select-component";

const FilterComponent = ({
	query,
	setQuery,
}: {
	query: ProductsQuery;
	setQuery: (next: Partial<ProductsQuery>) => void;
}) => {
	const categories = [
		{ label: "Adult", value: "Adult" },
		{ label: "Men", value: "Men" },
		{ label: "Women", value: "Women" },
		{ label: "Youth", value: "Youth" },
		{ label: "Accessories", value: "Accessories" },
	];

	// ✅ Convert preSelectedCategories to Option[] format
	const initialSelectedCategories: Option[] = query.categories
		.map((cat) => categories.find((option) => option.value === cat))
		.filter((option): option is Option => option !== undefined); // Filter out undefined values

	const [selectedCategories, setSelectedCategories] = useState<Option[]>(
		initialSelectedCategories
	);

	const handleCategorySelect = (selectedCategories: Option[]) => {
		setSelectedCategories(selectedCategories);

		const selectedValues = selectedCategories.map((cat) => cat.value);

		setQuery({
			categories: selectedValues,
			page: 1, // Reset to first page on category change
		})
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
		</div>
	);
};

export default FilterComponent;
