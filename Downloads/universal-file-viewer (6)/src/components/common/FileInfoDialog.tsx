import React from 'react';
import { X } from 'lucide-react';
import { WorkspaceFile } from '../../types/file';
import FileIcon from '../FileIcon';

interface FileInfoDialogProps {
  isOpen: boolean;
  file: WorkspaceFile | null;
  isDark: boolean;
  onClose: () => void;
  onOpenFile: (file: WorkspaceFile) => void;
  formatBytes: (bytes: number) => string;
}

export const FileInfoDialog: React.FC<FileInfoDialogProps> = ({
  isOpen,
  file,
  isDark,
  onClose,
  onOpenFile,
  formatBytes
}) => {
  if (!isOpen || !file) return null;

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-5 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-[24px] shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#303134] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
        <div className="p-5 font-medium flex justify-between items-center text-[18px]">
          Details
          <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`}><X className="w-5 h-5"/></button>
        </div>
        <div className="px-5 pb-5 space-y-4 text-[14px]">
          <div className="flex flex-col items-center pb-5 border-b border-[#E8EAED] dark:border-[#3C4043]">
            <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-4 ${isDark ? 'bg-[#202124]' : 'bg-[#F0F4F9]'}`}>
              <FileIcon type={file.category} className="w-8 h-8" />
            </div>
            <span className="font-medium text-center break-all text-[16px]">{file.name}</span>
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-y-4 text-[14px]">
             <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>Size</span> <span>{formatBytes(file.size)}</span>
             <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>Type</span> <span className="truncate">{file.mimeType || 'Unknown'}</span>
             <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>Category</span> <span className="capitalize">{file.category}</span>
             <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>Created</span> <span>{new Date(file.lastModified || file.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
        </div>
        <div className={`p-4 flex gap-3 ${isDark ? 'bg-[#202124]' : 'bg-[#F8F9FA]'}`}>
          <button onClick={() => { onClose(); setTimeout(() => onOpenFile(file), 50); }} className="flex-1 py-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full font-medium text-[14px] transition-colors shadow-sm">Open File</button>
        </div>
      </div>
    </div>
  );
};

export default FileInfoDialog;
