import React, { useState } from 'react';

export const BatchFileRenamer: React.FC = () => {
  const [files, _setFiles] = useState([
    'DCIM_001.jpg',
    'DCIM_002.jpg',
    'DCIM_003.jpg',
    'DCIM_004.jpg',
  ]);
  const [prefix, setPrefix] = useState('IMG_');
  const [startNumber, setStartNumber] = useState(1);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Batch File Renamer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Rename 100+ or 1000+ files at once using patterns (e.g. IMG_001, IMG_002).</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 mb-4 text-sm flex flex-col gap-3">
             <h3 className="font-semibold text-gray-800 dark:text-gray-200">Rename Pattern</h3>
             <div>
               <label className="block mb-1 text-gray-600 dark:text-gray-400">Prefix</label>
               <input type="text" className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700" value={prefix} onChange={e => setPrefix(e.target.value)} />
             </div>
             <div>
               <label className="block mb-1 text-gray-600 dark:text-gray-400">Start Numbering At</label>
               <input type="number" className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700" value={startNumber} onChange={e => setStartNumber(Number(e.target.value))} />
             </div>
             <div>
               <label className="block mb-1 text-gray-600 dark:text-gray-400">Padding (e.g., 001)</label>
               <select className="w-full p-2 border rounded dark:bg-gray-900 dark:border-gray-700">
                  <option>3 Digits</option>
                  <option>4 Digits</option>
               </select>
             </div>
          </div>
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700">Apply Batch Rename</button>
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">
            Preview Changes
          </div>
          <div className="p-0 flex-1 overflow-auto bg-white dark:bg-gray-900 text-sm">
            {files.map((file, i) => (
              <div key={i} className="flex justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-2">
                 <span className="text-gray-500 line-through dark:text-gray-500">{file}</span>
                 <span className="text-green-600 dark:text-green-400 font-mono">
                    {prefix}{(startNumber + i).toString().padStart(3, '0')}.jpg
                 </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchFileRenamer;
