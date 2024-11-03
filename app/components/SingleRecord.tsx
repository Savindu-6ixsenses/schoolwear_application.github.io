'use client';

import React, { useState } from 'react';
import AddToList from './AddToList';

type Product = {
  'SAGE Code': string;
  'Product Name': string;
  'SM': boolean;
  'MD': boolean;
  'LG': boolean;
  'XL': boolean;
  'X2': boolean;
  'X3': boolean;
  'Price': number;
};

const SingleRecord= ({item,store_code}: {item: Product, store_code: string}) => {

  // State to track selected sizes
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: boolean }>({});

  // Toggle size selection
  const toggleSize = (size: string) => {
    setSelectedSizes((prevSelectedSizes) => ({
      ...prevSelectedSizes,
      [size]: !prevSelectedSizes[size],
    }));
  };

  // Array of sizes to iterate through
  const sizes = ['SM', 'MD', 'LG', 'XL', 'X2', 'X3'];

  return (
    <table className="w-full border-collapse border border-gray-700 mx-2">
      <thead>
        <tr className="bg-gray-800 text-white">
          <th colSpan={4} className="border border-gray-700 p-2 text-left">
            {item['Product Name']}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="text-black">
          {/* ID Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900 ">
            <button className="bg-gray-300 text-gray-900 px-3 py-1 rounded">
              {item['SAGE Code']}
            </button>
          </td>
          
          {/* Sizes Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                item[size as keyof Product] && ( // Only render if size is true
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1 rounded border border-gray-700 hover:shadow-lg ${
                      selectedSizes[size] ? 'bg-purple-400 text-white' : 'bg-gray-300 text-gray-900'
                    }`}
                  >
                    {size}
                  </button>
                )
              ))}
            </div>
          </td>
          
          {/* Price Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <span className="bg-gray-300 px-3 py-1 rounded">{item['Price']}</span>
          </td>
          
          {/* Actions Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <AddToList store_code={`${store_code}`} sage_code={`${item['SAGE Code']

            }`} design_code="F-FF" />
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SingleRecord;
