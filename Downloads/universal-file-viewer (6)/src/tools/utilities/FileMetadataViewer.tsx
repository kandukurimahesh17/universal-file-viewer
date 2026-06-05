import React from 'react';

export const FileMetadataViewer: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">File Metadata Viewer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">View exhaustive metadata properties of any file.</p>
      
      <div className="flex gap-4">
        <div className="w-1/3 border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 rounded flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
           <span className="text-4xl text-gray-400 mb-2">📄</span>
           <span className="text-sm font-medium">Upload File</span>
        </div>
        
        <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
           <div className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
              <span className="font-semibold text-gray-500">File Name</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">presentation_v2.pptx</span>
              
              <span className="font-semibold text-gray-500">Path</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">/Downloads/Work/</span>
              
              <span className="font-semibold text-gray-500">Size</span>
              <span className="text-gray-900 dark:text-gray-100">4.2 MB (4,404,019 bytes)</span>
              
              <span className="font-semibold text-gray-500">Extension</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">.pptx</span>
              
              <span className="font-semibold text-gray-500">MIME Type</span>
              <span className="font-mono text-green-600 dark:text-green-400">application/vnd.openxmlformats-officedocument.presentationml.presentation</span>
              
              <span className="font-semibold text-gray-500">Created Date</span>
              <span className="text-gray-900 dark:text-gray-100">Oct 12, 2023, 10:14 AM</span>
              
              <span className="font-semibold text-gray-500">Modified Date</span>
              <span className="text-gray-900 dark:text-gray-100">Oct 16, 2023, 03:45 PM</span>
              
              <span className="font-semibold text-gray-500">Last Accessed</span>
              <span className="text-gray-900 dark:text-gray-100">Oct 16, 2023, 04:00 PM</span>
              
              <span className="font-semibold text-gray-500">Hash (MD5)</span>
              <span className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-1 rounded break-all">f7e8a931bb45428a213e2dfb...</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FileMetadataViewer;
