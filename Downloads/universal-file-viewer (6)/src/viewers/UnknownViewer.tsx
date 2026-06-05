import React from 'react';
import { FileOperations } from '../filemanager/FileOperations';

export const UnknownViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const handleDownload = () => {
    if (file?.blob) {
      FileOperations.downloadBlob(file.blob, file.name);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full justify-center items-center bg-gray-50 dark:bg-[#0a0a0a] ${isDark ? 'text-white' : 'text-black'}`}>
       <div className="flex flex-col items-center gap-6 p-12 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-4xl text-gray-400">
            🗋
          </div>
          <div className="text-center">
             <h2 className="text-xl font-semibold mb-2">{file?.name || 'unknown.dat'}</h2>
             <p className="text-sm text-gray-500 mb-6">File type not supported for rendering online</p>
             <div className="flex gap-4 justify-center">
               <button 
                 onClick={handleDownload}
                 className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors cursor-pointer">
                 Download and View Local
               </button>
             </div>
          </div>
       </div>
    </div>
  );
};

export default UnknownViewer;
