import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import toast from "react-hot-toast";

interface DateRange {
	startDate: Date;
	endDate: Date;
}

interface DateRangePickerProps {
	onDateChange: (newDateRange: DateRange) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDateChange }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
		new Date()
	);
	const [tempEndDate, setTempEndDate] = useState<Date | undefined>(() => {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		return nextMonth;
	});

	const handleApply = () => {
		if (tempStartDate && tempEndDate) {
			// Ensure start date is before end date
			if (tempStartDate > tempEndDate) {
				toast.error("Start date cannot be after end date.");
				return;
			}
			onDateChange({
				startDate: tempStartDate,
				endDate: tempEndDate,
			});
			setIsOpen(false);
		} else {
			toast.error("Please select both start and end dates.");
		}
	};

	return (
		<Popover
			open={isOpen}
			onOpenChange={setIsOpen}
		>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className={
						"w-full justify-start text-left font-normal h-12 px-4 border-gray-300 bg-gray-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500"
					}
				>
					<CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
					<span className="text-gray-500">
						{isOpen
							? "Select date range"
							: `${tempStartDate?.toDateString()} - ${tempEndDate?.toDateString()}`}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto p-4"
				align="start"
			>
				<div className="space-y-4  flex flex-col gap-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Start Date
							</label>
							<Calendar
								mode="single"
								selected={tempStartDate}
								onSelect={setTempStartDate}
								className={"p-3 pointer-events-auto"}
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								End Date
							</label>
							<Calendar
								mode="single"
								selected={tempEndDate}
								onSelect={setTempEndDate}
								className={"p-3 pointer-events-auto"}
							/>
						</div>
					</div>
					<Button
						onClick={handleApply}
						className="w-full"
					>
						Apply
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};

export default DateRangePicker;

// Error creating store: {"message":"Internal server error","error":"Failed to create store: duplicate key value violates unique constraint \"Stores_pkey\""}