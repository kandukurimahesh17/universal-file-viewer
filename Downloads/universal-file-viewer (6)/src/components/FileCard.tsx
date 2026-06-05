import React from 'react';
import { Check, MoreVertical, Edit3, FileText, Archive, Download, Share2, Trash2, Star, MapPin, Folder, Image as ImageIcon, Combine, Split, Minimize, RotateCw } from 'lucide-react';
import { WorkspaceFile } from '../App';
import FileIcon from './FileIcon';
import { formatBytes } from '../utils/imageUtils';

interface FileCardProps {
  file: WorkspaceFile;
  isSelected: boolean;
  isSelectMode: boolean;
  viewMode: 'grid' | 'list';
  isDark: boolean;
  getFileUrl: (file: WorkspaceFile) => string;
  handleFilePressStart: (id: string) => void;
  handleFilePressEnd: () => void;
  toggleSelection: (id: string) => void;
  openFile: (file: WorkspaceFile) => void;
  fileMenuOpen: string | null;
  setFileMenuOpen: (id: string | null) => void;
  renameFile: (id: string) => void;
  convertDocToPdf: (file: WorkspaceFile) => void;
  openToolOverlay?: (toolId: string, file: WorkspaceFile) => void;
  convertPdfToImages?: (file: WorkspaceFile) => void;
  extractZipFile: (file: WorkspaceFile) => void;
  downloadBlob: (blob: Blob, name: string) => void;
  shareFile: (file: WorkspaceFile) => void;
  deleteFile: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file, isSelected, isSelectMode, viewMode, isDark, getFileUrl,
  handleFilePressStart, handleFilePressEnd, toggleSelection, openFile,
  fileMenuOpen, setFileMenuOpen, renameFile, convertDocToPdf, openToolOverlay, convertPdfToImages, extractZipFile,
  downloadBlob, shareFile, deleteFile, toggleFavorite, togglePin
}) => {
  const formattedDate = React.useMemo(() => {
    const rawDate = file.createdAt || file.lastModified;
    if (!rawDate) return '02-06-2026';
    const d = new Date(rawDate);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
  }, [file.createdAt, file.lastModified]);

  return (
    <div className="relative">
      <div 
        onTouchStart={() => handleFilePressStart(file.id)}
        onTouchEnd={handleFilePressEnd}
        onTouchMove={handleFilePressEnd}
        onClick={() => isSelectMode ? toggleSelection(file.id) : openFile(file)} 
        className={`cursor-pointer overflow-hidden transition-all ${isSelected ? (isDark ? 'bg-[#3C4043] ring-2 ring-[#8AB4F8]' : 'bg-[#E8F0FE] ring-2 ring-[#1A73E8]') : ''} ${viewMode === 'grid' ? `flex flex-col items-center justify-center p-4 rounded-2xl text-center shadow-sm ${!isSelected && (isDark ? 'bg-[#303134] hover:bg-[#3C4043]' : 'bg-white border border-[#E8EAED] hover:bg-[#F8F9FA]')}` : `flex items-center gap-4 p-3 rounded-2xl ${!isSelected && (isDark ? 'bg-transparent hover:bg-[#303134]' : 'bg-transparent hover:bg-[#F0F4F9]')}`}`}
      >
        {isSelectMode && (
          <div className={`absolute left-2 top-2 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors z-10 ${isSelected ? 'bg-[#1A73E8] border-[#1A73E8]' : (isDark ? 'border-[#9AA0A6]' : 'border-[#DADCE0]')}`}>
            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
          </div>
        )}
        
        <div className={`shrink-0 flex items-center justify-center ${viewMode === 'grid' ? 'w-14 h-14 mb-3' : `w-10 h-10 rounded-xl ${isDark ? 'bg-[#303134]' : 'bg-white border border-[#E8EAED] shadow-sm'}`}`}>
          {file.category === 'image' && viewMode === 'grid' ? (
            <img src={getFileUrl(file)} className="w-full h-full object-cover rounded-xl shadow-sm" alt=""/>
          ) : (
            <FileIcon type={file.category} className={viewMode === 'grid' ? 'w-8 h-8' : 'w-5 h-5'} />
          )}
        </div>
        
        <div className={`min-w-0 ${viewMode === 'grid' ? 'w-full' : 'flex-1 pr-14'}`}>
          <p className={`font-medium truncate ${viewMode === 'grid' ? 'text-[13px]' : 'text-[14px]'} ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>{file.name}</p>
          {viewMode === 'list' && (
            <p className={`text-[12px] mt-0.5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'} flex items-center flex-wrap gap-2`}>
              <span>{formattedDate} • {formatBytes(file.size)} • {file.category.toUpperCase()}</span>
            </p>
          )}
        </div>
      </div>
      
      {/* Context Menu Button */}
      <button onClick={(e) => { e.stopPropagation(); setFileMenuOpen(fileMenuOpen === file.id ? null : file.id); }} className={`absolute p-2 rounded-full ${viewMode === 'grid' ? 'top-2 right-2 bg-white/80 dark:bg-black/50 shadow-sm backdrop-blur' : 'top-2 right-2'} ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {fileMenuOpen === file.id && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setFileMenuOpen(null); }} />
          <div className={`absolute right-4 top-10 z-50 w-56 rounded-2xl shadow-xl overflow-hidden py-2 border ${isDark ? 'bg-[#202124] border-[#303134] shadow-black/50' : 'bg-white border-[#E8EAED]'}`}>
            <button onClick={(e) => { e.stopPropagation(); renameFile(file.id); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
              <Edit3 className="w-4 h-4" /> Rename
            </button>

            {['doc', 'docx'].includes(file.name.split('.').pop()?.toLowerCase() || '') && (
               <button onClick={(e) => { e.stopPropagation(); convertDocToPdf(file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                 <FileText className="w-4 h-4" /> Convert to PDF
               </button>
            )}
            {file.category === 'pdf' && (
               <>
                 <button onClick={(e) => { e.stopPropagation(); openToolOverlay?.('tool_format', file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                   <ImageIcon className="w-4 h-4" /> Convert to Images
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); openToolOverlay?.('tool_merge', file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                   <Combine className="w-4 h-4" /> Merge PDF
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); openToolOverlay?.('tool_split', file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                   <Split className="w-4 h-4" /> Split PDF
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); openToolOverlay?.('tool_compress_pdf', file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                   <Minimize className="w-4 h-4" /> Compress PDF
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); openToolOverlay?.('tool_rotate', file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                   <RotateCw className="w-4 h-4" /> Rotate PDF
                 </button>
               </>
            )}
            {file.category === 'archive' && file.name.endsWith('.zip') && (
               <button onClick={(e) => { e.stopPropagation(); extractZipFile(file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                 <Archive className="w-4 h-4" /> Extract Here
               </button>
            )}
            {file.blob && (
              <button onClick={(e) => { e.stopPropagation(); downloadBlob(file.blob as Blob, file.name); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
                <Download className="w-4 h-4" /> Save to Device
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); shareFile(file); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
              <Share2 className="w-4 h-4" /> Share
            </button>
            <div className={`w-full h-px my-1 ${isDark ? 'bg-[#303134]' : 'bg-[#E8EAED]'}`} />
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(file.id); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
              <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current text-[#FBBC05]' : ''}`} /> {file.isFavorite ? 'Unstar' : 'Add to Starred'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); togglePin(file.id); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 ${isDark ? 'hover:bg-[#303134] text-[#E3E3E3]' : 'hover:bg-[#F0F4F9] text-[#202124]'}`}>
              <MapPin className={`w-4 h-4 ${file.isPinned ? 'fill-current text-[#34A853]' : ''}`} /> {file.isPinned ? 'Unpin' : 'Pin to top'}
            </button>
            <div className={`w-full h-px my-1 ${isDark ? 'bg-[#303134]' : 'bg-[#E8EAED]'}`} />
            <button onClick={(e) => { e.stopPropagation(); deleteFile(file.id); setFileMenuOpen(null); }} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 text-red-500 ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FileCard;