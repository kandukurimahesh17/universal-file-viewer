import React from 'react';

export const OfficePreview: React.FC<{ type?: 'docx' | 'xlsx' | 'pptx' | 'odt' | 'ods' | 'odp' }> = ({ type = 'docx' }) => {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
       <div className="bg-gray-200 dark:bg-gray-800 p-2 text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-between">
         <span>Preview</span>
         <span className="uppercase text-blue-600 dark:text-blue-400">{type}</span>
       </div>
       <div className="flex-1 p-4 flex items-center justify-center min-h-[200px]">
         <div className="bg-white dark:bg-black shadow-md w-3/4 aspect-[1/1.4] border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
            <span className="text-4xl text-gray-300 mb-2">📄</span>
            <span className="text-sm text-gray-400 font-medium">Document Preview</span>
         </div>
       </div>
    </div>
  );
};

export default OfficePreview;
