import React, { useState } from 'react';

export const FileHashGenerator: React.FC = () => {
  const [hashResults, setHashResults] = useState<{ md5: string; sha1: string; sha256: string; sha512: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setHashResults({
        md5: 'e4d909c290d0fb1ca068ffaddf22cbd0',
        sha1: '2ef7bde608ce5404e97d5f042f95f89f1c232871',
        sha256: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        sha512: 'b0a7019f2a00c144e59f42d2a13cc26514781ebef72b53e839eab728032486cf1e4a',
      });
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">File Hash Generator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Generate MD5, SHA1, SHA256, and SHA512 hashes for file verification and integrity checking.</p>
      
      <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800 mb-6 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
        <p className="text-gray-500 font-medium">Drag & Drop file here</p>
        <button className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded shadow">Select File</button>
      </div>

      <div className="flex justify-end mb-6">
        <button onClick={handleGenerate} disabled={isProcessing} className="px-6 py-2 bg-green-600 text-white rounded font-medium text-sm disabled:opacity-50">
          {isProcessing ? 'Generating...' : 'Generate Hashes'}
        </button>
      </div>

      {hashResults && (
        <div className="grid grid-cols-1 gap-4">
           {Object.entries(hashResults).map(([algo, hash]) => (
             <div key={algo} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{algo}</span>
                 <button className="text-xs text-blue-600 hover:underline">Copy</button>
               </div>
               <div className="font-mono text-sm text-gray-600 dark:text-gray-400 break-all">{hash}</div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default FileHashGenerator;
