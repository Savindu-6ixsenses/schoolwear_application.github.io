"use client";

import Link from "next/link";

export default function UnauthenticatedPage() {

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
			<h1 className="text-4xl font-bold text-red-600">Unauthorized Access</h1>
			<p className="mt-4 text-lg text-gray-700">
				You do not have the necessary permissions to view this page.
			</p>
			<p className="mt-2 text-sm text-gray-500">
				This area is restricted to administrators only.
			</p>
			<Link href="/" className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Go to Homepage</Link>
		</div>
	);
}

