import React from 'react';

export const OfficeMetadataViewer: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
       <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Document Properties</h3>
       <div className="flex flex-col gap-2 text-sm text-gray-700 dark:text-gray-300">
         <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
           <span className="font-medium text-gray-500">File Name</span>
           <span>document.docx</span>
         </div>
         <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
           <span className="font-medium text-gray-500">File Size</span>
           <span>2.4 MB</span>
         </div>
         <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
           <span className="font-medium text-gray-500">Author</span>
           <span>Jane Doe</span>
         </div>
         <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
           <span className="font-medium text-gray-500">Created Date</span>
           <span>2023-10-15</span>
         </div>
         <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
           <span className="font-medium text-gray-500">Modified Date</span>
           <span>2023-10-16</span>
         </div>
         <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="bg-white dark:bg-gray-900 p-2 rounded text-center shadow-sm">
               <span className="block text-xl font-bold text-blue-600">12</span>
               <span className="text-xs text-gray-500">Page Count</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-2 rounded text-center shadow-sm">
               <span className="block text-xl font-bold text-green-600">4</span>
               <span className="text-xs text-gray-500">Sheet Count</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-2 rounded text-center shadow-sm">
               <span className="block text-xl font-bold text-orange-600">8</span>
               <span className="text-xs text-gray-500">Slide Count</span>
            </div>
            <div className="bg-white dark:bg-gray-900 p-2 rounded text-center shadow-sm">
               <span className="block text-xl font-bold text-purple-600">3,450</span>
               <span className="text-xs text-gray-500">Word Count</span>
            </div>
         </div>
       </div>
    </div>
  );
};

export default OfficeMetadataViewer;
