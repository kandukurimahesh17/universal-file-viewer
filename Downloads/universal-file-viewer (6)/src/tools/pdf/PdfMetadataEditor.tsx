import React from 'react';

export const PdfMetadataEditor: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Edit Metadata</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Modify the Title, Author, Subject, and Keywords.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
           <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Title</label>
           <input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Document Title" />
        </div>
        <div>
           <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Author</label>
           <input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Author Name" />
        </div>
        <div>
           <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Subject</label>
           <input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Document Subject" />
        </div>
        <div>
           <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Keywords</label>
           <input type="text" className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700" placeholder="Comma separated keywords" />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-blue-600 text-white rounded">Update Metadata</button>
      </div>
    </div>
  );
};

export default PdfMetadataEditor;
