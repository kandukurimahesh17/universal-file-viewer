import React from 'react';

export const AddHeaderFooter: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Header & Footer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add custom header/footer text to your PDF.</p>
      
      <div className="flex flex-col gap-4 mb-4">
         <div className="flex gap-2">
            <input type="text" placeholder="Left Header" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
            <input type="text" placeholder="Center Header" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
            <input type="text" placeholder="Right Header" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
         </div>
         <div className="h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">
            Document Content
         </div>
         <div className="flex gap-2">
            <input type="text" placeholder="Left Footer" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
            <input type="text" placeholder="Center Footer" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
            <input type="text" placeholder="Right Footer" className="w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
         </div>
      </div>
      
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Apply Header/Footer</button>
      </div>
    </div>
  );
};

export default AddHeaderFooter;
