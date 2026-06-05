import React, { useState } from 'react';

export const BarcodeScanner: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Barcode Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Supported formats: EAN, UPC, Code128, and QR fallback.</p>
      
      <div className="w-full aspect-[4/3] max-h-[300px] bg-black rounded-lg flex items-center justify-center mb-6 relative overflow-hidden mx-auto">
         <div className="w-[80%] h-32 border-2 border-red-500/50 relative flex items-center justify-center rounded-lg">
             <div className="absolute inset-x-0 top-1/2 h-[2px] bg-red-500 shadow-[0_0_8px_1px_red] -translate-y-1/2"></div>
             <span className="text-gray-400 text-xs mt-16 font-mono tracking-widest block bg-black/50 px-2 rounded">ALIGN BARCODE</span>
         </div>
         
         <button 
           onClick={() => setResult("978-0-123456-47-2 (EAN-13)")}
           className="absolute bottom-2 bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
           Simulate Scan
         </button>
      </div>

      {result && (
        <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 text-center">
           <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">Detected Barcode</p>
           <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider mb-4">{result.split(' ')[0]}</p>
           <div className="inline-block bg-white dark:bg-black rounded px-3 py-1 border border-gray-200 dark:border-gray-800 mb-4">
              <span className="text-xs text-gray-500 font-medium">Format: {result.split(' ')[1].replace(/[()]/g, '')}</span>
           </div>
           <div className="flex gap-2 justify-center">
             <button className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium shadow-sm hover:bg-blue-700">Search Product</button>
             <button className="px-6 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700">Copy Code</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
