'use client';

import React, { useState } from 'react';
import SingleAddForm from './SingleAddForm';
import BulkCsvUploader from './BulkCsvUploader';

export default function ProductsManager() {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Products Manager</h1>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1 mb-6">
        <button
          onClick={() => setActiveTab('single')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'single' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Add Single
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeTab === 'bulk' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Bulk CSV Upload
        </button>
      </div>

      {activeTab === 'single' ? <SingleAddForm /> : <BulkCsvUploader />}
    </div>
  );
}


