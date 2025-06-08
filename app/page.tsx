'use client';

import SchoolForm from "./components/SchoolForm";
import { useRouter } from 'next/navigation'

export default function Home() {
	const router = useRouter();

	return (
		<div className="grid grid-row-3 gap-7 w-[1500px] mx-auto">
			<div className="flex flex-row justify-end">
				{/* TODO: Fix loading status for this button */}
				<button type="button" onClick={() => {router.push("/list")}}>
				<div className="mt-[27px] mr-5 rounded flex justify-center items-center text-black border border-green bg-green-500 w-[110px] h-[51px]">
					Store List
				</div>
				</button>
			</div>
			<SchoolForm />
		</div>
	);
}
