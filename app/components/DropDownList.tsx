"use client";

import React from "react";
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownSection,
	DropdownItem,
	Button,
} from "@nextui-org/react";
import { DesignItemProps } from "@/types/store";
import type { Selection } from "@nextui-org/react";

interface DesignItemsListProps {
	designItems: DesignItemProps[];
	setCurrentDesign: ({
		image,
		designId,
	}: {
		image: string;
		designId: string;
	}) => void;
}

const DropDownList: React.FC<DesignItemsListProps> = ({
	designItems,
	setCurrentDesign,
}) => {
	const [selectedValue, setSelectedValue] = React.useState("Select Design");

	const handleSelection = (selected: Selection) => {
		const selectedItem = designItems.find(
			(item) => item.Design_Id === Array.from(selected)[0]
		);
		if (selectedItem) {
			setSelectedValue(selectedItem.Design_Guideline);
			setCurrentDesign({
				image: selectedItem.Image_URL,
				designId: selectedItem.Design_Id,
			});
		}
		console.log(selectedItem);
	};

	return (
		<Dropdown>
			<DropdownTrigger>
				<Button
					color="primary"
					variant="bordered"
					className="capitalize"
				>
					{selectedValue}
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				aria-label="Selected Design"
				color="primary"
				selectionMode="single"
				selectedKeys={new Set([selectedValue])}
				onSelectionChange={handleSelection}
				variant="bordered"
			>
				{designItems.map((item) => (
					<DropdownItem
						key={item.Design_Id}
						title={item.Design_Guideline}
					>
						{item.Design_Guideline}
					</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
};

export default DropDownList;
