"use client";

import { useRouter } from "next/navigation";

const StoresListButton: React.FC = () => {
	const router = useRouter();

	const handleLogin = async () => {
		router.push("/list");
	};

	return (
		<button
			onClick={handleLogin}
			className="bg-yellow-500 text-white mx-3 px-4 py-2 rounded"
		>
			Stores
		</button>
	);
};

export default StoresListButton;
