// ListItem.tsx - Client Component
"use client";

import { useRouter } from "next/navigation";
import { FaArrowDown, FaEdit } from "react-icons/fa";
import { StoreCreationProps } from "@/types/store";

interface ListItemProps {
  item: StoreCreationProps;
}

const ListItem: React.FC<ListItemProps> = ({ item }) => {
  const router = useRouter();

  // Handle click to navigate to the dynamic route
  const handleClick = () => {
    router.push(`/${item.store_code}/F-FF`);
  };

  return (
    <div
      key={item.store_code}
      onClick={handleClick}
      className="flex items-center justify-between border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      {/* Information Section */}
      <div className="flex items-center space-x-4">
        <div className="text-blue-600 font-bold">{item.store_code}</div>
        <div className="text-gray-800">{`| ${item.store_name} | Required on ${item.end_date}`}</div>
      </div>

      {/* Status Section */}
      <div className="flex items-center space-x-4">
        <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm">
          {item.status}
        </span>
        {/* Action Icons */}
        <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 text-black">
          <FaArrowDown />
        </button>
        <button className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 text-black">
          <FaEdit />
        </button>
      </div>
    </div>
  );
};

export default ListItem;
