import SchoolFormTabs from "./components/SchoolForm2";

export default function Home() {

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-8 px-4">
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
