"use client";

import React, { useState, useEffect, useRef } from "react";
import { z } from "zod";
import toast from "react-hot-toast";
import SchoolDetailsStep from "./steps/SchoolDetailsStep";
import InstitutionalDetailsStep from "./steps/InstitutionalDetailsStep";
import StoreDetailsStep from "./steps/StoreDetailsStep";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreCreationProps } from "@/types/store";
import { useRouter, useSearchParams } from "next/navigation";
import { FormData } from "@/types/store";

const NEXT_MONTH = new Date();
NEXT_MONTH.setMonth(NEXT_MONTH.getMonth() + 1);

const steps = ["School Details", "Contact Details", "Store Details"];

/**
 * Fetches a unique store code from the server.
 * This function is safe to use in Client Components.
 * @param schoolName The name of the school to generate a code for.
 * @returns A promise that resolves to the unique store code.
 */
export async function getUniqueStoreCodeFromServer(
	schoolName: string,
): Promise<string> {
	const response = await fetch("/api/generate-store-code", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ schoolName }),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.message || "Failed to generate store code");
	}
	const data = await response.json();
	return data.storeCode;
}

const schema = z.object({
	schoolName: z.string().min(1, "School name is required"),
	streetAddress: z.string().min(1, "Street address is required"),
	addressLine2: z.string().optional(),
	city: z.string().min(1, "City is required"),
	provinceState: z.string().min(1, "Province/State is required"),
	postalCode: z.string().min(1, "Postal code is required"),
	country: z.literal("Canada"),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	email: z
		.string()
		.refine((val) => val === "" || z.string().email().safeParse(val).success, {
			message: "Invalid email address",
		})
		.optional(),
	contactNumber: z
		.string()
		.refine(
			(val) =>
				val === "" ||
				z
					.string()
					.regex(/^[0-9]{10}$/)
					.safeParse(val).success,
			{
				message: "Contact number must be 10 digits",
			},
		)
		.optional(),
	storeCode: z
		.string()
		.min(2)
		.regex(/^[A-Z0-9\-]+$/, "Store code must be alphanumeric or hyphen"),
});

const SchoolFormTabs = () => {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState<FormData>({
		schoolName: "",
		streetAddress: "",
		addressLine2: "",
		city: "",
		provinceState: "",
		postalCode: "",
		country: "Canada",
		firstName: "",
		lastName: "",
		email: "",
		contactNumber: "",
		storeCode: "",
	});
	const [dateRange, setDateRange] = useState({
		startDate: new Date(),
		endDate: NEXT_MONTH,
	});
	// const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
	const router = useRouter();
	const searchParams = useSearchParams();
	const editStoreCode = searchParams.get("storeCode");
	const isEditMode = searchParams.get("edit") === "true";
	const [storeStatus, setStoreStatus] = useState<string | null>("Draft");

	// Fetch store details if in edit mode
	useEffect(() => {
		if (isEditMode && editStoreCode) {
			const fetchStoreDetails = async () => {
				try {
					const response = await fetch(
						`/api/store_creation?store_code=${editStoreCode}`,
					);
					if (response.ok) {
						const data = await response.json();

						// Parse address string back to components (assuming format: street, city, state, zip, country)
						const addressParts = (data.store_address || "")
							.split(",")
							.map((s: string) => s.trim());

						// Parse name
						const nameParts = (data.main_client_name || "").split(" ");
						const firstName = nameParts[0] || "";
						const lastName = nameParts.slice(1).join(" ") || "";

						setFormData({
							schoolName: data.store_name || "",
							streetAddress: addressParts[0] || "",
							addressLine2: "", // Usually lost in concatenation
							city: addressParts[1] || "",
							provinceState: addressParts[2] || "",
							postalCode: addressParts[3] || "",
							country: "Canada",
							firstName: firstName,
							lastName: lastName,
							email: data.account_manager || "",
							contactNumber: data.main_client_contact_number || "",
							storeCode: data.store_code || "",
						});

						console.log("Store Status Updated", data.status);
						setStoreStatus(data.status || "Draft");
					}
				} catch (error) {
					console.error("Failed to fetch store details:", error);
					toast.error("Could not load store details.");
				}
			};
			fetchStoreDetails();
		}
	}, [isEditMode, editStoreCode]);

	useEffect(() => {
		if (formData.schoolName.trim().split(" ").length < 2) return;
		if (isEditMode) return; // Don't auto-generate code in edit mode

		// Clear the previous timeout
		if (debounceTimeout.current) {
			clearTimeout(debounceTimeout.current);
		}

		// Set a new one
		debounceTimeout.current = setTimeout(() => {
			const generateCode = async () => {
				try {
					const uniqueCode = await getUniqueStoreCodeFromServer(
						formData.schoolName,
					);
					setFormData((prev) => ({ ...prev, storeCode: uniqueCode }));
				} catch (error) {
					console.error("Failed to get unique store code:", error);
					toast.error("Could not automatically generate a store code.");
				}
			};
			generateCode();
		}, 600);

		// Cleanup on unmount
		return () => {
			if (debounceTimeout.current) {
				clearTimeout(debounceTimeout.current);
			}
		};
	}, [formData.schoolName, isEditMode]);

	const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		console.log("handleChange called with name:", name, "value:", value);
		setFormData({ ...formData, [name]: value });
		console.log("Updated formData:", formData);
	};

	const handleSubmit = async () => {
		// if (!agreedToTerms) {
		// 	toast.error("Please agree to terms and conditions");
		// 	return;
		// }

		// Check if the contact details step is complete. If not, Give a warning and proceed.
		if (!isContactDetailsComplete()) {
			const proceed = confirm(
				"You have not filled any contact details. Do you want to proceed without providing contact information?",
			);
			if (!proceed) {
				return;
			} else {
				toast.success(
					"You need to update contact details before PL Generation.",
				);
			}
		}

		setIsSubmitting(true);
		try {
			const validated = schema.parse(formData);

			const main_client_name = `${validated.firstName || ""} ${
				validated.lastName || ""
			}`.trim();

			const storeAdrress = `${validated.streetAddress}, ${validated.city}, ${validated.provinceState}, ${validated.postalCode}, ${validated.country}`;

			let statusToSubmit = storeStatus || "Draft";

			if (isEditMode && !isContactDetailsComplete()) {
				if (storeStatus == "Approved" || storeStatus === "Modify") {
					throw new Error("Contact details are incomplete.");
				} else if (storeStatus == "Pending") {
					setStoreStatus("Draft");
					statusToSubmit = "Draft";
				}
			}

			const storeCreationBody: StoreCreationProps = {
				store_name: validated.schoolName,
				account_manager: validated.email,
				main_client_name: main_client_name,
				main_client_contact_number: validated.contactNumber,
				store_address: storeAdrress,
				store_code: validated.storeCode,
				start_date: dateRange.startDate.toISOString(),
				end_date: dateRange.endDate.toISOString(),
				status: statusToSubmit,
			};

			console.log("Store Creation Body:", storeCreationBody);

			const response = await fetch("/api/store_creation", {
				method: isEditMode ? "PUT" : "POST",
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

			toast.success(
				isEditMode
					? "Store Updated Successfully!"
					: "Store Created Successfully!",
			);
			console.log("Form submitted with data:", storeCreationBody);
			router.push(`/${storeCreationBody.store_code}`);
			setIsSubmitting(false);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: unknown) {
			if (error instanceof z.ZodError) {
				toast.error(`Error: ${error.errors[0].message}`);
			} else if (error instanceof Error) {
				console.error(error.message || "Unknown error occurred");
				toast.error(error.message || "Unknown error occurred");
			} else {
				toast.error("Unexpected error");
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	// Check whether the contact details step is complete
	const isContactDetailsComplete = () => {
		return (
			formData.email.trim() !== "" &&
			formData.contactNumber.trim() !== "" &&
			formData.firstName.trim() !== "" &&
			formData.lastName.trim() !== ""
		);
	};

	const nextStep = () => {
		if (step < steps.length - 1) {
			setStep(step + 1);
		}
	};

	const prevStep = () => {
		if (step > 0) {
			setStep(step - 1);
		}
	};

	const renderStep = () => {
		switch (step) {
			case 0:
				return (
					<SchoolDetailsStep
						formData={formData}
						handleChange={handleChange}
					/>
				);
			case 1:
				return (
					<InstitutionalDetailsStep
						formData={formData}
						handleChange={handleChange}
					/>
				);
			case 2:
				return (
					<StoreDetailsStep
						formData={formData}
						handleChange={handleChange}
						dateRange={dateRange}
						setDateRange={setDateRange}
						// setAgreedToTerms={setAgreedToTerms}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
			{/* Progress Steps */}
			<div className="bg-gray-50 px-6 py-4">
				<div className="flex items-center justify-between">
					{steps.map((label, index) => (
						<div
							key={label}
							className="flex items-center flex-1"
						>
							<div
								className={`
                flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300
                ${
									index === step
										? "bg-orange-500 text-white shadow-lg transform scale-110"
										: index < step
											? "bg-green-500 text-white"
											: "bg-gray-200 text-gray-500"
								}
              `}
							>
								{index + 1}
							</div>
							<div className="ml-3 flex-1">
								<p
									className={`text-sm font-medium transition-colors duration-300 ${
										index === step
											? "text-orange-600"
											: index < step
												? "text-green-600"
												: "text-gray-500"
									}`}
								>
									{label}
								</p>
							</div>
							{index < steps.length - 1 ? (
								<div
									className={`h-0.5 flex-1 mx-4 transition-colors duration-300 ${
										index < step ? "bg-green-500" : "bg-gray-200"
									}`}
								/>
							) : null}
						</div>
					))}
				</div>
			</div>

			{/* Form Content */}
			<div className="p-8">
				<div className="min-h-[400px] transition-all duration-500 ease-in-out">
					{renderStep()}
				</div>

				{/* Navigation Buttons */}
				<div className="flex justify-between items-center mt-8 pt-6 border-t">
					<Button
						variant="outline"
						onClick={prevStep}
						disabled={step === 0}
						className="flex items-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ChevronLeft className="w-4 h-4" />
						<span>Back</span>
					</Button>

					{step < steps.length - 1 ? (
						<Button
							onClick={nextStep}
							className="flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600"
						>
							<span>Next</span>
							<ChevronRight className="w-4 h-4" />
						</Button>
					) : (
						<Button
							onClick={handleSubmit}
							disabled={isSubmitting}
							className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50"
						>
							{isSubmitting ? "Submitting..." : "Complete Registration"}
						</Button>
					)}
				</div>
			</div>
		</div>
	);
};

export default SchoolFormTabs;
