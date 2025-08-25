import React from "react";
import { DesignGuideline } from "@/types/designs";
import { FaTimes } from "react-icons/fa";

interface DesignGuidelineModalProps {
	isOpen: boolean;
	onClose: () => void;
	guideline: DesignGuideline | null;
}

const DesignGuidelineModal: React.FC<DesignGuidelineModalProps> = ({
	isOpen,
	onClose,
	guideline,
}) => {
	if (!isOpen || !guideline) {
		return null;
	}

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
					{guideline.design_guideline}
				</h3>
				{guideline.reference_image && (
					<div className="mb-4">
						<img
							src={guideline.reference_image}
							alt="Design Guideline Reference"
							className="w-full h-auto rounded-md border"
						/>
					</div>
				)}
				<div>
					<p className="text-sm text-gray-600">
						{guideline.design_description}
					</p>
				</div>
			</div>
		</div>
	);
};

export default DesignGuidelineModal;
