"use client";

import { useState } from "react";
import { addColor } from "./actions";

type FieldError = Record<string, string | undefined>;

export default function AddColorForm() {
	const [busy, setBusy] = useState(false);
	const [errors, setErrors] = useState<FieldError>({});
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);

	const validate = (fd: FormData) => {
		const e: FieldError = {};
		if (!String(fd.get("colour") ?? "").trim()) {
			e.colour = "Required";
		}
		if (!String(fd.get("two_digit_code") ?? "").trim()) {
			e.two_digit_code = "Required";
		}
		return e;
	};

	async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setMessage(null);
		setErrors({});
		const form = e.currentTarget;
		const fd = new FormData(form);

		const v = validate(fd);
		if (Object.values(v).some(Boolean)) {
			setErrors(v);
			setMessage({ type: "error", text: "Please fill the required fields." });
			return;
		}

		try {
			setBusy(true);
			const result = await addColor(fd);
			if (result.ok) {
				setMessage({ type: "success", text: "Color added successfully." });
				form.reset();
			} else {
				setMessage({
					type: "error",
					text: result.message ?? "Failed to add color.",
				});
			}
		} catch (err: any) {
			console.error("Error adding color:", err);
			setMessage({
				type: "error",
				text: "An unexpected error occurred. Check Server Logs.",
			});
		} finally {
			setBusy(false);
		}
	}

	const labelReq = (label: string, name: string, required: boolean) => (
		<label
			htmlFor={name}
			className="text-sm font-medium text-gray-700"
		>
			{label} {required && <span className="text-red-600">*</span>}
		</label>
	);

	const inputBase =
		"block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

	return (
		<form
			onSubmit={onSubmit}
			className="bg-white p-6 rounded-2xl shadow space-y-6"
		>
			<h2 className="text-xl font-semibold">Add New Color</h2>
			<p className="text-sm text-gray-600">
				Fields marked with <span className="text-red-600">*</span> are required.
			</p>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div>
					{labelReq("Color Name", "colour", true)}
					<input
						id="colour"
						name="colour"
						className={inputBase}
						placeholder="e.g., Forest Green"
					/>
					{errors.colour && (
						<p className="mt-1 text-xs text-red-600">{errors.colour}</p>
					)}
				</div>
				<div>
					{labelReq("2-Digit Code", "two_digit_code", true)}
					<input
						id="two_digit_code"
						name="two_digit_code"
						className={inputBase}
						placeholder="e.g., FG"
					/>
					{errors.two_digit_code && (
						<p className="mt-1 text-xs text-red-600">{errors.two_digit_code}</p>
					)}
				</div>
				<div>
					{labelReq("3-Digit Code", "three_digit_code", false)}
					<input
						id="three_digit_code"
						name="three_digit_code"
						className={inputBase}
						placeholder="e.g., FGN"
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-3">
				<button
					type="submit"
					disabled={busy}
					className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:bg-blue-300"
				>
					{busy ? "Adding…" : "Add Color"}
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
