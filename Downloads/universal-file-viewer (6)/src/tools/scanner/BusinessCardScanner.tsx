import React, { useState } from 'react';

export const BusinessCardScanner: React.FC = () => {
  const [scannedData, setScannedData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setScannedData({
        name: "Jane Smith",
        title: "Senior Product Designer",
        phone: "+1 (555) 019-2834",
        email: "jane.smith@acmecorp.design",
        company: "Acme Corp Design Studio",
        website: "www.acmecorp.design",
        address: "123 Innovation Way, Tech District, CA 94103"
      });
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Business Card Scanner</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Extract Name, Phone, Email, Company, Website, and Address from a card.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="flex flex-col gap-4">
            <div className="aspect-[1.75/1] w-full bg-black rounded-xl overflow-hidden relative shadow-inner">
               <div className="absolute inset-4 border max-w-[80%] mx-auto my-auto border-white/50 rounded-lg flex items-center justify-center">
                  <span className="text-white/30 tracking-widest text-sm uppercase">Align Card Here</span>
               </div>
               {isScanning && (
                 <div className="absolute inset-0 bg-blue-500/20 z-10 animate-pulse flex items-center justify-center backdrop-blur-sm">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Processing via AI...</span>
                 </div>
               )}
            </div>
            <button onClick={simulateScan} disabled={isScanning} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors">
              Scan Card
            </button>
            <button className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors">
              Upload from Gallery
            </button>
         </div>

         <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Extracted Information</h3>
            
            {scannedData ? (
               <div className="flex flex-col gap-3 flex-1 overflow-auto">
                 <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Full Name</label>
                    <input type="text" className="w-full bg-transparent font-medium text-gray-900 dark:text-gray-100 outline-none" defaultValue={scannedData.name} />
                 </div>
                 <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800 flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Company</label>
                      <input type="text" className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none" defaultValue={scannedData.company} />
                    </div>
                    <div className="flex-1 border-l border-gray-100 dark:border-gray-800 pl-2">
                      <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Title</label>
                      <input type="text" className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none" defaultValue={scannedData.title} />
                    </div>
                 </div>
                 <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Phone & Email</label>
                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                          <span className="text-gray-400">📞</span> <input type="text" className="flex-1 bg-transparent outline-none" defaultValue={scannedData.phone} />
                       </div>
                       <div className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                          <span className="text-gray-400">✉️</span> <input type="text" className="flex-1 bg-transparent outline-none" defaultValue={scannedData.email} />
                       </div>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-800">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wider block mb-1">Address & Web</label>
                    <textarea rows={2} className="w-full bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none resize-none mb-1" defaultValue={scannedData.address} />
                    <input type="text" className="w-full bg-transparent text-sm text-blue-600 outline-none" defaultValue={scannedData.website} />
                 </div>
               </div>
            ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-50 space-y-4">
                  <span className="text-6xl">📇</span>
                  <p>Scan a card to extract details</p>
               </div>
            )}
            
            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 flex gap-2">
               <button disabled={!scannedData} className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Save to Contacts (VCF)</button>
               <button disabled={!scannedData} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg disabled:opacity-50">Save PDF</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default BusinessCardScanner;
