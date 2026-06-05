import React, { useState } from 'react';

export const DocumentScanner: React.FC = () => {
  const [pages, setPages] = useState<number[]>([]);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Document Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Camera → PDF. Features multi-page scan, edge detection, crop, and perspective correction.</p>
      
      <div className="w-full aspect-[3/4] max-h-[400px] bg-black rounded-lg flex items-center justify-center mb-4 relative overflow-hidden mx-auto">
         <span className="text-gray-500 text-sm">Live Camera Feed</span>
         <div className="absolute inset-8 border-2 border-green-500/50 rounded pointer-events-none flex items-center justify-center">
            <span className="text-green-500/70 text-xs">Edge Detection Active</span>
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500"></div>
         </div>
         <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button 
              onClick={() => setPages(p => [...p, p.length + 1])}
              className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
            />
         </div>
      </div>

      {pages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Scanned Pages ({pages.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pages.map(page => (
              <div key={page} className="shrink-0 relative group">
                <div className="w-20 h-28 bg-gray-200 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center">
                   <span className="text-xs text-gray-500">Page {page}</span>
                   <div className="flex gap-1 mt-2 flex-wrap justify-center px-1">
                      <button className="text-[10px] bg-white dark:bg-gray-700 px-1 rounded shadow-sm">Crop</button>
                      <button className="text-[10px] bg-white dark:bg-gray-700 px-1 rounded shadow-sm">Filter</button>
                   </div>
                </div>
                <button className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs hidden group-hover:flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-medium">Save Draft</button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50" disabled={pages.length === 0}>Export PDF</button>
      </div>
    </div>
  );
};

export default DocumentScanner;
