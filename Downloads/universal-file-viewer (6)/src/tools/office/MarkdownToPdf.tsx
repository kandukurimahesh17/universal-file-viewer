import React from 'react';

export const MarkdownToPdf: React.FC = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Markdown to PDF</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Convert MD to PDF with headings, tables, and code blocks beautifully styled.</p>
      
      <div className="flex gap-4">
        <div className="flex-1">
          <textarea 
             className="w-full h-48 p-3 border rounded dark:bg-gray-800 dark:border-gray-700 font-mono text-sm leading-6 whitespace-pre"
             placeholder="# Paste markdown here..."
             defaultValue={"# Heading 1\n\n## Subheading\n\nThis is a paragraph with **bold** text.\n\n```js\nconsole.log('Hello');\n```"} 
          />
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <span className="text-xs text-gray-500">Or upload a .md file instead</span>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Upload Markdown File</button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Export PDF</button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownToPdf;
