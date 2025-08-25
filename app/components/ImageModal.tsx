import React from "react";
import { DesignGuideline, DesignView } from "@/types/designs";
import Image from "next/image"; // Assuming next/image is configured for external URLs
import { FaTimes } from "react-icons/fa";

interface imageModalProps {
	isOpen: boolean;
	onClose: () => void;
	item: DesignGuideline | DesignView | null;
}

interface ModalData {
	header: string;
	description: React.ReactNode;
	imageUrl: string | null;
}

/**
 * A helper function to extract display data from either a DesignGuideline or a DesignView.
 * This standardizes the data for the modal.
 * @param item The design information object.
 * @returns Standardized data for the modal.
 */
const getModalData = (item: DesignGuideline | DesignView): ModalData => {
	// Type guard to check if the item is a DesignView by checking for a unique property.
	if ("design_name" in item) {
		const design = item as DesignView;
		return {
			header: design.design_name,
			description: (
				<>
					<p className="font-semibold text-gray-700">
						{design.design_guideline}
					</p>
					<p className="mt-2 text-sm text-gray-600">
						{design.design_description}
					</p>
				</>
			),
			// Assuming DesignView has a `design_image_url` property
			imageUrl: design.image_url,
		};
	}
	// Otherwise, it's a DesignGuideline
	const guideline = item as DesignGuideline;
	return {
		header: guideline.design_guideline,
		description: (
			<p className="text-sm text-gray-600">{guideline.design_description}</p>
		),
		imageUrl: guideline.reference_image,
	};
};

const ImageModal: React.FC<imageModalProps> = ({
	isOpen,
	onClose,
	item,
}) => {
	if (!isOpen || !item) {
		return null;
	}

	const modalData = getModalData(item);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
			<div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full relative">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
					aria-label="Close modal"
				>
					<FaTimes size={20} />
				</button>
				<h3 className="text-lg font-semibold mb-4 text-gray-800">
					{modalData.header}
				</h3>
				{modalData.imageUrl && (
					<div className="mb-4">
						<Image
							alt="Design Image"
							src={modalData.imageUrl}
							width={400}
							height={300}
							className="w-full h-auto rounded-md border object-contain"
						/>
					</div>
				)}
				<div>{modalData.description}</div>
			</div>
		</div>
	);
};

export default ImageModal;
