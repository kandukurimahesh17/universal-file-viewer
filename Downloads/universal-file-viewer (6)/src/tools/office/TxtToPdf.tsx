import React from 'react';

export const TxtToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Text to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert TXT to PDF with customizable font and margins.</p>
      
      <div className="grid grid-cols-2 gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded mb-4 bg-gray-50 dark:bg-gray-800 text-sm">
        <div>
           <label className="block mb-1 text-gray-600 dark:text-gray-300">Custom Font Size</label>
           <input type="number" defaultValue="12" className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600" />
        </div>
        <div>
           <label className="block mb-1 text-gray-600 dark:text-gray-300">Margins</label>
           <select className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-600">
              <option>Normal</option>
              <option>Narrow</option>
              <option>Wide</option>
           </select>
        </div>
        <div className="col-span-2">
           <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
             <input type="checkbox" defaultChecked /> Include page numbers
           </label>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        <p className="text-gray-500 mb-2">Upload TXT file</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Select File</button>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Convert to PDF</button>
      </div>
    </div>
  );
};

export default TxtToPdf;
