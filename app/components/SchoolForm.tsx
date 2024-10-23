"use client";

import React, { useState } from "react";
import Calender from "./Calender/Calender3";
import { StoreCreationProps } from "@/types/store";

const NEXT_MONTH = new Date();
NEXT_MONTH.setMonth(NEXT_MONTH.getMonth() + 1);

const SchoolForm = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    accountManager: "",
    address: "",
    mainClientContact: "",
    mainClientContactNo: "",
    storeCode: "",
  });

  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(),
    endDate: NEXT_MONTH,
  });

  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (newDateRange: {
    startDate: Date;
    endDate: Date;
  }) => {
    setDateRange(newDateRange);
  };

  const handleSubmit = async () => {
    const storeCreationBody: StoreCreationProps = {
      storeName: formData.schoolName,
      accountManager: formData.accountManager,
      mainClientContact: formData.mainClientContact,
      mainClientContactNumber: formData.mainClientContactNo,
      storeAddress: formData.address,
      StoreCode: formData.storeCode,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString(),
    };

    try {
      const response = await fetch('/api/store_creation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storeCreationBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setResponseMessage(`Failed to create the store: ${errorText}`);
        return;
      }

      const result = await response.json();
      setResponseMessage(`Store created successfully: ${JSON.stringify(result)}`);
    } catch (error : any) {
      setResponseMessage(`Error creating the store: ${error.message}`);
    }
  };

  return (
    <div className="grid grid-cols-2 w-[1495px] h-[595px] text-black border-2 border-red-600 bg-[#F6F6F6] px-[85px] pt-3">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">
            Name of School/Team
          </label>
          <input
            type="text"
            name="schoolName"
            value={formData.schoolName}
            onChange={handleChange}
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
            name="accountManager"
            value={formData.accountManager}
            onChange={handleChange}
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
            name="address"
            value={formData.address}
            onChange={handleChange}
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
            name="mainClientContact"
            value={formData.mainClientContact}
            onChange={handleChange}
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
            name="mainClientContactNo"
            value={formData.mainClientContactNo}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md"
            placeholder="9056201221"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Store Code</label>
          <input
            type="text"
            name="storeCode"
            value={formData.storeCode}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded-md"
            placeholder="BRS"
          />
        </div>
      </div>
      <Calender onDateChange={handleDateChange} />
      <div>
        <button
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
          onClick={handleSubmit}
        >
          Create the WebStore
        </button>
      </div>
      {responseMessage && (
        <div className="col-span-2 mt-4 p-4 border border-gray-300 rounded-md">
          {responseMessage}
        </div>
      )}
    </div>
  );
};

export default SchoolForm;
