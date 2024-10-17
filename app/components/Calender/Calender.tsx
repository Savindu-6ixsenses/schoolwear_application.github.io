import React, { useState } from 'react'
import 'react-datepicker/dist/react-datepicker.css';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs from 'dayjs';


const Calender = () => {

    // State to store the selected dates
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);

    return (
    <div className='flex flex-col items-center pt-7'>
        <LocalizationProvider dateAdapter={AdapterDayjs}><StaticDatePicker defaultValue={dayjs()}/></LocalizationProvider>
      </div>
  )
}

export default Calender



// https://mui.com/x/api/date-pickers/static-date-picker/
// https://mui.com/x/react-date-pickers/timezone/#usage-with-day-js
// https://mui.com/x/react-date-pickers/date-picker/#available-components