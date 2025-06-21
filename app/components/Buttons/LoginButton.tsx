"use client";

// components/LoginButton
//.tsx
import { useRouter } from "next/navigation";

const LoginButton: React.FC = () => {
	const router = useRouter();

	const handleLogin = async () => {
		router.push("/login");
	};

	return (
		<button
			onClick={handleLogin}
			className="bg-green-500 text-white mx-3 px-4 py-2 rounded"
		>
			Login
		</button>
	);
};

export default LoginButton;
