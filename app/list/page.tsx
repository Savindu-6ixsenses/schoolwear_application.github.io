import React from 'react';
import { FaArrowDown, FaEdit } from 'react-icons/fa';

const List: React.FC = () => {
  // Sample data for the list items
  const items = [
    { id: 'BRS', name: 'Blair Ridge P.S', status: 'APPROVED', date: '02/10/2024' },
    { id: 'ABC', name: 'Blair Ridge P.S', status: 'APPROVED', date: '02/10/2024' },
    { id: 'DEF', name: 'Blair Ridge P.S', status: 'APPROVED', date: '02/10/2024' },
    { id: 'HIJ', name: 'Blair Ridge P.S', status: 'APPROVED', date: '02/10/2024' },
  ];

  return (
    <div className="space-y-3 p-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border-2 border-gray-300 rounded-lg p-4 hover:shadow-md transition-all duration-200"
        >
          {/* Information Section */}
          <div className="flex items-center space-x-4">
            <div className="text-blue-600 font-bold">{item.id}</div>
            <div className="text-gray-800">{`| ${item.name} | Required on ${item.date}`}</div>
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
      ))}
    </div>
  );
};

export default List;
