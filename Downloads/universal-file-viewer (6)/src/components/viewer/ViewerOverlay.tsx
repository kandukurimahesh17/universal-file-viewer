import React from 'react';
import { ChevronLeft, Archive, Download, Share2, Star, Info } from 'lucide-react';
import { WorkspaceFile } from '../../types/file';
import ViewerRouter from '../../viewers/ViewerRouter';

interface ViewerOverlayProps {
  isOpen: boolean;
  file: WorkspaceFile | null;
  isDark: boolean;
  isImmersive: boolean;
  onToggleImmersive: () => void;
  onClose: () => void;
  onExtractZip: (file: WorkspaceFile) => void;
  onDownload: (file: WorkspaceFile) => void;
  onShare: (file: WorkspaceFile) => void;
  onToggleFavorite: (id: string) => void;
  onShowDetails: () => void;
  getFileUrl: (file: WorkspaceFile) => string;
}

export const ViewerOverlay: React.FC<ViewerOverlayProps> = ({
  isOpen,
  file,
  isDark,
  isImmersive,
  onToggleImmersive,
  onClose,
  onExtractZip,
  onDownload,
  onShare,
  onToggleFavorite,
  onShowDetails,
  getFileUrl
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className={`absolute inset-0 z-50 flex flex-col ${isDark ? 'bg-black text-[#E3E3E3]' : 'bg-[#F8F9FA] text-[#202124]'}`}>
      <header className={`absolute top-0 left-0 right-0 z-[60] px-2 py-3 flex items-center justify-between transition-transform duration-300 ${isImmersive ? '-translate-y-full' : 'translate-y-0'} ${isDark ? 'bg-[#303134]/95 backdrop-blur-md shadow-md' : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E8EAED]'}`}>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className={`p-2.5 rounded-full flex-shrink-0 ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`}><ChevronLeft className="w-6 h-6" /></button>
        <h2 className="text-[15px] font-medium truncate flex-1 px-2">{file.name}</h2>
        <div className="w-10"></div>
      </header>
      
      <div className={`absolute bottom-0 left-0 right-0 z-[60] px-3 py-3 flex items-center justify-around transition-transform duration-300 ${(isImmersive || file.category === 'pdf') ? 'translate-y-full' : 'translate-y-0'} ${isDark ? 'bg-[#303134]/95 backdrop-blur-md shadow-md border-t border-[#3C4043]' : 'bg-white/95 backdrop-blur-md shadow-sm border-t border-[#E8EAED] pb-6'}`}>
          {file.category === 'archive' && (
            <button onClick={(e) => { e.stopPropagation(); onExtractZip(file); }} className="flex flex-col items-center gap-1 p-2 text-[#1A73E8]">
              <Archive className="w-5 h-5" />
              <span className="text-[10px] font-medium">Extract</span>
            </button>
          )}
          {file.category === 'pdf' && (
            <button onClick={(e) => {
               e.stopPropagation();
               const url = getFileUrl(file);
               const w = window.open(url, '_blank');
               if (w) w.print();
            }} className={`flex flex-col items-center gap-1 p-2 ${isDark ? 'text-[#9AA0A6] hover:text-white' : 'text-[#5F6368] hover:text-black'}`}>
              <Archive className="w-5 h-5" />
              <span className="text-[10px] font-medium">Print</span>
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className={`flex flex-col items-center gap-1 p-2 ${isDark ? 'text-[#9AA0A6] hover:text-white' : 'text-[#5F6368] hover:text-black'}`}>
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-medium">Download</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onShare(file); }} className={`flex flex-col items-center gap-1 p-2 ${isDark ? 'text-[#9AA0A6] hover:text-white' : 'text-[#5F6368] hover:text-black'}`}>
              <Share2 className="w-5 h-5" />
              <span className="text-[10px] font-medium">Share</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(file.id); }} className={`flex flex-col items-center gap-1 p-2 ${isDark ? 'text-[#9AA0A6] hover:text-white' : 'text-[#5F6368] hover:text-black'}`}>
              <Star className={`w-5 h-5 ${file.isFavorite ? 'fill-[#FBBC04] text-[#FBBC04]' : ''}`} />
              <span className="text-[10px] font-medium">Star</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onShowDetails(); }} className={`flex flex-col items-center gap-1 p-2 ${isDark ? 'text-[#9AA0A6] hover:text-white' : 'text-[#5F6368] hover:text-black'}`}>
              <Info className="w-5 h-5" />
              <span className="text-[10px] font-medium">Details</span>
          </button>
      </div>
      
      <div className="flex-1 overflow-auto flex flex-col relative w-full h-full" onClick={onToggleImmersive}>
         <ViewerRouter file={file} isDark={isDark} downloadBlob={(blob, name) => onDownload(file)} />
      </div>
    </div>
  );
};

export default ViewerOverlay;
