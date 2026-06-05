import React from 'react';

export const ExtractPages: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Extract Pages</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Extract selected pages into a new PDF.</p>
      <div className="grid grid-cols-4 gap-4 mb-4">
         {[1, 2, 3, 4, 5, 6, 7, 8].map(page => (
           <div key={page} className="border border-gray-200 dark:border-gray-700 p-2 text-center relative cursor-pointer hover:border-blue-500">
              <div className="w-full aspect-[1/1.4] bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-400 mb-2">Page {page}</div>
              <input type="checkbox" className="absolute top-2 left-2" />
           </div>
         ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">0 pages selected</span>
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Extract Selected</button>
      </div>
    </div>
  );
};

export default ExtractPages;
