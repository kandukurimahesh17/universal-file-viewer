import React from 'react';
import FileExplorer from '../filemanager/FileExplorer';
import { WorkspaceFile } from '../App';

interface FilesPageProps {
  files: WorkspaceFile[];
  isDark: boolean;
  onOpenFile: (file: WorkspaceFile) => void;
  getFileUrl: (file: WorkspaceFile) => string;
  isSelectMode: boolean;
  setIsSelectMode: (isSelectMode: boolean) => void;
  selectedFileIds: Set<string>;
  setSelectedFileIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleFilePressStart: (id: string) => void;
  handleFilePressEnd: () => void;
  toggleSelection: (id: string) => void;
  bulkDelete: () => void;
  fileMenuOpen: string | null;
  setFileMenuOpen: (id: string | null) => void;
  renameFile: (id: string) => void;
  convertDocToPdf: (file: WorkspaceFile) => void;
  convertPdfToImages: (file: WorkspaceFile) => void;
  extractZipFile: (file: WorkspaceFile) => void;
  downloadBlob: (blob: Blob, name: string) => void;
  shareFile: (file: WorkspaceFile) => void;
  deleteFile: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  subCategory: string;
  setSubCategory: (sub: string) => void;
}

export const FilesPage: React.FC<FilesPageProps> = (props) => {
  return <FileExplorer {...props} />;
};

export default FilesPage;
