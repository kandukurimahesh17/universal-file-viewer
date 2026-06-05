import React from 'react';

export const DiskUsageAnalyzer: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Disk Usage Analyzer</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">See largest folders, largest files, and storage breakdown.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
               <h3 className="font-semibold text-sm">Largest Folders</h3>
            </div>
            <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-800">
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="flex items-center gap-2"><span>📁</span> /Users/home/Movies</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">45 GB</span>
               </li>
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="flex items-center gap-2"><span>📁</span> /Users/home/Downloads</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">12 GB</span>
               </li>
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="flex items-center gap-2"><span>📁</span> /Users/home/Pictures</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400">8 GB</span>
               </li>
            </ul>
         </div>

         <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
               <h3 className="font-semibold text-sm">Largest Files</h3>
            </div>
            <ul className="text-sm divide-y divide-gray-100 dark:divide-gray-800">
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="truncate mr-2 text-blue-600 dark:text-blue-400 font-mono text-xs">wedding_video_4k.mp4</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">8.4 GB</span>
               </li>
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="truncate mr-2 text-blue-600 dark:text-blue-400 font-mono text-xs">ubuntu-22.04-desktop-amd64.iso</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">3.6 GB</span>
               </li>
               <li className="flex justify-between p-3 bg-white dark:bg-gray-900">
                  <span className="truncate mr-2 text-blue-600 dark:text-blue-400 font-mono text-xs">database_backup_2023.sql.gz</span>
                  <span className="font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">1.2 GB</span>
               </li>
            </ul>
         </div>
      </div>
    </div>
  );
};

export default DiskUsageAnalyzer;
