"use client";

import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";
import { createClient } from "@/utils/supabase/ssr_client/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SessionData } from "@/types/authSession";
import { Session } from "@supabase/supabase-js";

const Header = () => {
	const [session, setSession] = useState<Session | null>(null);
	const router = useRouter();

	useEffect(() => {
		const supabase = createClient();

		// ✅ Check for active session
		const fetchSession = async () => {
			const { data, error }: SessionData = await supabase.auth.getSession();

			if (error) {
				console.error("Session retrieval failed:", error.message);
			} else if (data.session) {
				console.log("Session found:", data.session);
			} else {
				console.log("No session detected.");
			}
		};

		fetchSession();

		// ✅ Listen to changes in the session (login/logout)
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(event, session) => {
				if (session) {
					setSession(session);
				} else {
					setSession(null);
				}
			}
		);

		// Cleanup the listener
		return () => {
			authListener?.subscription.unsubscribe();
		};
	}, []);

	const handleLogoClick = () => {
		router.push("/"); // ✅ Redirect to homepage when the logo is clicked
	};

	return (
		<div className="w-full border-2 h-[78px] bg-[#FFFFFF] place-items-start items-center max-lg:pl-3 lg:pl-6 flex">
			<div
				className="flex-auto w-[274px] h-[47px] hover:cursor-pointer justify-center text-black pb-2 text-center"
				onClick={handleLogoClick}
			>
				<Image
					src="/logo.png" // ✅ Path to your logo file in the public directory
					alt="Logo"
					width={50}
					height={47}
					priority // ✅ Improve loading performance for critical images
				/>
			</div>

			{/* ✅ Show Logout button only if session exists */}
			{session && (
				<div>
					<LogoutButton />
				</div>
			)}
		</div>
	);
};

export default Header;
