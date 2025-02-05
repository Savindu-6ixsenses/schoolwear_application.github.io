import { useState } from "react";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";

const NEXT_MONTH = new Date();
NEXT_MONTH.setMonth(NEXT_MONTH.getMonth() + 1);

interface DateRange {
	startDate: Date;
	endDate: Date;
}

interface CalenderProps {
	onDateChange: (dateRange: DateRange) => void;
}

const Calender: React.FC<CalenderProps> = ({ onDateChange }) => {
	const [value, setValue] = useState<DateRange>({
		startDate: new Date(),
		endDate: NEXT_MONTH,
	});

	const handleChange = (newValue: DateValueType | null) => {
		if (!newValue) return;

		const formattedDateRange: DateRange = {
			startDate: new Date(newValue.startDate|| ""),
			endDate: new Date(newValue.endDate || ""),
		};

		setValue(formattedDateRange);
		onDateChange(formattedDateRange);
	};

	return (
		<Datepicker
			containerClassName="relative mt-8 ml-8"
			inputClassName={"w-full h-[50px] rounded-md border border-gray-300 p-4"}
			toggleClassName={
				"absolute right-2 top-[6.5px] bg-white border border-gray-300 rounded-md p-2"
			}
			displayFormat="DD/MM/YYYY"
			separator="to"
			placeholder="<Start Date> to <End Date>"
			minDate={new Date()}
			primaryColor={"rose"}
			value={value}
			onChange={handleChange}
			showShortcuts={true}
		/>
	);
};

export default Calender;
