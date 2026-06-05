import React from 'react';
import { Download } from 'lucide-react';
import { FileOperations } from '../filemanager/FileOperations';

export const EpubViewer: React.FC<{ file?: any, isDark?: boolean }> = ({ file, isDark }) => {
  const handleDownload = () => {
    if (file?.blob) {
      FileOperations.downloadBlob(file.blob, file.name);
    }
  };

  const formattedSize = file?.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size';

  return (
    <div className={`flex flex-col h-full w-full justify-center items-center p-8 bg-gray-50 dark:bg-gray-900 ${isDark ? 'text-white' : 'text-black'}`}>
       <div className="w-full max-w-lg bg-white dark:bg-black rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-800 p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full flex items-center justify-center text-3xl mb-4">
            📚
          </div>
          <h2 className="text-xl font-bold mb-1 truncate max-w-full">{file?.name || 'book.epub'}</h2>
          <p className="text-xs text-gray-500 mb-6">{formattedSize}</p>
          
          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl text-xs text-left text-gray-500 dark:text-gray-400 mb-6 border border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">EPUB Ebook Format File</p>
            <p>This is a real ebook file. EPUB layout parsing and flow mechanics inside web browser canvas requires complex native rendering layers. You can download the file to read it on your preferred ebook library.</p>
          </div>

          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer shadow-sm">
            <Download size={16} />
            Download EPUB File
          </button>
       </div>
    </div>
  );
};

export default EpubViewer;
