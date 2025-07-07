import React, { useState } from "react";
import DateRangePicker from "./Calender/DateRangePicker";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { redirect } from "next/navigation";

interface StoreCreationProps {
	store_name: string;
	account_manager: string;
	main_client_name: string;
	main_client_contact_number: string;
	store_address: string;
	store_code: string;
	start_date: string;
	end_date: string;
	status: string;
}

const NEXT_MONTH = new Date();
NEXT_MONTH.setMonth(NEXT_MONTH.getMonth() + 1);

const SchoolForm = () => {
	const [formData, setFormData] = useState({
		schoolName: "",
		accountManager: "",
		address: "",
		mainClientContact: "",
		mainClientContactNo: "",
		storeCode: "",
	});

	const [dateRange, setDateRange] = useState({
		startDate: new Date(),
		endDate: NEXT_MONTH,
	});

	const schema = z.object({
		schoolName: z.string().min(1, "School name is required"),
		accountManager: z.string().email("Invalid email address"),
		address: z.string().min(1, "Address is required"),
		mainClientContact: z.string().min(1, "Contact name is required"),
		mainClientContactNo: z
			.string()
			.regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
		storeCode: z
			.string()
			.min(2, "Store code is required")
			.regex(/^[A-Z0-9\-]+$/, "Store code must be alphanumeric or hyphen"),
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleDateChange = (newDateRange: {
		startDate: Date;
		endDate: Date;
	}) => {
		setDateRange(newDateRange);
	};

	const handleSubmit = async () => {
		try {
			// Validate with zod
			const validated = schema.parse(formData);

			const storeCreationBody: StoreCreationProps = {
				store_name: validated.schoolName,
				account_manager: validated.accountManager,
				main_client_name: validated.mainClientContact,
				main_client_contact_number: validated.mainClientContactNo,
				store_address: validated.address,
				store_code: validated.storeCode,
				start_date: dateRange.startDate.toISOString(),
				end_date: dateRange.endDate.toISOString(),
				status: "Draft",
			};

			const response = await fetch("/api/store_creation", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(storeCreationBody),
			});

			if (!response.ok) {
				const errorText = await response.text();

				// Handle known constraint error
				if (
					errorText.includes("duplicate key value violates unique constraint")
				) {
					toast.error("Store code already exists. Please choose another.");
				} else {
					toast.error("Error creating store: " + errorText);
				}

				throw new Error(errorText);
			}

			toast.success("Store Created Successfully!");
			// Redirect to the new store page
			redirect(`/${storeCreationBody.store_code}`);
		} catch (error: unknown) {
			if (error instanceof z.ZodError) {
				toast.error(`Error: ${error.errors[0].message}`);
			} else if (error instanceof Error) {
				console.error(error.message || "Unknown error occurred");
			} else {
				toast.error("Unexpected error");
			}
		}
	};

	return (
		<div>
			<div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
				<h1 className="text-2xl font-semibold text-gray-800 mb-8 flex justify-center">
					Create a Web Store
				</h1>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Left Column - Form Fields */}
					<div className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Name of School/Team
							</label>
							<input
								type="text"
								name="schoolName"
								value={formData.schoolName}
								onChange={handleChange}
								placeholder="Blair Ridge P.S"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Account Manager (email)
							</label>
							<input
								type="email"
								name="accountManager"
								value={formData.accountManager}
								onChange={handleChange}
								placeholder="jeff@marchants.com"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								School/Organization Address
							</label>
							<input
								type="text"
								name="address"
								value={formData.address}
								onChange={handleChange}
								placeholder="100 Blackfriar Ave, Whitby"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Main Client Contact
							</label>
							<input
								type="text"
								name="mainClientContact"
								value={formData.mainClientContact}
								onChange={handleChange}
								placeholder="Brent Wragg (Principal)"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Client Contact No
							</label>
							<input
								type="text"
								name="mainClientContactNo"
								value={formData.mainClientContactNo}
								onChange={handleChange}
								placeholder="9056201221"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Store Code
							</label>
							<input
								type="text"
								name="storeCode"
								value={formData.storeCode}
								onChange={handleChange}
								placeholder="BRS"
								className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
							/>
						</div>
					</div>

					{/* Right Column - Date Range Picker */}
					<div className="space-y-6">
						<div>
							<label className="block text-sm font-medium text-blue-600 mb-2">
								Select Store Active Date Range
							</label>
							<DateRangePicker onDateChange={handleDateChange} />
						</div>
					</div>
				</div>

				{/* Submit Button */}
				<div className="mt-8 flex justify-center">
					<button
						onClick={handleSubmit}
						className="px-8 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
					>
						Create the WebStore
					</button>
				</div>
			</div>
		</div>
	);
};

export default SchoolForm;
