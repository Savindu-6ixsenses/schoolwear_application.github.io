"use client";

import { signup } from "../login/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	async function handleSubmit(
		action: (
			formData: FormData
		) => Promise<{
			success: boolean;
			error?: string;
			code?: string;
			message?: string;
		} | void>,
		event: React.FormEvent<HTMLFormElement>
	) {
		event.preventDefault();
		setIsLoading(true);

		try {
			const formData = new FormData(event.currentTarget);

			const result = await action(formData);

			if (result?.error) {
				toast.error(result.error);
				console.error(`Error Code: ${result.code}`);
				return;
			}

			if (result?.message) {
				// ✅ Show email confirmation message
				toast.success(result.message);
        router.push('/login')
			}

			toast.success("Sign up successful!");
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
			<form
				onSubmit={(e) => handleSubmit(signup, e)}
				className="w-full max-w-sm bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4"
			>
				<h2 className="text-2xl font-semibold mb-6 text-gray-700 text-center">
					Create Your Account
				</h2>

				{/* Email Input */}
				<div className="mb-4">
					<label
						htmlFor="email"
						className="block text-gray-700 font-medium mb-2"
					>
						Email:
					</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{/* Password Input */}
				<div className="mb-4">
					<label
						htmlFor="password"
						className="block text-gray-700 font-medium mb-2"
					>
						Password:
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{/* Signup Button */}
				<button
					type="submit"
					className={`w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded focus:outline-none ${
						isLoading ? "opacity-50 cursor-not-allowed" : ""
					}`}
					disabled={isLoading}
				>
					{isLoading ? "Signing up..." : "Sign Up"}
				</button>

				{/* Back to Login */}
				<div className="flex flex-col items-center mt-4">
					<p className="text-gray-600">Already have an account?</p>
					<button
						type="button"
						onClick={() => router.push("/login")}
						className="mt-2 text-blue-500 hover:underline"
					>
						Go to login
					</button>
				</div>
			</form>
		</div>
	);
}
