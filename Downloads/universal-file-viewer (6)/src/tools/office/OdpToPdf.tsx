import React from 'react';

export const OdpToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">ODP to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert OpenDocument Presentation (ODP) files to PDF.</p>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <p className="text-gray-500 mb-2">Upload ODP file</p>
        <button className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">Select File</button>
      </div>
      
      <div className="mt-4 flex justify-end gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
      </div>
    </div>
  );
};

export default OdpToPdf;
