import React, { useState } from 'react';

export const OCRScanner: React.FC = () => {
  const [extractedText, setExtractedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const simulateOCR = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setExtractedText("This is extracted text from the image.\nIt uses optical character recognition (OCR).\nLibraries like Tesseract.js or ML Kit will power this in the future.\n\nLine 4: Data extraction successful.");
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">OCR Text Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Extract editable text from images. Export to TXT or PDF.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
         <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center">
               <span className="text-sm font-medium">Source Image</span>
               <button className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Upload</button>
            </div>
            <div className="flex-1 min-h-[200px] flex items-center justify-center p-4">
               <div className="w-full h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  Upload an image with text
               </div>
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-center">
               <button onClick={simulateOCR} disabled={isProcessing} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 min-w-[120px]">
                 {isProcessing ? 'Processing...' : 'Run OCR'}
               </button>
            </div>
         </div>

         <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex flex-col relative">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center">
               <span className="text-sm font-medium">Extracted Text</span>
               {extractedText && <button className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-medium">Copy</button>}
            </div>
            <div className="flex-1 min-h-[200px] p-0">
               {isProcessing ? (
                 <div className="w-full h-full flex flex-col items-center justify-center text-blue-500 gap-3">
                   <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                   <span className="text-sm">Analyzing image...</span>
                 </div>
               ) : (
                 <textarea 
                   className="w-full h-full p-4 resize-none outline-none bg-transparent text-sm leading-relaxed" 
                   value={extractedText}
                   onChange={e => setExtractedText(e.target.value)}
                   placeholder="Extracted text will appear here..."
                 />
               )}
            </div>
         </div>
      </div>

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-medium" disabled={!extractedText}>Export TXT</button>
        <button className="px-6 py-2 bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 rounded text-sm font-medium border" disabled={!extractedText}>Export PDF</button>
      </div>
    </div>
  );
};

export default OCRScanner;
