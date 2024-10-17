import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";

const NEXT_MONTH = new Date();
NEXT_MONTH.setMonth(NEXT_MONTH.getMonth() + 1);

const App = () => {
	const [value, setValue] = useState({
		startDate: new Date(),
		endDate: NEXT_MONTH,
	});

	return (
		<Datepicker
			containerClassName="relative mt-8 ml-8"
            inputClassName={"w-full h-[50px] rounded-md border border-gray-300 p-4"}
            toggleClassName={"absolute right-2 top-[6.5px] bg-white border border-gray-300 rounded-md p-2"}
            displayFormat="DD/MM/YYYY"
            separator="to"
            placeholder="<Start Date> to <End Date>"
            minDate={new Date()}
			primaryColor={"rose"}
			value={value}
			onChange={(newValue) => setValue(newValue)}
			showShortcuts={true}
		/>
	);
};

export default App;
