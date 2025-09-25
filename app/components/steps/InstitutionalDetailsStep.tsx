import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormData } from "@/types/store";

interface InstitutionalDetailsStepProps {
	formData: FormData;
	handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InstitutionalDetailsStep: React.FC<InstitutionalDetailsStepProps> = ({
	formData,
	handleChange,
}) => {
	return (
		<div className="space-y-6 animate-fade-in">
			<div className="text-center mb-8">
				<h2 className="text-2xl font-bold text-gray-900 mb-2">
					Institutional Contact Info
				</h2>
				<p className="text-gray-600">Please provide your contact information</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<Label
						htmlFor="firstName"
						className="text-sm font-medium text-gray-700"
					>
						First Name *
					</Label>
					<Input
						id="firstName"
						name="firstName"
						type="text"
						value={formData.firstName}
						onChange={handleChange}
						placeholder="Enter first name"
						className="mt-1"
						required
					/>
				</div>

				<div>
					<Label
						htmlFor="lastName"
						className="text-sm font-medium text-gray-700"
					>
						Last Name *
					</Label>
					<Input
						id="lastName"
						name="lastName"
						type="text"
						value={formData.lastName}
						onChange={handleChange}
						placeholder="Enter last name"
						className="mt-1"
						required
					/>
				</div>

				<div className="md:col-span-2">
					<Label
						htmlFor="email"
						className="text-sm font-medium text-gray-700"
					>
						Email Address *
					</Label>
					<Input
						id="email"
						name="email"
						type="email"
						value={formData.email}
						onChange={handleChange}
						placeholder="Enter email address"
						className="mt-1"
						required
					/>
				</div>

				<div className="md:col-span-2">
					<Label
						htmlFor="contactNumber"
						className="text-sm font-medium text-gray-700"
					>
						Contact Number *
					</Label>
					<Input
						id="contactNumber"
						name="contactNumber"
						type="tel"
						value={formData.contactNumber}
						onChange={handleChange}
						placeholder="Enter 10-digit phone number"
						className="mt-1"
						maxLength={10}
						required
					/>
					<p className="text-xs text-gray-500 mt-1">
						Please enter a 10-digit phone number
					</p>
				</div>
			</div>
		</div>
	);
};

export default InstitutionalDetailsStep;
