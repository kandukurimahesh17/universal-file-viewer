import React, { useState } from 'react';

export const FileDuplicateFinder: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const scan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setDuplicates([
        { original: 'image_1.jpg', size: '2.4 MB', duplicate: 'image_1_copy.jpg' },
        { original: 'report.pdf', size: '1.1 MB', duplicate: 'report(1).pdf' },
        { original: 'video.mp4', size: '15.2 MB', duplicate: 'video_backup.mp4' },
      ]);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">File Duplicate Finder</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Scan storage for duplicate images, PDFs, videos, and other files to free up space.</p>
      
      <div className="flex gap-4 mb-6">
        <button onClick={scan} disabled={isScanning} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50">
          {isScanning ? 'Scanning Directory...' : 'Scan for Duplicates'}
        </button>
      </div>

      {duplicates.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                 <th className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Original File</th>
                 <th className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Size</th>
                 <th className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">Duplicate File</th>
                 <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                   <td className="px-4 py-3">{item.original}</td>
                   <td className="px-4 py-3 text-gray-500">{item.size}</td>
                   <td className="px-4 py-3 text-red-600 dark:text-red-400">{item.duplicate}</td>
                   <td className="px-4 py-3 text-right">
                      <button className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded font-medium mr-2 hover:bg-red-200 dark:hover:bg-red-900/50">Delete</button>
                      <button className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Move</button>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 flex justify-between items-center">
             <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{duplicates.length} duplicates found</span>
             <button className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700">Delete All Duplicates</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDuplicateFinder;
