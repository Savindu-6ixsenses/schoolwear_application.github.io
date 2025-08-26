
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
import DateRangePicker from "../Calender/DateRangePicker";
import { FormData } from "@/types/store";

interface StoreDetailsStepProps {
  formData: FormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  dateRange: { startDate: Date; endDate: Date };
  setDateRange: (range: { startDate: Date; endDate: Date }) => void;
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
}

const StoreDetailsStep: React.FC<StoreDetailsStepProps> = ({ 
  formData, 
  handleChange, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dateRange, 
  setDateRange, 
  // agreedToTerms, 
  // setAgreedToTerms 
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Details</h2>
        <p className="text-gray-600">Final step - store configuration</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="storeCode" className="text-sm font-medium text-gray-700">
            Store Code *
          </Label>
          <Input
            id="storeCode"
            name="storeCode"
            type="text"
            value={formData.storeCode}
            onChange={handleChange}
            placeholder={`Enter store code (e.g., ${formData.storeCode? formData.storeCode : "ABC"}-XX )`}
            className="mt-1"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Must be alphanumeric with optional hyphens</p>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Time Duration *
          </Label>
          <DateRangePicker onDateChange={setDateRange} />
        </div>

        {/* <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={setAgreedToTerms}
            className="mt-1"
          />
          <div className="flex-1">
            <Label 
              htmlFor="terms" 
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              I agree to the terms and conditions *
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              By checking this box, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default StoreDetailsStep;
