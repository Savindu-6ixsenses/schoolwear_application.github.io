import { useState, useEffect } from "react";
import { addSingleProduct, getAllColors, getAllSageProducts } from "./actions";
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
	"tax_class", // New: Tax Class
] as const;

type ColorOption = { name: string; code: string | null };
type SageOption = {
	"Sage Code": string;
	Type: string | number | null;
	"Product Name": string | null;
	"Brand Name": string | null;
	"Sort Order": number | null;
};

export default function SingleAddForm() {
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
	const [taxClass, setTaxClass] = useState("0"); // New state for Tax Class, default to '0' (Default Tax Class)

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

	// Handler for color dropdown change
	const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedColorName = e.target.value;
		const selectedColor = colorOptions.find(
			(c) => c.name === selectedColorName,
		);
		setColorCode(selectedColor?.code ?? "");
	};

	// Handler for sage dropdown change
	const handleSageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedSage = e.target.value;
		const option = sageOptions.find((s) => s["Sage Code"] === selectedSage);

		console.log("Selected Sage Option:", option);
		setSelectedType(String(option?.Type ?? ""));
		setSortOrder(String(option?.["Sort Order"] ?? ""));
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

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
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
			// Zod treats any non-empty string as true

			// If every value is false, we can consider the field as not set. However, since at least one size should be selected, we leave it to validation.
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

		// Log the required fields and their values for debugging
		console.log("Validating required fields:");
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
			const result = await addSingleProduct(fd);
			if (result.ok) {
				setMessage({ type: "success", text: "Product added successfully." });
				form.reset();
				setColorCode("");
				setSelectedType("");
				setCategory("");
				setTaxClass("0"); // Reset Tax Class
			} else {
				setMessage({
					type: "error",
					text: result.message ?? "Failed to add product.",
				});
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			// This will catch network errors or other unexpected issues
			console.error("Error adding product:", err);
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
			{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
			{required.includes(name as any) && (
				<span className="text-red-600">*</span>
			)}
		</label>
	);

	const inputBase =
		"block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

	return (
		<form
			onSubmit={onSubmit}
			className="bg-white p-6 rounded-2xl shadow space-y-6"
		>
			<h2 className="text-xl font-semibold">Add Product (Single)</h2>
			<p className="text-sm text-gray-600">
				Fields marked with <span className="text-red-600">*</span> are required.
			</p>

			{/* Row: Sage Code / Product Name */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Sage Code", "sage_code")}
					<input
						id="sage_code"
						name="sage_code"
						className={inputBase}
						placeholder="SM-180001"
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
					/>
					{errors.product_name && (
						<p className="mt-1 text-xs text-red-600">{errors.product_name}</p>
					)}
				</div>
				<div>
					{labelReq("Category", "category")}
					<select
						id="category"
						name="category"
						className={inputBase}
						defaultValue=""
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
						onChange={handleColorChange}
						defaultValue=""
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
						onChange={handleSageChange}
						defaultValue=""
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

			{/* New Row: Tax Class (Editable Field) */}
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
						<p className="mt-1 text-xs text-red-600">{errors.color_code}</p>
					)}
				</div>
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
					{labelReq("Related Product Code", "related_product")}
					<select
						id="related_product"
						name="related_product"
						className={inputBase}
						onChange={handleSageChange}
						defaultValue=""
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

			{/* Row: Color Code / Sort Order / Type (Auto-generated fields) */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
					{errors.type && (
						<p className="mt-1 text-xs text-red-600">{errors.type}</p>
					)}
				</div>
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
					{busy ? "Adding…" : "Add Product"}
				</button>
				<button
					type="reset"
					disabled={busy}
					className="rounded-lg border border-gray-300 px-5 py-2.5 hover:bg-gray-50"
					onClick={() => {
						setErrors({});
						setMessage(null);
						setColorCode("");
						setSelectedType("");
						setSortOrder("");
						setCategory("");
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
		</form>
	);
}
