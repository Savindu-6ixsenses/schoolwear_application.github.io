import React, { useState } from 'react';

type Product = {
  id: string;
  name: string;
  colors: { [key: string]: number };
  sizes: { [key: string]: number };
  price: string;
};

const SingleRecord: React.FC = () => {
  const data: Product[] = [
    {
      id: 'BK.ATCF2500',
      name: 'ATC Adult Everyday Fleece Hoodie',
      colors: { Black: 0, Purple: 0, Blue: 0, Yellow: 0 },
      sizes: { Small: 0, Medium: 0, Large: 0, 'X-Large': 0, '2X-Large': 0, '3X-Large': 0 },
      price: '$29.99',
    },
  ];

  // State to track selected colors and sizes
  const [selectedColors, setSelectedColors] = useState<{ [key: string]: boolean }>({});
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: boolean }>({});

  // Toggle color selection
  const toggleColor = (color: string) => {
    setSelectedColors((prevSelectedColors) => ({
      ...prevSelectedColors,
      [color]: !prevSelectedColors[color],
    }));
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    setSelectedSizes((prevSelectedSizes) => ({
      ...prevSelectedSizes,
      [size]: !prevSelectedSizes[size],
    }));
  };

  return (
    <table className="w-full border-collapse border border-gray-700 mx-2">
      <thead>
        <tr className="bg-gray-800 text-white">
          <th colSpan={5} className="border border-gray-700 p-2 text-left">
            {data[0].name}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="text-black">
          {/* ID Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900 ">
            <button className="bg-gray-300 text-gray-900 px-3 py-1 rounded">
              {data[0].id}
            </button>
          </td>
          {/* Colors Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <div className="flex space-x-2">
              {Object.keys(data[0].colors).map((color) => (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`px-3 py-1 rounded border border-gray-700 hover:shadow-lg ${
                    selectedColors[color] ? 'bg-purple-400 text-white' : 'bg-gray-300 text-gray-900'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </td>
          {/* Sizes Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <div className="flex flex-wrap gap-2">
              {Object.keys(data[0].sizes).map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1 rounded border border-gray-700 hover:shadow-lg ${
                    selectedSizes[size] ? 'bg-purple-400 text-white' : 'bg-gray-300 text-gray-900'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </td>
          {/* Price Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <span className="bg-gray-300 px-3 py-1 rounded">{data[0].price}</span>
          </td>
          {/* Actions Column */}
          <td className="border border-gray-700 p-2 bg-gray-200 text-gray-900">
            <button className="bg-black text-white px-3 py-1 rounded hover:shadow-lg">
              Add to List
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default SingleRecord;
