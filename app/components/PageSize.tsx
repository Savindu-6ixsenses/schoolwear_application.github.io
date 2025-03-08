import React from "react";

interface PageSizeProps {
  pageSize: number;
  setPageSize: (size: number) => void;
}

const PageSize: React.FC<PageSizeProps> = ({ pageSize, setPageSize }) => {
  return (
    <div className="flex flex-row mt-4 ml-2 items-baseline">
      <label className="block text-sm font-medium text-black mr-2">
        Page Size:
      </label>
      <select
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        className="border border-black text-black px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
    </div>
  );
};

export default PageSize;
