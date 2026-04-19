import React, { useState, useEffect, useRef } from "react";
import { FaSpinner } from "react-icons/fa";
import {
	getAllColors,
	getAllSageProducts,
	getSingleProductBySageCode,
	updateSingleProduct,
	getAllProductSageCodes,
} from "./actions";
import { GLOBAL_SUBCATEGORIES } from "@/constants/products";

type FieldError = Record<string, string | undefined>;

const required = [
	"product_name",
	"sage_code",
	"category",
	"brand_name",
	"color",
	"color_code",
	"related_product",
	"sort_order",
	"type",
	"tax_class_id",
] as const;

type ColorOption = { name: string; code: string | null };
type ProductOption = {
	"SAGE Code": string;
	"Product Name": string;

};
type SageOption = {
	"Sage Code": string;
	Type: string | number | null;
	"Product Name": string | null;
	"Brand Name": string | null;
	"Sort Order": number | null;
};

// Define a type for the product data fetched for editing
type ProductData = {
	"SAGE Code": string;
	"Product Name": string;
	Category: string;
	"Brand Name": string;
	color_code: string;
	"Related Product Code": string; // This would be the Sage Code of the related product
	Type: string | number;
	sort_order: number; // Corrected to match DB field name
	tax_class_id: string; // Assuming it's stored as a string or number
	"Product Description": string;
	XS: boolean;
	SM: boolean;
	MD: boolean;
	LG: boolean;
	XL: boolean;
	X2: boolean;
	X3: boolean;
	// Add other fields as necessary from new_all_products_4
};

/**
 * Edit flow for existing product variants.
 * The form hydrates readonly metadata from related catalog tables so admins can update
 * mutable fields without re-entering parent-product details by hand.
 */
export default function EditProductForm(params: {
	sageCode: string | undefined;
}) {
	const [busy, setBusy] = useState(false);
	const [errors, setErrors] = useState<FieldError>({});
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);
	const [sageOptions, setSageOptions] = useState<SageOption[]>([]);
	const [products, setProducts] = useState<ProductOption[]>([]);
	const [colorCode, setColorCode] = useState("");
	const [brand_name, setBrandName] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [sortOrder, setSortOrder] = useState("");
	const [category, setCategory] = useState("");
	const [taxClassId, setTaxClassId] = useState("0");
	const [color, setColor] = useState(""); // New state for color name for dropdown

	const [selectedProductSageCode, setSelectedProductSageCode] = useState("");
	const [productData, setProductData] = useState<ProductData | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Handle clicking outside to close the dropdown
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Fetch colors and sage products from the database on component mount
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [colorsResult, sageResult, productsResult] = await Promise.all([
					getAllColors(),
					getAllSageProducts(),
					getAllProductSageCodes(), // Fetch all product sage codes for the dropdown
				]);

				if (colorsResult.ok && colorsResult.data) {
					setColorOptions(colorsResult.data);
				}

				if (sageResult.ok && sageResult.data) {
					setSageOptions(sageResult.data);
				}

				if (productsResult.ok && productsResult.data) {
					setProducts(productsResult.data);
				}
			} catch (error) {
				console.error("Failed to fetch data:", error);
			}
		};
		fetchData();
	}, []);

	// A deep-linked SAGE code should open directly into edit mode without requiring another search.
	useEffect(() => {
		if (params.sageCode && !selectedProductSageCode) {
			setSelectedProductSageCode(params.sageCode);
			setSearchTerm(params.sageCode);
		}
	}, [params.sageCode]);

	// Reloading on color option changes lets us resolve the stored color code back to its display name.
	useEffect(() => {
		if (selectedProductSageCode) {
			const fetchProductData = async () => {
				setBusy(true);
                setProductData(null);
				try {
					const result = await getSingleProductBySageCode(
						selectedProductSageCode,
					);
					if (result.ok && result.data) {
						const data = result.data;
						setProductData(data);
						console.log("Fetched product data:", data);

						// Populate form fields with fetched data
						setCategory(data.Category || "");
						setBrandName(data["Brand Name"] || "");
						setColorCode(data.color_code || "");
						setSelectedType(String(data.Type || ""));
						setSortOrder(String(data.sort_order || "")); // Use sort_order
						setTaxClassId(String(data.tax_class_id || "0"));

						// Find color name for dropdown based on color_code
						const foundColor = colorOptions.find(
							(c) => c.code === data.color_code,
						);
						setColor(foundColor?.name || "");
					} else {
						setMessage({
							type: "error",
							text: result.message ?? "Failed to fetch product data.",
						});
						setProductData(null);
						resetFormStates(); // Reset form if fetch fails
					}
				} catch (error) {
					console.error("Error fetching product for edit:", error);
					setMessage({
						type: "error",
						text: "An unexpected error occurred while fetching product.",
					});
					setProductData(null);
					resetFormStates();
				} finally {
					setBusy(false);
				}
			};
			fetchProductData();
		} else {
			setProductData(null);
			resetFormStates();
		}
	}, [selectedProductSageCode, colorOptions]);

	/**
	 * Clears derived, readonly fields so stale metadata is not shown while switching products.
	 */
	const resetFormStates = () => {
		setColorCode("");
		setBrandName("");
		setSelectedType("");
		setSortOrder("");
		setCategory("");
		setTaxClassId("0");
		setColor(""); // Reset color name
		setSearchTerm(""); // Reset search term
		// Reset other form fields as needed
	};

	// Handler for color dropdown change
	const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedColorName = e.target.value;
		setColor(selectedColorName); // Update color state for dropdown
		const selectedColor = colorOptions.find(
			(c) => c.name === selectedColorName,
		);
		setColorCode(selectedColor?.code ?? "");
	};

	// Handler for sage dropdown change (for Related Product Code)
	const handleRelatedProductChange = (
		e: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const selectedSage = e.target.value;
		const option = sageOptions.find((s) => s["Sage Code"] === selectedSage);

		console.log("Selected Sage Option for Related Product:", option);
		setSelectedType(String(option?.Type ?? ""));
		setSortOrder(String(option?.["Sort Order"] ?? "")); // Set Sort Order
		setBrandName(option?.["Brand Name"] ?? "");
	};

	const validate = (fd: FormData) => {
		const e: FieldError = {};
		for (const k of required) {
			if (!String(fd.get(k) ?? "").trim()) {
				e[k] = "Required";
			}
		}
		return e;
	};

	async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setMessage(null);
		setErrors({});
		const form = e.currentTarget;
		const fd = new FormData(form);

		// Controlled selects may not survive all reset paths, so we force the current tax class into the payload.
		fd.set("tax_class_id", taxClassId); // Ensure tax_class_id is in FormData

		// Unchecked size boxes are absent from FormData; the schema expects explicit falsey values.
		["xs", "sm", "md", "lg", "xl", "x2", "x3"].forEach((name: string) => {
			if (!fd.has(name)) fd.set(name, ""); // Set to '0' for false
		});

		const v = validate(fd);

		const sizes = ["xs", "sm", "md", "lg", "xl", "x2", "x3"];
		const currentCategory = fd.get("category");
		if (
			currentCategory !== "Accessories" &&
			!sizes.some((sz) => fd.get(sz) === "true")
		) {
			// Accessories are the only category allowed to exist without any size flags.
			v["sizes"] = "At least one size is required.";
		}

		console.log("Validating required fields for update:");
        console.log("Values of validation object:", v);
		required.forEach((field) => {
			console.log(`- ${field}: "${fd.get(field)}"`);
		});

		if (Object.values(v).some(Boolean)) {
			setErrors(v);
			setMessage({ type: "error", text: "Please fill the required fields." });
			return;
		}

		try {
			setBusy(true);
			// Pass the original selected product's sage code for the update action
			fd.set("original_sage_code", selectedProductSageCode);
			const result = await updateSingleProduct(fd); // New action
			if (result.ok) {
				setMessage({ type: "success", text: "Product updated successfully." });
				setSelectedProductSageCode(""); // Clear selection to reset form
				// Deep-linked edits usually come from another screen, so we return the user there after a visible success state.
				if (params.sageCode) {
					setTimeout(() => {
						window.history.back();
					}, 1500);
				}
			} else {
				setMessage({
					type: "error",
					text: result.message ?? "Failed to update product.",
				});
			}
		} catch (err: any) {
			console.error("Error updating product:", err);
			setMessage({
				type: "error",
				text: "An unexpected error occurred.Check Server Logs.",
			});
		} finally {
			setBusy(false);
		}
	}

	const labelReq = (label: string, name?: string) => (
		<label
			htmlFor={name}
			className="text-sm font-medium text-gray-700"
		>
			{label}{" "}
			{required.includes(name as any) && (
				<span className="text-red-600">*</span>
			)}
		</label>
	);

	const inputBase =
		"block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

	return (
		<form
			onSubmit={onUpdate}
			className="bg-white p-6 rounded-2xl shadow space-y-6"
		>
			<h2 className="text-xl font-semibold">Edit Product</h2>
			<p className="text-sm text-gray-600">
				Fields marked with <span className="text-red-600">*</span> are required.
			</p>

			{/* Product Selection for Editing */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="relative" ref={dropdownRef}>
					{labelReq("Select Product to Edit", "select_product_sage_code")}
					<div className="flex flex-col pt-2">
						<input
							type="text"
							className={inputBase}
							placeholder={products.length > 0 ? "Search SAGE Code..." : "Loading products..."}
							value={searchTerm}
							onFocus={() => setIsDropdownOpen(true)}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setIsDropdownOpen(true);
							}}
							disabled={products.length === 0 || busy}
						/>
						{isDropdownOpen && products.length > 0 && (
							<div className="absolute z-50 w-full top-full mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-lg shadow-xl">
								{(() => {
									const filtered = products.filter((p) =>
										p["SAGE Code"].toLowerCase().includes(searchTerm.toLowerCase())
									);
									
									if (filtered.length === 0) {
										return <div className="px-4 py-2 text-sm text-gray-500 italic">No matches found</div>;
									}

									return filtered.map((p) => (
										<div
											key={p["SAGE Code"]}
											className="px-4 py-2 cursor-pointer hover:bg-blue-600 hover:text-white transition-colors text-sm"
											onClick={() => {
												setSelectedProductSageCode(p["SAGE Code"]);
												setSearchTerm(p["SAGE Code"]);
												setIsDropdownOpen(false);
											}}
										>
											{p["SAGE Code"]} - {p["Product Name"]}
										</div>
									));
								})()}
							</div>
						)}
					</div>
					{!productData && (<div className="pt-2 pl-2">{message && (
							<span
								className={
									message.type === "success"
										? "text-green-700 text-sm"
										: "text-red-600 text-sm"
								}
							>
								{message.text}
							</span>
						)}</div>)}
				</div>
			</div>

			{busy && !productData && (
				<div className="flex flex-col items-center justify-center py-12 space-y-4 border-2 border-dashed border-gray-100 rounded-xl">
					<FaSpinner className="h-8 w-8 animate-spin text-blue-600" />
					<p className="text-sm text-gray-500 font-medium">Loading product data...</p>
				</div>
			)}

			{productData && (
				<React.Fragment key={selectedProductSageCode}>
					{/* Row: Sage Code / Product Name / Category */}
					{/* Remounting resets uncontrolled `defaultValue` fields when the selected product changes. */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							{labelReq("SAGE Code", "sage_code")}
							<input
								id="sage_code"
								name="sage_code"
								className={inputBase}
								placeholder="SM-180001"
								defaultValue={productData["SAGE Code"]}
								readOnly // Sage Code is usually not editable once created
							/>
							{errors.sage_code && (
								<p className="mt-1 text-xs text-red-600">{errors.sage_code}</p>
							)}
						</div>
						<div>
							{labelReq("Product Name", "product_name")}
							<input
								id="product_name"
								name="product_name"
								className={inputBase}
								placeholder="Girls Polo Shirt"
								defaultValue={productData["Product Name"]}
							/>
							{errors.product_name && (
								<p className="mt-1 text-xs text-red-600">
									{errors.product_name}
								</p>
							)}
						</div>
						<div>
							{labelReq("Category", "category")}
							<select
								id="category"
								name="category"
								className={inputBase}
								value={category}
								onChange={(e) => setCategory(e.target.value)}
							>
								<option
									value=""
									disabled
								>
									Select a category
								</option>
								{GLOBAL_SUBCATEGORIES.map((cat) => (
									<option
										key={cat}
										value={cat}
									>
										{cat}
									</option>
								))}
							</select>
							{errors.category && (
								<p className="mt-1 text-xs text-red-600">{errors.category}</p>
							)}
						</div>
					</div>

					{/* Row: Color / Related Product Code */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							{labelReq("Color", "color")}
							<select
								id="color"
								name="color"
								className={inputBase}
								value={color} // Controlled component
								onChange={handleColorChange}
								disabled={colorOptions.length === 0}
							>
								<option
									value=""
									disabled
								>
									{colorOptions.length > 0 ? "Select a color" : "Loading..."}
								</option>
								{colorOptions.map((c) => (
									<option
										key={c.name}
										value={c.name}
									>
										{c.name}
									</option>
								))}
							</select>
							{errors.color && (
								<p className="mt-1 text-xs text-red-600">{errors.color}</p>
							)}
						</div>
						<div>
							{labelReq("Related Product Code", "related_product")}
							<select
								id="related_product"
								name="related_product"
								className={inputBase}
								onChange={handleRelatedProductChange}
								defaultValue={productData["Related Product Code"]} // Use defaultValue for initial render
							>
								<option
									value=""
									disabled
								>
									Select SAGE Code
								</option>
								{sageOptions.map((s) => (
									<option
										key={s["Sage Code"]}
										value={s["Sage Code"]}
									>
										{s["Sage Code"]} - {s["Product Name"]}
									</option>
								))}
							</select>
							{errors.related_product && (
								<p className="mt-1 text-xs text-red-600">
									{errors.related_product}
								</p>
							)}
						</div>
					</div>

					{/* Row: Tax Class (New Editable Field) */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							{labelReq("Tax Class", "tax_class_id")}
							<select
								id="tax_class_id"
								name="tax_class_id"
								className={inputBase}
								value={taxClassId}
								onChange={(e) => setTaxClassId(e.target.value)}
							>
								<option value="0">0: Default Tax Class</option>
								<option value="1">1: Non-Taxable Product</option>
								<option value="2">2: Shipping</option>
								<option value="3">3: Gift Wrapping</option>
								<option value="4">4: Youth Tax</option>
							</select>
							{errors.tax_class_id && (
								<p className="mt-1 text-xs text-red-600">{errors.tax_class_id}</p>
							)}
						</div>
					</div>

					{/* Row: Color Code / Sort Order / Type (Auto-generated fields) */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							{labelReq("Color Code", "color_code")}
							<input
								id="color_code"
								name="color_code"
								className={inputBase}
								placeholder="RED"
								value={colorCode}
								onChange={(e) => setColorCode(e.target.value)}
								readOnly
							/>
							{errors.color_code && (
								<p className="mt-1 text-xs text-red-600">{errors.color_code}</p>
							)}
						</div>
						<div>
							{labelReq("Sort Order", "sort_order")}
							<input
								id="sort_order"
								name="sort_order"
								className={inputBase}
								value={sortOrder}
								readOnly
								placeholder="Auto-populated"
							/>
							{errors.sort_order && (
								<p className="mt-1 text-xs text-red-600">{errors.sort_order}</p>
							)}
						</div>
						<div>
							{labelReq("Type", "type")}
							<input
								id="type"
								name="type"
								className={inputBase}
								value={selectedType}
								readOnly
								placeholder="Auto-populated"
							/>
							{errors.type && (
								<p className="mt-1 text-xs text-red-600">{errors.type}</p>
							)}
						</div>
					</div>

					{/* Row: Brand Name (Auto-generated field) */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							{labelReq("Brand Name", "brand_name")}
							<input
								id="brand_name"
								name="brand_name"
								className={inputBase}
								placeholder="Auto-populated"
								value={brand_name}
								readOnly
							/>
							{errors.brand_name && (
								<p className="mt-1 text-xs text-red-600">{errors.brand_name}</p>
							)}
						</div>
					</div>

					{/* Description */}
					<div>
						{labelReq("Product Description", "product_description")}
						<textarea
							id="product_description"
							name="product_description"
							className={`${inputBase} min-h-[90px]`}
							placeholder="Cotton polo shirt..."
							defaultValue={productData["Product Description"] || ""}
						/>
					</div>

					{/* Flags */}
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<fieldset className="border border-gray-200 rounded-lg p-4">
							<legend className="px-2 text-sm font-semibold text-gray-700">
								Sizes{" "}
								{category !== "Accessories" && (
									<span className="text-red-600">*</span>
								)}
							</legend>
							<div className="grid grid-cols-4 gap-2 text-sm">
								{["xs", "sm", "md", "lg", "xl", "x2", "x3"].map((sz) => (
									<label
										key={sz}
										className="flex items-center gap-2"
									>
										<input
											type="checkbox"
											name={sz}
											value="true"
											className="h-4 w-4"
											defaultChecked={
												productData[sz.toUpperCase() as keyof ProductData] as boolean
											}
										/>
										<span>{sz.toUpperCase()}</span>
									</label>
								))}
							</div>
						</fieldset>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-3">
						<button
							type="submit"
							disabled={busy}
							className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:bg-blue-300"
						>
							Update Product
						</button>
						<button
							type="reset"
							disabled={busy}
							className="rounded-lg border border-gray-300 px-5 py-2.5 hover:bg-gray-50"
							onClick={() => {
								setErrors({});
								setMessage(null);
								setSelectedProductSageCode(""); // This will trigger resetFormStates via useEffect
							}}
						>
							Reset
						</button>
						{message && (
							<span
								className={
									message.type === "success"
										? "text-green-700 text-sm"
										: "text-red-600 text-sm"
								}
							>
								{message.text}
							</span>
						)}
					</div>
				</React.Fragment>
			)}
		</form>
	);
}
