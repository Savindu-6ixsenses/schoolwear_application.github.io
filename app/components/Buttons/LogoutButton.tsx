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
		// This is crucial. router.refresh() clears the client-side router cache
		// and re-fetches data from the server, including the user session in the layout.
		// The redirect in the Header component will then handle navigation to /login.
		router.refresh();
	};

	return (
		<button
			onClick={handleLogout}
			// A single button with conditional classes and content is cleaner
			className="flex flex-row justify-center items-center bg-red-500 text-white mx-3 px-4 py-2 rounded min-w-[95px] space-x-2 disabled:opacity-75"
			disabled={isLoading}
		>
			<span>Logout</span>
			{/* The spinner will only be rendered when isLoading is true */}
			{isLoading && <FaSpinner className="animate-spin" />}
		</button>
	);
};

export default LogoutButton;
