import React from 'react';

export const PdfScanner: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">PDF Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan physical documents to PDF using your camera.</p>
      <div className="w-full aspect-video bg-black rounded-lg flex items-center justify-center mb-4 relative overflow-hidden">
         <span className="text-gray-500 text-sm">Camera Feed Preview</span>
         <div className="absolute inset-x-8 inset-y-8 border-2 border-white/50 rounded flex items-center justify-center">
            <span className="text-white/70 text-xs">Document Area</span>
         </div>
      </div>
      <div className="flex gap-4 justify-center mt-4">
        <button className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 dark:border-gray-500 shadow-md flex items-center justify-center hover:bg-gray-100"></button>
      </div>
      <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-4 flex gap-2 overflow-x-auto">
         {/* Scanned pages thumbnails */}
         <div className="w-16 h-24 bg-gray-200 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">1</div>
         <div className="w-16 h-24 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded flex items-center justify-center text-xl text-gray-400">+</div>
      </div>
      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Save as PDF</button>
      </div>
    </div>
  );
};

export default PdfScanner;
