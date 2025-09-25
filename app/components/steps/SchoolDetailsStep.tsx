import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormData } from "@/types/store";

interface SchoolDetailsStepProps {
	formData: FormData;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SchoolDetailsStep: React.FC<SchoolDetailsStepProps> = ({
	formData,
	handleChange,
}) => {
	return (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					School Details
				</h2>
				<p className="text-gray-600">Please provide your school information</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="md:col-span-2">
					<Label
						htmlFor="schoolName"
						className="text-sm font-medium text-gray-700"
					>
						School Name *
					</Label>
					<Input
						id="schoolName"
						name="schoolName"
						type="text"
						value={formData.schoolName}
						onChange={handleChange}
						placeholder="Enter school name"
						className="mt-1"
						required
					/>
					<p className="text-xs text-gray-500 mt-1">
						For identification; may be used with address for mailing or
						verification.
					</p>
				</div>

				<div className="md:col-span-2">
					<Label
						htmlFor="streetAddress"
						className="text-sm font-medium text-gray-700"
					>
						Street Address (Line 1) *
					</Label>
					<Input
						id="streetAddress"
						name="streetAddress"
						type="text"
						value={formData.streetAddress}
						onChange={handleChange}
						placeholder="e.g., 123 Main Street"
						className="mt-1"
						required
					/>
				</div>

				<div className="md:col-span-2">
					<Label
						htmlFor="addressLine2"
						className="text-sm font-medium text-gray-700"
					>
						Address Line 2 (Optional)
					</Label>
					<Input
						id="addressLine2"
						name="addressLine2"
						type="text"
						value={formData.addressLine2}
						onChange={handleChange}
						placeholder="e.g., Building name, Suite, Unit number, PO Box"
						className="mt-1"
					/>
				</div>

				<div className="md:col-span-2">
					<Label
						htmlFor="city"
						className="text-sm font-medium text-gray-700"
					>
						City *
					</Label>
					<Input
						id="city"
						name="city"
						type="text"
						value={formData.city}
						onChange={handleChange}
						placeholder="Enter city"
						className="mt-1"
						required
					/>
				</div>

				<div>
					<Label
						htmlFor="provinceState"
						className="text-sm font-medium text-gray-700"
					>
						Province/State *
					</Label>
					<Input
						id="provinceState"
						name="provinceState"
						type="text"
						value={formData.provinceState}
						onChange={handleChange}
						placeholder="Enter province/state"
						className="mt-1"
						required
					/>
				</div>

				<div>
					<Label
						htmlFor="postalCode"
						className="text-sm font-medium text-gray-700"
					>
						Postal Code / Zip Code *
					</Label>
					<Input
						id="postalCode"
						name="postalCode"
						type="text"
						value={formData.postalCode}
						onChange={handleChange}
						placeholder="Enter postal code"
						className="mt-1"
						required
					/>
				</div>
			</div>
		</div>
	);
};

export default SchoolDetailsStep;
