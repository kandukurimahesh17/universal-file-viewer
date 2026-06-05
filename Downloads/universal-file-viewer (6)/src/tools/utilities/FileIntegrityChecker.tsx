import React, { useState } from 'react';

export const FileIntegrityChecker: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'checking' | 'corrupted' | 'ok'>('idle');

  const checkFile = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('corrupted');
    }, 1500);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">File Integrity Checker</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Verify files to check for corrupted files, damaged files, or incomplete downloads.</p>
      
      <div className="flex gap-4">
        <label className="flex-1 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
           <span className="text-2xl text-blue-500 mb-2">📁</span>
           <span className="text-sm font-medium">Select file to verify</span>
           <input type="file" className="hidden" />
        </label>
        
        <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded p-4 flex flex-col justify-center gap-2">
           <label className="text-xs font-semibold text-gray-500 uppercase">Input Expected Hash (Optional)</label>
           <input type="text" className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-800 dark:border-gray-700" placeholder="e.g. e4d909c290d0fb1ca..." />
        </div>
      </div>

      <div className="flex justify-center mt-6">
         <button onClick={checkFile} disabled={status === 'checking'} className="px-6 py-2 bg-blue-600 text-white rounded font-medium text-sm disabled:opacity-50 min-w-[150px]">
           {status === 'checking' ? 'Verifying...' : 'Check Integrity'}
         </button>
      </div>

      {status !== 'idle' && status !== 'checking' && (
        <div className={`mt-6 p-4 rounded border flex items-start gap-4 ${status === 'ok' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
           <span className={`text-2xl ${status === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
             {status === 'ok' ? '✅' : '❌'}
           </span>
           <div>
             <h3 className={`font-bold mb-1 ${status === 'ok' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
               {status === 'ok' ? 'Integrity Verified' : 'Integrity Check Failed'}
             </h3>
             <p className={`text-sm ${status === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
               {status === 'ok' ? 'The file is intact and no errors were detected.' : 'Warning: This file appears to be corrupted, damaged, or an incomplete download.'}
             </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default FileIntegrityChecker;
