import React, { useState } from 'react';

export const QRScanner: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">QR Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan QR codes to open URLs, copy text, or share results.</p>
      
      <div className="w-full aspect-square max-w-[300px] bg-black rounded-lg flex items-center justify-center mb-6 relative overflow-hidden mx-auto">
         <div className="absolute inset-x-0 top-1/2 w-full h-[2px] bg-red-500 shadow-[0_0_10px_2px_rgba(239,68,68,0.7)] animate-[scan_2s_ease-in-out_infinite] -translate-y-1/2 z-10" 
              style={{ animationName: 'pulse-scan', animationDuration: '3s', animationIterationCount: 'infinite' }}></div>
         <style>{`
           @keyframes pulse-scan {
             0% { top: 10%; opacity: 0.5; }
             50% { top: 90%; opacity: 1; }
             100% { top: 10%; opacity: 0.5; }
           }
         `}</style>
         
         <div className="border border-white/20 absolute inset-0 z-0"></div>
         <div className="w-48 h-48 border-2 border-white/30 relative flex items-center justify-center">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
            <span className="text-gray-500 text-sm">Align QR Code Here</span>
         </div>
         
         <button 
           onClick={() => setResult("https://example.com/qr-result-123")}
           className="absolute bottom-2 bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-20">
           Simulate Scan
         </button>
      </div>

      {result && (
        <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
           <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider mb-1">Scan Result</p>
           <p className="text-lg font-mono text-gray-900 dark:text-gray-100 break-all mb-4">{result}</p>
           
           <div className="flex gap-2">
             <button className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-medium flex items-center justify-center gap-2">
               <span>🔗</span> Open Link
             </button>
             <button className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-medium flex items-center justify-center gap-2">
               <span>📋</span> Copy
             </button>
             <button className="flex-1 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded text-sm font-medium flex items-center justify-center gap-2">
               <span>📤</span> Share
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
