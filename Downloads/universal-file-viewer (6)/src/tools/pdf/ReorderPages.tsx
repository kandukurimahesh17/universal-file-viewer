import React from 'react';

export const ReorderPages: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Reorder Pages</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Drag and drop to rearrange pages.</p>
      <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
         {[3, 1, 4, 2].map(page => (
           <div key={page} className="shrink-0 w-24 border border-gray-200 dark:border-gray-700 p-2 text-center cursor-move shadow-sm bg-white dark:bg-gray-800">
              <div className="w-full aspect-[1/1.4] bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-xs text-gray-400 mb-2">Page {page}</div>
              <span className="text-xs font-mono border rounded px-2">::{page}::</span>
           </div>
         ))}
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Save Order</button>
      </div>
    </div>
  );
};

export default ReorderPages;
