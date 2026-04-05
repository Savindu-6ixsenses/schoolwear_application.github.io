import { useState, useEffect } from "react";
import {
	getAllColors,
	getAllSageProducts,
	getSingleProductBySageCode,
	updateSingleProduct,
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
	"tax_class",
] as const;

type ColorOption = { name: string; code: string | null };
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
	tax_class: string; // Assuming it's stored as a string or number
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

export default function EditProductForm() {
	const [busy, setBusy] = useState(false);
	const [errors, setErrors] = useState<FieldError>({});
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);
	const [sageOptions, setSageOptions] = useState<SageOption[]>([]);
	const [colorCode, setColorCode] = useState("");
	const [brand_name, setBrandName] = useState("");
	const [selectedType, setSelectedType] = useState("");
	const [sortOrder, setSortOrder] = useState("");
	const [category, setCategory] = useState("");
	const [taxClass, setTaxClass] = useState("0");
	const [color, setColor] = useState(""); // New state for color name for dropdown

	const [selectedProductSageCode, setSelectedProductSageCode] = useState("");
	const [productData, setProductData] = useState<ProductData | null>(null);

	// Fetch colors and sage products from the database on component mount
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [colorsResult, sageResult] = await Promise.all([
					getAllColors(),
					getAllSageProducts(),
				]);

				if (colorsResult.ok && colorsResult.data) {
					setColorOptions(colorsResult.data);
				}

				if (sageResult.ok && sageResult.data) {
					setSageOptions(sageResult.data);
				}
			} catch (error) {
				console.error("Failed to fetch data:", error);
			}
		};
		fetchData();
	}, []);

	// Effect to load product data when selectedProductSageCode changes
	useEffect(() => {
		if (selectedProductSageCode) {
			const fetchProductData = async () => {
				setBusy(true);
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
						setTaxClass(String(data.tax_class || "0"));

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
	}, [selectedProductSageCode, colorOptions]); // Add colorOptions to dependency array

	const resetFormStates = () => {
		setColorCode("");
		setBrandName("");
		setSelectedType("");
		setSortOrder("");
		setCategory("");
		setTaxClass("0");
		setColor(""); // Reset color name
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

		// Add taxClass to FormData manually if it's a controlled component and not directly named in the form
		fd.set("tax_class", taxClass); // Ensure tax_class is in FormData

		// Normalize booleans (unchecked checkboxes won't appear in FormData)
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
			v["sizes"] = "At least one size is required.";
		}

		console.log("Validating required fields for update:");
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
				// Optionally, re-fetch the updated product data or clear selection
				setSelectedProductSageCode(""); // Clear selection to reset form
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
		<label htmlFor={name} className="text-sm font-medium text-gray-700">
			{label}{" "}
			{required.includes(name as any) && (
				<span className="text-red-600">*</span>
			)}
		</label>
	);

	const inputBase =
		"block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

	return (
		<form onSubmit={onUpdate} className="bg-white p-6 rounded-2xl shadow space-y-6">
			<h2 className="text-xl font-semibold">Edit Product</h2>
			<p className="text-sm text-gray-600">
				Fields marked with <span className="text-red-600">*</span> are required.
			</p>

			{/* Product Selection for Editing */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Select Product to Edit", "select_product_sage_code")}
					<select
						id="select_product_sage_code"
						name="select_product_sage_code"
						className={inputBase}
						value={selectedProductSageCode}
						onChange={(e) => setSelectedProductSageCode(e.target.value)}
						disabled={sageOptions.length === 0 || busy}
					>
						<option value="" disabled>
							{sageOptions.length > 0
								? "Select SAGE Code"
								: "Loading products..."}
						</option>
						{sageOptions.map((s) => (
							<option key={s["Sage Code"]} value={s["Sage Code"]}>
								{s["Sage Code"]} - {s["Product Name"]}
							</option>
						))}
					</select>
				</div>
			</div>

			{productData && (
				<>
					{/* Row: Sage Code / Product Name / Category */}
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div>
							{labelReq("Sage Code", "sage_code")}
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
								<option value="" disabled>
									Select a category
								</option>
								{GLOBAL_SUBCATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
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
								<option value="" disabled>
									{colorOptions.length > 0 ? "Select a color" : "Loading..."}
								</option>
								{colorOptions.map((c) => (
									<option key={c.name} value={c.name}>
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
								<option value="" disabled>
									Select SAGE Code
								</option>
								{sageOptions.map((s) => (
									<option key={s["Sage Code"]} value={s["Sage Code"]}>
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
							{labelReq("Tax Class", "tax_class")}
							<select
								id="tax_class"
								name="tax_class"
								className={inputBase}
								value={taxClass}
								onChange={(e) => setTaxClass(e.target.value)}
							>
								<option value="0">0: Default Tax Class</option>
								<option value="1">1: Non-Taxable Product</option>
								<option value="2">2: Shipping</option>
								<option value="3">3: Gift Wrapping</option>
								<option value="4">4: Youth Tax</option>
							</select>
							{errors.tax_class && (
								<p className="mt-1 text-xs text-red-600">{errors.tax_class}</p>
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
								<p className="mt-1 text-xs text-red-600">
									{errors.color_code}
								</p>
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
								<p className="mt-1 text-xs text-red-600">
									{errors.sort_order}
								</p>
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
								<p className="mt-1 text-xs text-red-600">
									{errors.brand_name}
								</p>
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
									<label key={sz} className="flex items-center gap-2">
										<input
											type="checkbox"
											name={sz}
											value="true"
											className="h-4 w-4"
											defaultChecked={
												productData[sz as keyof ProductData] as boolean
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
							{busy ? "Updating…" : "Update Product"}
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
				</>
			)}
		</form>
	);
}
