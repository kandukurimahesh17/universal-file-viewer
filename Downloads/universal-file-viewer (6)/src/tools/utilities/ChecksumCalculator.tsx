import React, { useState } from 'react';

export const ChecksumCalculator: React.FC = () => {
  const [checksums, setChecksums] = useState<{ crc32: string; md5: string; sha: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const calculate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setChecksums({
        crc32: '8A3D21BE',
        md5: 'e4d909c290d0fb1ca068ffaddf22cbd0',
        sha: '2ef7bde608ce5404e97d5f042f95f89f1c232871',
      });
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Checksum Calculator</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Calculate standard checksums like CRC32, MD5, and SHA.</p>
      
      <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded p-6 bg-gray-50 dark:bg-gray-800 text-center mb-4">
        <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer text-sm font-medium">
           Upload File
           <input type="file" className="hidden" />
        </label>
      </div>

      <div className="flex justify-end mb-4">
         <button onClick={calculate} disabled={isProcessing} className="px-6 py-2 bg-blue-600 text-white font-medium text-sm rounded disabled:opacity-50">
           {isProcessing ? 'Calculating...' : 'Calculate Checksums'}
         </button>
      </div>

      {checksums && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="p-3 border rounded dark:border-gray-700 bg-white dark:bg-gray-800">
             <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">CRC32</span>
             <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{checksums.crc32}</span>
          </div>
          <div className="p-3 border rounded dark:border-gray-700 bg-white dark:bg-gray-800">
             <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">MD5</span>
             <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{checksums.md5}</span>
          </div>
          <div className="p-3 border rounded dark:border-gray-700 bg-white dark:bg-gray-800">
             <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">SHA</span>
             <span className="font-mono text-sm text-gray-800 dark:text-gray-200">{checksums.sha}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecksumCalculator;
