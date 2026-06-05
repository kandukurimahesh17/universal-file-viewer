import React from 'react';

export const PdfOptimizer: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Optimize PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Optimize rendering speed and reduce embedded image sizes.</p>
      <div className="border border-gray-200 dark:border-gray-700 rounded p-4 mb-4">
         <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" defaultChecked id="opt1" />
            <label htmlFor="opt1" className="text-sm">Fast Web View (Linearize)</label>
         </div>
         <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" defaultChecked id="opt2" />
            <label htmlFor="opt2" className="text-sm">Downsample Images to 150 DPI</label>
         </div>
         <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" defaultChecked id="opt3" />
            <label htmlFor="opt3" className="text-sm">Remove unused fonts</label>
         </div>
         <div className="flex items-center gap-2">
            <input type="checkbox" id="opt4" />
            <label htmlFor="opt4" className="text-sm">Convert to grayscale</label>
         </div>
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Optimize</button>
      </div>
    </div>
  );
};

export default PdfOptimizer;
