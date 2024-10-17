import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Calender = () => {
  const [startDate, setStartDate] = useState<Date|null>(null); 
  const [endDate, setEndDate] = useState<Date|null>(null);

  return (
    <div className='flex flex-col items-center pt-1'>
      <div className='text-lg font-medium mb-4'>Pick the start date & end date</div>
      
      <div className='flex space-x-4'>
        <div>
          <label className='block text-sm font-medium mb-1'>Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className='border border-gray-300 p-2 rounded-md w-full'
            placeholderText="Select start date"
            dateFormat="MM/dd/yyyy"
            minDate={new Date()} // Disable past dates
          />
        </div>

        {/* End Date Picker */}
        <div>
          <label className='block text-sm font-medium mb-1'>End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className='border border-gray-300 p-2 rounded-md w-full'
            placeholderText="Select end date"
            dateFormat="MM/dd/yyyy"
            minDate={startDate? startDate : new Date()} 
          />
        </div>
      </div>
    </div>
  );
}

export default Calender;
