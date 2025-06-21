"use client";

import toast from "react-hot-toast";
// components/LogoutButton.tsx
import { createClient } from "../../../utils/supabase/ssr_client/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSpinner } from "react-icons/fa";

const LogoutButton: React.FC = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	

	const handleLogout = async () => {
		setIsLoading(true);
		// Create a Supabase client instance
		const supabase = createClient();
		// Sign out the user
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Logout failed:", error.message);
			// Optionally, you can show an error message to the user
			toast.error("Logout failed. Please try again.");
			// Reset loading state
			setIsLoading(false);
			return;
		}
		router.push("/login");
	};



	return (
		<>
			{!isLoading ? (
				<button
					onClick={handleLogout}
					className="bg-red-500 text-white mx-3 px-4 py-2 rounded"
				>
					Logout
				</button>
			) : (
				<button
					onClick={handleLogout}
					className="flex flex-row bg-red-500 text-white mx-3 px-4 py-2 rounded w-auto space-x-2 items-center"
					disabled
				>
					<div>Logout</div>
					<div><FaSpinner /></div>
				</button>
			)}
		</>
	);
};

export default LogoutButton;
