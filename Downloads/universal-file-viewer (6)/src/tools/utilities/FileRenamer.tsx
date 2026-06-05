import React, { useState } from 'react';

export const FileRenamer: React.FC = () => {
  const [fileName, setFileName] = useState('document_v1_final.pdf');
  const [newFileName, setNewFileName] = useState('');

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">File Renamer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Rename a single file easily.</p>
      
      <div className="flex flex-col gap-4 max-w-md">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4">
           <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Current File Name</label>
           <div className="font-mono text-sm">{fileName}</div>
        </div>
        
        <div>
           <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">New File Name</label>
           <input 
             type="text" 
             className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm" 
             placeholder="Enter new name..." 
             value={newFileName}
             onChange={(e) => setNewFileName(e.target.value)}
           />
        </div>
        
        <div className="flex justify-end mt-2">
           <button 
             onClick={() => {
                if (newFileName) {
                  setFileName(newFileName);
                  setNewFileName('');
                }
             }}
             className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">
             Rename File
           </button>
        </div>
      </div>
    </div>
  );
};

export default FileRenamer;
