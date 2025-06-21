"use client";

import LogoutButton from "./Buttons/LogoutButton";
import LoginButton from "./Buttons/LoginButton";
import { redirect, usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "@supabase/supabase-js";

type HeaderProps = {
	user: User | null;
};

const Header = ({ user }: HeaderProps) => {
	const currentUser = user || null;
	const router = useRouter();
	const pathName = usePathname();

	const handleLogoClick = () => {
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
			{validPath && (
				<div>{currentUser ? <LogoutButton /> : <LoginButton />}</div>
			)}
		</div>
	);
};

export default Header;
