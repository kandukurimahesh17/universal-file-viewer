import React from 'react';

export const UnlockPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Unlock PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Remove password from PDF (you must know the password).</p>
      <div className="border border-gray-200 dark:border-gray-700 rounded p-4 mb-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
         <span className="text-sm text-gray-700 dark:text-gray-300">File: protected.pdf</span>
         <span className="text-red-500 text-xs">🔒 Locked</span>
      </div>
      <div className="mb-4">
        <label className="block text-sm mb-1 text-gray-700">Enter Password to Unlock</label>
        <input type="password" placeholder="Password" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Unlock PDF</button>
      </div>
    </div>
  );
};

export default UnlockPdf;
