import React from 'react';

export const RemovePages: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Remove Pages</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Delete selected pages from the PDF.</p>
      <div className="grid grid-cols-4 gap-4 mb-4">
         {[1, 2, 3, 4].map(page => (
           <div key={page} className="border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-2 text-center relative cursor-pointer">
              <div className="w-full aspect-[1/1.4] bg-white dark:bg-black opacity-50 flex items-center justify-center text-xs text-gray-400 mb-2">Page {page}</div>
              <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow">✕</button>
           </div>
         ))}
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-red-600 text-white rounded">Apply Changes</button>
      </div>
    </div>
  );
};

export default RemovePages;
