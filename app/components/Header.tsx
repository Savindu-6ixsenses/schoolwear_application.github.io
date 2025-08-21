"use client";

import LogoutButton from "./Buttons/LogoutButton";
import LoginButton from "./Buttons/LoginButton";
import { redirect, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import StoresListButton from "./Buttons/StoresListButton";

type HeaderProps = {
	user: User | null;
};

const Header = ({ user }: HeaderProps) => {
	const router = useRouter();
	const pathName = usePathname();

	const handleLogoClick = () => {
		console.log("Current User: ", user);
		router.push("/");
	};

	const validPath = !(pathName === "/login" || pathName === "/signup");

	if (!user && validPath) {
		redirect("/login");
	}

	return (
		<div className="w-full border-2 h-[78px] bg-[#FFFFFF] place-items-start items-center max-lg:pl-3 lg:pl-6 flex">
			<div
				className="flex-auto w-[274px] h-[47px] hover:cursor-pointer justify-center text-black pb-2 text-center"
				onClick={handleLogoClick}
			>
				<Image
					src="/logo.png"
					alt="Logo"
					width={50}
					height={47}
					priority
				/>
			</div>
			{user && <div className="text-black">Welcome {user.email}</div>}
			<div className="flex-auto"></div>
			{/* Show login/logout button based on user state */}
			{/* Only show if the path is valid */}
			{validPath && (
				<div className="flex">
					{/* Only display the storelist button when there's a current user */}
					<div>{user ? <StoresListButton /> : null}</div>
					{/* Show logout button if user is logged in, otherwise show login button */}
					<div>{user ? <LogoutButton /> : <LoginButton />}</div>
				</div>
			)}
		</div>
	);
};

export default Header;
