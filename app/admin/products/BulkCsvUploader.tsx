/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { type BulkImportResult } from "@/lib/products/productSchema";

export default function BulkCsvUploader() {
	const [file, setFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error" | "info";
		text: string;
	} | null>(null);
	const [result, setResult] = useState<BulkImportResult | null>(null);
	const [errorCsvUrl, setErrorCsvUrl] = useState<string | null>(null);

	const dropRef = useRef<HTMLLabelElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	/* ------------------------------- DnD handlers ------------------------------ */
	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		dropRef.current?.classList.add("ring-2", "ring-blue-500", "bg-blue-50/50");
	};
	const onDragLeave = () => {
		dropRef.current?.classList.remove(
			"ring-2",
			"ring-blue-500",
			"bg-blue-50/50"
		);
	};
	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		dropRef.current?.classList.remove(
			"ring-2",
			"ring-blue-500",
			"bg-blue-50/50"
		);
		const f = e.dataTransfer.files?.[0];
		if (f) handleFile(f);
	};

	/* --------------------------------- Helpers -------------------------------- */
	const handleFile = (f: File) => {
		if (!f.name.toLowerCase().endsWith(".csv")) {
			setMessage({ type: "error", text: "Only .csv files are allowed." });
			setFile(null);
			return;
		}
		setMessage(null);
		setFile(f);
	};

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		if (f) handleFile(f);
	};

	const downloadTemplate = () => {
		const header = [
			"Item Type",
			"Product Name",
			"Product Type",
			"Product Code/SKU",
			"SAGE Code",
			"Brand Name",
			"Product Description",
			"isCreated",
			"XS",
			"SM",
			"MD",
			"LG",
			"XL",
			"X2",
			"X3",
			"Category",
		].join(",");
		const sample = [
			"Shirt",
			"Girls Polo",
			"Top",
			"SKU-GIRLS-POLO-01",
			"SG-100",
			"BrandX",
			"Cotton polo shirt",
			"false",
			"true",
			"true",
			"true",
			"true",
			"true",
			"false",
			"false",
			"Schoolwear",
		].join(",");
		const csv = header + "\n" + sample + "\n";
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "products_template.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	const resetAll = () => {
		setFile(null);
		setResult(null);
		setMessage(null);
		setErrorCsvUrl(null);
		if (inputRef.current) inputRef.current.value = "";
	};

	/* ---------------------------------- Upload -------------------------------- */
	const uploadToApiRoute = async () => {
		if (!file) return;
		setBusy(true);
		setMessage({ type: "info", text: "Uploading and validating…" });
		setResult(null);
		setErrorCsvUrl(null);
		try {
			const form = new FormData();
			form.append("file", file);
			const res = await fetch("/api/admin/products/bulk", {
				method: "POST",
				body: form,
			});
			const data: BulkImportResult = await res.json();
			if (!res.ok) throw new Error("Upload failed");
			setResult(data);
			if (data.errorCsvUrl) setErrorCsvUrl(data.errorCsvUrl);
			setMessage({ type: "success", text: "Bulk import complete." });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (e: any) {
			setMessage({ type: "error", text: e.message ?? "Upload failed" });
		} finally {
			setBusy(false);
		}
	};

	/* ---------------------------------- UI ----------------------------------- */
	const Stat = ({
		label,
		value,
		tone = "default",
	}: {
		label: string;
		value: number | string;
		tone?: "success" | "warn" | "danger" | "default";
	}) => {
		const tones: Record<string, string> = {
			success: "bg-green-50 text-green-700 ring-green-200",
			warn: "bg-amber-50 text-amber-700 ring-amber-200",
			danger: "bg-red-50 text-red-700 ring-red-200",
			default: "bg-gray-50 text-gray-700 ring-gray-200",
		};
		return (
			<div
				className={`rounded-2xl p-4 ring-1 ${tones[tone]} flex flex-col gap-1`}
			>
				<span className="text-xs uppercase tracking-wide opacity-70">
					{label}
				</span>
				<span className="text-2xl font-semibold">{value}</span>
			</div>
		);
	};

	return (
		<div className="w-full">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow">
						{/* database glyph */}
						<svg
							viewBox="0 0 24 24"
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.8"
						>
							<ellipse
								cx="12"
								cy="6"
								rx="7"
								ry="3"
							></ellipse>
							<path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6"></path>
							<path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"></path>
						</svg>
					</div>
					<div>
						<h1 className="text-xl font-bold leading-tight">
							Add Products — Bulk CSV
						</h1>
						<p className="text-sm text-gray-600">
							Upload a CSV, validate, and insert in one go. Use the official
							template to avoid errors.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={downloadTemplate}
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
					>
						Download Template
					</button>
					<button
						onClick={resetAll}
						className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
					>
						Reset
					</button>
					<button
						onClick={uploadToApiRoute}
						disabled={!file || busy}
						className="rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700 disabled:bg-blue-300"
					>
						{busy ? "Uploading…" : "Upload CSV"}
					</button>
				</div>
			</div>

			{/* Two-column layout */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* Left: Upload card (2 cols) */}
				<div className="lg:col-span-2">
					<div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
						<div className="border-b border-gray-100 px-6 py-4">
							<h2 className="text-base font-semibold">Upload</h2>
							<p className="text-sm text-gray-600">
								Drag & drop a <span className="font-medium">.csv</span> here, or
								click to browse. Required columns:
								<span className="font-medium">Product Name</span>, and{" "}
								<span className="font-medium">Product Code/SKU</span>.
							</p>
						</div>

						<div className="p-6">
							{/* Dropzone */}
							<label
								ref={dropRef}
								onDragOver={onDragOver}
								onDragLeave={onDragLeave}
								onDrop={onDrop}
								className="flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition hover:bg-gray-100"
							>
								<input
									ref={inputRef}
									type="file"
									accept=".csv,text/csv"
									onChange={onChange}
									className="hidden"
								/>
								<div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
									<svg
										viewBox="0 0 24 24"
										className="h-7 w-7 text-gray-500"
										fill="none"
										stroke="currentColor"
										strokeWidth="1.6"
									>
										<path
											d="M12 16V4m0 0l-4 4m4-4l4 4"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
										<rect
											x="3"
											y="14"
											width="18"
											height="6"
											rx="2"
											className="stroke-gray-400"
										/>
									</svg>
								</div>
								<div className="text-sm text-gray-700">
									<span className="font-medium">Drop your CSV here</span> or
									click to select
								</div>
								{file && (
									<div className="text-xs text-gray-500">
										Selected: {file.name}
									</div>
								)}
							</label>

							{/* Inline message */}
							{message && (
								<div
									className={`mt-4 rounded-xl px-3 py-2 text-sm ring-1 ${
										message.type === "success"
											? "bg-green-50 text-green-700 ring-green-200"
											: message.type === "info"
											? "bg-blue-50 text-blue-700 ring-blue-200"
											: "bg-red-50 text-red-700 ring-red-200"
									}`}
								>
									{message.text}
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Right: Summary card */}
				<div className="lg:col-span-1">
					<div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
						<div className="border-b border-gray-100 px-6 py-4">
							<h2 className="text-base font-semibold">Import Summary</h2>
						</div>

						<div className="p-6 space-y-4">
							<div className="grid grid-cols-2 gap-3">
								<Stat
									label="Total Rows"
									value={result?.totalRows ?? 0}
								/>
								{"validated" in (result ?? {}) && (
									<Stat
										label="Validated"
										value={(result as any).validated ?? 0}
									/>
								)}
								{"inserted" in (result ?? {}) && (
									<Stat
										label="Inserted"
										value={(result as any).inserted ?? 0}
										tone="success"
									/>
								)}
								{"skipped" in (result ?? {}) && (
									<Stat
										label="Skipped"
										value={(result as any).skipped ?? 0}
										tone="warn"
									/>
								)}
								{"failed" in (result ?? {}) && (
									<Stat
										label="Failed"
										value={(result as any).failed ?? 0}
										tone="danger"
									/>
								)}
							</div>

							{errorCsvUrl && (
								<div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
									Some rows need fixes.{" "}
									<a
										href={errorCsvUrl}
										target="_blank"
										rel="noreferrer"
										className="font-semibold underline"
									>
										Download error rows (CSV)
									</a>
								</div>
							)}

							{/* Row-level results */}
							{result && (
								<details className="rounded-xl bg-gray-50 p-3 text-sm">
									<summary className="cursor-pointer select-none font-medium text-gray-800">
										Row-level results
									</summary>
									<pre className="mt-2 max-h-[280px] overflow-auto rounded-lg bg-white p-3 ring-1 ring-gray-200">
										{JSON.stringify((result as any).results ?? result, null, 2)}
									</pre>
								</details>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Footer help strip */}
			<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
				<div className="flex items-center gap-2">
					<svg
						viewBox="0 0 24 24"
						className="h-5 w-5 text-gray-500"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
					>
						<path
							d="M12 9v3.5m0 3v.5"
							strokeLinecap="round"
						/>
						<circle
							cx="12"
							cy="12"
							r="9"
						></circle>
					</svg>
					<span>
						Tip: Ensure headers exactly match the template. Booleans accept{" "}
						<code>true/false</code>, <code>1/0</code>, or <code>yes/no</code>.
					</span>
				</div>
			</div>
		</div>
	);
}
