import React from 'react';

export const ExcelToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Excel to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert XLSX to PDF with multi-sheet support.</p>
      
      <div className="border border-gray-200 dark:border-gray-700 p-4 rounded mb-4">
        <div className="flex flex-col gap-3">
           <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
             <input type="radio" name="orientation" defaultChecked /> Portrait mode
           </label>
           <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
             <input type="radio" name="orientation" /> Landscape mode
           </label>
           <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mt-2">
             <input type="checkbox" defaultChecked /> Fit-to-page
           </label>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <p className="text-gray-500 mb-2">Upload XLSX file</p>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Select File</button>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
      </div>
    </div>
  );
};

export default ExcelToPdf;
