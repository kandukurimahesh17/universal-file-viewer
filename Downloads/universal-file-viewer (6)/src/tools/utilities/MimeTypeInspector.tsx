import React, { useState } from 'react';

export const MimeTypeInspector: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">MIME Type Inspector</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Display extension, MIME type, category, and encoding for uploaded files.</p>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 mb-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
         <div className="text-3xl mb-2 text-blue-500">🔍</div>
         <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop a file to inspect its metadata</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
         <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm">
            Inspection Result: <span className="font-mono font-normal text-blue-600 dark:text-blue-400">document.pdf</span>
         </div>
         <div className="p-4 flex flex-col gap-4 text-sm">
            <div className="flex">
               <span className="w-1/3 text-gray-500 font-medium">Extension</span>
               <span className="font-mono text-gray-900 dark:text-gray-100">.pdf</span>
            </div>
            <div className="flex">
               <span className="w-1/3 text-gray-500 font-medium">MIME Type</span>
               <span className="font-mono text-green-600 dark:text-green-400">application/pdf</span>
            </div>
            <div className="flex">
               <span className="w-1/3 text-gray-500 font-medium">Category</span>
               <span className="text-gray-900 dark:text-gray-100">Document / Portable Document Format</span>
            </div>
            <div className="flex">
               <span className="w-1/3 text-gray-500 font-medium">Encoding</span>
               <span className="font-mono text-gray-900 dark:text-gray-100">binary</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MimeTypeInspector;
