import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DateRangePickerProps {
	onDateChange: (range: { startDate: Date; endDate: Date }) => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onDateChange }) => {
	const [startDate, setStartDate] = useState<Date>(new Date());
	const [endDate, setEndDate] = useState<Date>(() => {
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		return nextMonth;
	});
	const [error, setError] = useState<string>("");

	const handleStartDateChange = (date: Date | undefined) => {
		if (date) {
			if (endDate && date > endDate) {
				setError("Start date cannot be after end date");
				return;
			}
			setError("");
			setStartDate(date);
			onDateChange({ startDate: date, endDate });
		}
	};

	const handleEndDateChange = (date: Date | undefined) => {
		if (date) {
			if (date < startDate) {
				setError("End date cannot be before start date");
				return;
			}
			setError("");
			setEndDate(date);
			onDateChange({ startDate, endDate: date });
		}
	};
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<Label className="text-sm font-medium text-gray-700 mb-2 block">
					Start Date
				</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-full justify-start text-left font-normal",
								!startDate && "text-muted-foreground"
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto p-0"
						align="start"
					>
						<Calendar
							mode="single"
							selected={startDate}
							onSelect={handleStartDateChange}
							initialFocus
							className="p-3 pointer-events-auto"
						/>
					</PopoverContent>
				</Popover>
			</div>

			<div>
				<Label className="text-sm font-medium text-gray-700 mb-2 block">
					End Date
				</Label>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-full justify-start text-left font-normal",
								!endDate && "text-muted-foreground"
							)}
						>
							<CalendarIcon className="mr-2 h-4 w-4" />
							{endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						className="w-auto p-0"
						align="start"
					>
						<Calendar
							mode="single"
							selected={endDate}
							onSelect={handleEndDateChange}
							initialFocus
							className="p-3 pointer-events-auto"
						/>
					</PopoverContent>
				</Popover>
			</div>
			{error && (
				<div className="md:col-span-2 text-sm text-red-600 font-medium mt-2">
					⚠ {error}
				</div>
			)}
		</div>
	);
};

export default DateRangePicker;
