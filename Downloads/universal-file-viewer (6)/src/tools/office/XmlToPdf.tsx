import React from 'react';

export const XmlToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">XML to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert XML to PDF with formatted output and syntax highlighting.</p>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <div className="text-2xl mb-2 text-green-600">{'</>'}</div>
        <p className="text-gray-500 mb-2">Upload XML file</p>
        <button className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300">Browse Files</button>
      </div>

      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Export as PDF</button>
      </div>
    </div>
  );
};

export default XmlToPdf;
