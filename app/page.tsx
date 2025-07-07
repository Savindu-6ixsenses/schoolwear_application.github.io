'use client';

import SchoolFormTabs from "./components/SchoolForm2";
import { useRouter } from 'next/navigation';

export default function Home() {
	const router = useRouter();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-8 px-4">
			{/* Top bar with store list button */}
			<div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
				<div /> {/* Empty div to align 'Store List' right */}
				<button type="button" onClick={() => router.push("/list")}>
					<div className="rounded flex justify-center items-center text-black border border-green bg-green-500 w-[110px] h-[51px] hover:bg-green-600 transition">
						Store List
					</div>
				</button>
			</div>

			{/* Header Section */}
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">School Registration</h1>
					<p className="text-lg text-gray-600">Complete your registration in three simple steps</p>
				</div>

				{/* Form */}
				<SchoolFormTabs />
			</div>
		</div>
	);
}
