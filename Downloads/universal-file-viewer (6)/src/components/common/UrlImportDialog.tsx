import React from 'react';
import { X, RefreshCw, Download } from 'lucide-react';

interface UrlImportDialogProps {
  isOpen: boolean;
  isDark: boolean;
  urlInput: string;
  isDownloadingUrl: boolean;
  onUrlChange: (url: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const UrlImportDialog: React.FC<UrlImportDialogProps> = ({
  isOpen,
  isDark,
  urlInput,
  isDownloadingUrl,
  onUrlChange,
  onClose,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-[24px] shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#303134] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
        <div className="p-5 font-medium flex justify-between items-center text-[18px]">
          Import from Web
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`}><X className="w-5 h-5"/></button>
        </div>
        <div className="px-5 pb-5 space-y-4 text-[14px]">
           <label className={`block font-medium mb-2 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Direct File URL</label>
           <input 
             type="text" 
             value={urlInput} 
             onChange={e => onUrlChange(e.target.value)} 
             placeholder="https://example.com/file.pdf" 
             className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1A73E8] ${isDark ? 'bg-[#1F1F1F] border-[#3C4043] text-white' : 'bg-[#F8F9FA] border-[#E8EAED] text-black'}`}
           />
           <p className={`text-[12px] mt-2 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
             Downloads file directly into your workspace. Proxied via allorigins to bypass CORS.
           </p>
        </div>
        <div className={`p-4 flex gap-3 ${isDark ? 'bg-[#202124]' : 'bg-[#F8F9FA]'}`}>
          <button 
            onClick={onSubmit} 
            disabled={!urlInput.trim() || isDownloadingUrl} 
            className={`flex-1 py-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full font-medium text-[14px] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2`}
          >
            {isDownloadingUrl ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isDownloadingUrl ? 'Downloading...' : 'Fetch File'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UrlImportDialog;
