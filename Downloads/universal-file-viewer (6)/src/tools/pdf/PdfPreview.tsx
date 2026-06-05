import React from 'react';

export const PdfPreview: React.FC<{ file?: File | null }> = ({ file }) => {
  return (
    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
       {file ? (
         <div className="flex flex-col items-center gap-2 p-4">
             <div className="text-4xl">📄</div>
             <div className="text-sm font-medium text-center truncate w-full max-w-[200px]">{file.name}</div>
             <div className="text-xs text-gray-500 w-full aspect-[1/1.4] bg-white dark:bg-gray-900 shadow mt-2 flex items-center justify-center">
               Preview Content
             </div>
         </div>
       ) : (
         <p className="text-sm text-gray-500 p-4 text-center">No preview available</p>
       )}
    </div>
  );
};

export default PdfPreview;
