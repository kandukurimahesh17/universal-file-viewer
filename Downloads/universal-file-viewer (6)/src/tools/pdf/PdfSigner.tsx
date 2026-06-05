import React from 'react';

export const PdfSigner: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Sign PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Add a signature image or text to your PDF.</p>
      
      <div className="flex gap-4">
        <div className="w-1/3 flex flex-col gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
             <span className="text-3xl block mb-2">✍️</span>
             <span className="text-sm text-gray-600">Draw Signature</span>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
             <span className="text-3xl block mb-2">🖼️</span>
             <span className="text-sm text-gray-600">Upload Image</span>
          </div>
        </div>
        <div className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 relative">
             <p className="text-xs text-gray-400 absolute top-2 right-2">PDF Preview</p>
             <div className="w-48 h-16 border border-blue-500 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center cursor-move text-blue-600 text-sm">
                Drag Signature Here
             </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Apply Signature</button>
      </div>
    </div>
  );
};

export default PdfSigner;
