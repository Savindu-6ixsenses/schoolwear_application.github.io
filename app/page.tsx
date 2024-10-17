import SchoolForm from "./components/SchoolForm";

export default function Home() {
	return (
		<div className="grid grid-row-3 gap-7">
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
			<SchoolForm />
		</div>
	);
}
