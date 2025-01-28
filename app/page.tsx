'use client';

import SchoolForm from "./components/SchoolForm";
import { useRouter } from 'next/navigation'

export default function Home() {
	const router = useRouter();

	return (
		<div className="grid grid-row-3 gap-7 w-[1500px]">
			<div className="flex flex-row justify-between">
				<div className="mt-[27px] rounded-lg border-[1px] border-black w-[383px] h-[51px] grid grid-cols-2">
					<label className="flex items-center space-x-2">
						<input
							type="radio"
							name="store"
							value="new"
							className="form-radio border-black ml-3"
						/>
						<span className="text-black">New Web Store</span>
					</label>
	
					<label className="flex items-center space-x-2 ml-6">
						<input
							type="radio"
							name="store"
							value="update"
							className="form-radio border-black"
						/>
						<span className="text-black">Update Web Store</span>
					</label>
				</div>
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
