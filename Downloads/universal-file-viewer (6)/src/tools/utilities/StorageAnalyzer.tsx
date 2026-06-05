import React from 'react';

export const StorageAnalyzer: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Storage Analyzer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Analyze total storage, used storage, and free storage broken down by category.</p>
      
      <div className="mb-8">
         <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-gray-800 dark:text-gray-200">Used Storage: 75 GB</span>
            <span className="text-gray-500">Total: 100 GB</span>
         </div>
         <div className="w-full h-6 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div className="h-full bg-blue-500" style={{ width: '35%' }} title="Images: 35%"></div>
            <div className="h-full bg-green-500" style={{ width: '20%' }} title="Videos: 20%"></div>
            <div className="h-full bg-yellow-500" style={{ width: '10%' }} title="Documents: 10%"></div>
            <div className="h-full bg-purple-500" style={{ width: '5%' }} title="Audio: 5%"></div>
            <div className="h-full bg-red-500" style={{ width: '5%' }} title="Archives: 5%"></div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
         <div className="p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded">
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Images</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">35 GB</p>
         </div>
         <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 rounded">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">Videos</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">20 GB</p>
         </div>
         <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 rounded">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Documents</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">10 GB</p>
         </div>
         <div className="p-4 border border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800 rounded">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Audio</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">5 GB</p>
         </div>
         <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 rounded">
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">Archives</h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">5 GB</p>
         </div>
         <div className="p-4 border border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 rounded flex flex-col justify-center items-center">
            <span className="text-sm text-gray-500 uppercase tracking-widest font-semibold">Free Space</span>
            <p className="text-2xl font-light text-gray-700 dark:text-gray-300">25 GB</p>
         </div>
      </div>
    </div>
  );
};

export default StorageAnalyzer;
