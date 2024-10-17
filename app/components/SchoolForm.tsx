'use client';

import React from "react";
import Calender from "./Calender/Calender3";

const SchoolForm = () => {
	return (
		<div className="grid grid-cols-2 w-[1495px] h-[595px] text-black border-2 border-red-600 bg-[#F6F6F6] px-[85px] pt-3">
			<div className="space-y-5">
				<div>
					<label className="block text-sm font-medium mb-1">
						Name of School/Team
					</label>
					<input
						type="text"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="Blair Ridge P.S"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Account Manager
					</label>
					<input
						type="email"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="jeff@marchants.com"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Address of school/team/Organization
					</label>
					<input
						type="text"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="100 Blackfriar Ave, Whitby....."
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Main Client Contact
					</label>
					<input
						type="text"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="Brent Wragg (Principal)"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Main Client Contact No
					</label>
					<input
						type="text"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="9056201221"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">Store Code</label>
					<input
						type="text"
						className="w-full border border-gray-300 p-2 rounded-md"
						placeholder="BRS"
					/>
				</div>

				<div>
					<button className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700">
						Create the WebStore
					</button>
				</div>
			</div>
			<Calender/>
		</div>
	);
};

export default SchoolForm;
