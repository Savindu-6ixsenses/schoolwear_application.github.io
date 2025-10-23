import { useState, useMemo } from "react";
import { addSingleProduct } from "./actions";

type FieldError = Record<string, string | undefined>;

const required = ["product_id", "product_name", "sku"] as const;

export default function SingleAddForm() {
	const [busy, setBusy] = useState(false);
	const [errors, setErrors] = useState<FieldError>({});
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const skuPlaceholder = useMemo(() => "SKU-0001", []);

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

		// Normalize booleans (unchecked checkboxes won't appear in FormData)
		["is_created", "xs", "sm", "md", "lg", "xl", "x2", "x3"].forEach(
			(name: string) => {
				if (!fd.has(name)) fd.set(name, ""); // Set to '0' for false
                                                     // Zod treats any non-empty string as true
			}
		);

		const v = validate(fd);
		if (Object.values(v).some(Boolean)) {
			setErrors(v);
			setMessage({ type: "error", text: "Please fill the required fields." });
			return;
		}

		try {
			setBusy(true);
			await addSingleProduct(fd);
			setMessage({ type: "success", text: "Product added successfully." });
			form.reset();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			setMessage({
				type: "error",
				text: err?.message ?? "Failed to add product.",
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

			{/* Row: Item Type / Product Type / Category */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Item Type", "item_type")}
					<input
						id="item_type"
						name="item_type"
						className={inputBase}
						placeholder="e.g., Shirt"
					/>
				</div>
				<div>
					{labelReq("Product Type", "product_type")}
					<input
						id="product_type"
						name="product_type"
						className={inputBase}
						placeholder="e.g., Top"
					/>
				</div>
				<div>
					{labelReq("Category", "category")}
					<input
						id="category"
						name="category"
						className={inputBase}
						placeholder="e.g., Schoolwear"
					/>
				</div>
			</div>

			{/* Row: Product ID / SKU / Product Name */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Product ID", "product_id")}
					<input
						id="product_id"
						name="product_id"
						className={inputBase}
						placeholder="P0001"
					/>
					{errors.product_id && (
						<p className="mt-1 text-xs text-red-600">{errors.product_id}</p>
					)}
				</div>
				<div>
					{labelReq("SKU (Product Code)", "sku")}
					<input
						id="sku"
						name="sku"
						className={inputBase}
						placeholder={skuPlaceholder}
					/>
					{errors.sku && (
						<p className="mt-1 text-xs text-red-600">{errors.sku}</p>
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
			</div>

			{/* Row: Brand / SAGE / Weight */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Brand Name", "brand_name")}
					<input
						id="brand_name"
						name="brand_name"
						className={inputBase}
						placeholder="BrandX"
					/>
				</div>
				<div>
					{labelReq("SAGE Code", "sage_code")}
					<input
						id="sage_code"
						name="sage_code"
						className={inputBase}
						placeholder="SG-100"
					/>
				</div>
				<div>
					{labelReq("Product Weight (kg)", "product_weight")}
					<input
						id="product_weight"
						name="product_weight"
						type="number"
						step="any"
						min="0"
						className={inputBase}
						placeholder="0.25"
					/>
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
						Availability Flags
					</legend>
					<label className="mt-2 flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="is_created"
							value="true"
							className="h-4 w-4"
						/>
						<span>isCreated</span>
					</label>
				</fieldset>

				<fieldset className="border border-gray-200 rounded-lg p-4">
					<legend className="px-2 text-sm font-semibold text-gray-700">
						Sizes
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
