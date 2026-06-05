import React from 'react';

export const ImageScanner: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Image Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan an image from your gallery, convert it to a document, and enhance its readability.</p>
      
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800 mb-6 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
        <div className="text-4xl mb-3">🖼️</div>
        <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">Upload Image from Gallery</p>
        <p className="text-xs text-gray-500">Supports JPG, PNG, HEIC</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow text-sm font-medium">Select Image</button>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
         <h3 className="text-sm font-semibold mb-3">Enhancement Options</h3>
         <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm">
               <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               Auto-Enhance Contrast
            </label>
            <label className="flex items-center gap-2 text-sm">
               <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               Convert to Grayscale (B&W)
            </label>
            <label className="flex items-center gap-2 text-sm">
               <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               Remove Shadows
            </label>
            <label className="flex items-center gap-2 text-sm">
               <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
               Sharpen Text
            </label>
         </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium">Process Image</button>
      </div>
    </div>
  );
};

export default ImageScanner;
