import React from 'react';

export const AddPageNumbers: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Add Page Numbers</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Insert page numbers into your PDF.</p>
      
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Position</label>
          <div className="grid grid-cols-3 gap-2 w-32 h-32 border border-gray-200 dark:border-gray-700 p-2 relative mx-auto mb-4">
             {['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map(pos => (
                <div key={pos} className={`border border-transparent hover:border-gray-300 cursor-pointer rounded ${pos === 'bc' ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-800'}`}></div>
             ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm flex-1">
          <div>
            <label className="block mb-1">Format</label>
            <select className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700">
               <option>1, 2, 3...</option>
               <option>Page 1 of 5</option>
               <option>1 / 5</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Starting Page</label>
            <input type="number" defaultValue="1" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Apply Page Numbers</button>
      </div>
    </div>
  );
};

export default AddPageNumbers;
