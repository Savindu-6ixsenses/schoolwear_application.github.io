"use client";

import React, { useEffect, useState } from "react";
import AddToList from "./AddToList";
import { StoreProduct } from "@/types/products";

interface SingleRecordProps {
  item: StoreProduct;
  store_code: string;
  design_id: string;
}

const SingleRecord = ({ item, store_code, design_id }: SingleRecordProps) => {
  // State to track selected sizes
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: boolean }>({});

  // Initialize size state from size variations
  useEffect(() => {
    const sizesArray = item.sizeVariations?.split(",") || [];
    const initialSizes: { [key: string]: boolean } = {};

    sizesArray.forEach((size) => {
      initialSizes[size.trim()] = true;
    });

    setSelectedSizes(initialSizes);
  }, [item]);

  // Toggle size selection
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [size]: !prev[size],
    }));
  };

  const sizes = ["SM", "MD", "LG", "XL", "X2", "X3"];

  return (
    <div className="border border-gray-300 rounded-lg shadow-md bg-white mb-2">
      {/* Product Title */}
      <div className="bg-gray-800 text-white px-4 py-2 rounded-t-md">
        <h2 className="text-md font-semibold truncate">
          {item.productName}
        </h2>
      </div>

      {/* Product Details Row */}
      <div className="flex grid-cols-[150px_1fr_150px] gap-4 p-4 items-center justify-between">
        {/* Sage Code */}
        <div className="flex">
          <div className="flex items-center">
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md border border-gray-300 shadow-sm">
              {item.sageCode}
            </button>
          </div>
        </div>

        {/* Sizes */}
        <div className="flex flex-wrap gap-2">
          {sizes.map(
            (size) =>
              item[size as keyof StoreProduct] && (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1 rounded border ${
                    selectedSizes[size]
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {size}
                </button>
              )
          )}
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <AddToList
            store_code={store_code}
            product_id={item.productId}
            design_id={design_id}
            size_variations={selectedSizes}
            added_to_list={item.isAdded || false}
          />
        </div>
      </div>
    </div>
  );
};

export default SingleRecord;
