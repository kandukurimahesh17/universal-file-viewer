import React from 'react';

export const HtmlToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">HTML to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert local HTML files to print-quality PDF export.</p>
      
      <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10 rounded p-8 text-center transition-colors">
        <span className="text-4xl block mb-2 text-blue-500">📄</span>
        <p className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Upload HTML File</p>
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm mt-2">Select HTML</button>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 dark:bg-gray-100 dark:text-gray-900">Generate PDF</button>
      </div>
    </div>
  );
};

export default HtmlToPdf;
