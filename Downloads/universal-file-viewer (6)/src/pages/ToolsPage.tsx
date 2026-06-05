import React from 'react';
import { 
  Layers, 
  Archive, 
  RefreshCcw, 
  FileText, 
  Scissors, 
  Stamp, 
  RotateCw, 
  FileImage 
} from 'lucide-react';
import { OverlayType } from '../core/NavigationManager';

interface ToolsPageProps {
  isDark: boolean;
  openOverlay: (overlayName: OverlayType) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ isDark, openOverlay }) => {
  return (
    <div className="p-5 space-y-6 w-full max-w-2xl mx-auto">
      
      {/* SECTION: PDF Tools */}
      <div>
        <h2 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
          PDF Tools
        </h2>
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card: Image To PDF */}
          <div
            id="tool-card-image-to-pdf"
            onClick={() => openOverlay('tool_compile')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#E8F0FE] text-[#1A73E8] dark:bg-[#004A77] dark:text-[#C2E7FF] p-4 rounded-full">
              <Layers className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              Image to PDF
            </span>
          </div>

          {/* Card: PDF to Images */}
          <div
            id="tool-card-pdf-to-images"
            onClick={() => openOverlay('tool_format')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#E6F4EA] text-[#1E8E3E] dark:bg-[#0F5223] dark:text-[#6DD58C] p-4 rounded-full">
              <FileImage className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              PDF to Images
            </span>
          </div>

          {/* Card: Merge PDF */}
          <div
            id="tool-card-merge-pdf"
            onClick={() => openOverlay('tool_merge')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#FEEFC3] text-[#B06000] dark:bg-[#5C3E00] dark:text-[#FFE3B3] p-4 rounded-full">
              <FileText className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              Merge PDF
            </span>
          </div>

          {/* Card: Split PDF */}
          <div
            id="tool-card-split-pdf"
            onClick={() => openOverlay('tool_split')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#ECE3F4] text-[#A142F4] dark:bg-[#3D005C] dark:text-[#F3E3FC] p-4 rounded-full">
              <Scissors className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              Split PDF
            </span>
          </div>

          {/* Card: Compress PDF */}
          <div
            id="tool-card-compress-pdf"
            onClick={() => openOverlay('tool_compress')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#FCE8E6] text-[#D93025] dark:bg-[#5C0300] dark:text-[#FFDBDB] p-4 rounded-full">
              <Archive className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              Compress PDF
            </span>
          </div>

          {/* Card: Rotate/Watermark PDF */}
          <div
            id="tool-card-rotate-pdf"
            onClick={() => openOverlay('tool_watermark')}
            className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.97] hover:shadow-md border ${
              isDark ? 'bg-[#303134] border-[#3C4043] hover:bg-[#3C4043]' : 'bg-white border-[#E8EAED] hover:bg-[#F8F9FA]'
            }`}
          >
            <div className="bg-[#E8F0FE] text-[#1967D2] dark:bg-[#002F6C] dark:text-[#C2D7FF] p-4 rounded-full">
              <Stamp className="w-7 h-7" />
            </div>
            <span className={`text-[14px] font-semibold text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              Rotate PDF
            </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ToolsPage;
