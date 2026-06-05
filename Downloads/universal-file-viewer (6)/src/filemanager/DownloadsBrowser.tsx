import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from '../App';
import FileCard from '../components/FileCard';
import { Download, Search, Grid, List, Trash2, ArrowUpDown, Sparkles } from 'lucide-react';

interface DownloadsBrowserProps {
  files?: WorkspaceFile[];
  isDark?: boolean;
  onOpenFile?: (file: WorkspaceFile) => void;
  getFileUrl?: (file: WorkspaceFile) => string;
  isSelectMode?: boolean;
  setIsSelectMode?: (mode: boolean) => void;
  selectedFileIds?: Set<string>;
  setSelectedFileIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleFilePressStart?: (id: string) => void;
  handleFilePressEnd?: () => void;
  toggleSelection?: (id: string) => void;
  fileMenuOpen?: string | null;
  setFileMenuOpen?: (id: string | null) => void;
  renameFile?: (id: string) => void;
  openToolOverlay?: (toolId: string, file: WorkspaceFile) => void;
  convertDocToPdf?: (file: WorkspaceFile) => void;
  convertPdfToImages?: (file: WorkspaceFile) => void;
  extractZipFile?: (file: WorkspaceFile) => void;
  downloadBlob?: (blob: Blob, name: string) => void;
  shareFile?: (file: WorkspaceFile) => void;
  deleteFile?: (id: string) => void;
  toggleFavorite?: (id: string) => void;
  togglePin?: (id: string) => void;
}

export const DownloadsBrowser: React.FC<DownloadsBrowserProps> = ({
  files: propsFiles = [],
  isDark = false,
  onOpenFile = () => {},
  getFileUrl = () => '',
  isSelectMode = false,
  setIsSelectMode = () => {},
  selectedFileIds = new Set<string>(),
  setSelectedFileIds = () => {},
  handleFilePressStart = () => {},
  handleFilePressEnd = () => {},
  toggleSelection = () => {},
  fileMenuOpen = null,
  setFileMenuOpen = () => {},
  renameFile = () => {},
  openToolOverlay = () => {},
  convertDocToPdf = () => {},
  convertPdfToImages = () => {},
  extractZipFile = () => {},
  downloadBlob = () => {},
  shareFile = () => {},
  deleteFile = () => {},
  toggleFavorite = () => {},
  togglePin = () => {},
}) => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Load and sync downloaded file IDs
  useEffect(() => {
    try {
      const stored = localStorage.getItem('filemanager_downloaded_ids');
      if (stored) {
        setDownloadedIds(JSON.parse(stored));
      } else {
        // Fallback: Default to all files in the initial workspace that are not folders
        const initialIds = propsFiles
          .filter(f => f.category !== 'folder' && !f.path.endsWith('/'))
          .map(f => f.id);
        setDownloadedIds(initialIds);
        localStorage.setItem('filemanager_downloaded_ids', JSON.stringify(initialIds));
      }
    } catch (e) {
      console.error('Failed to load downloaded files history', e);
    }
  }, [propsFiles.length === 0]); // Re-run if first load props are empty and now loaded

  // Save changes to downloaded IDs list
  const saveDownloadedIds = (ids: string[]) => {
    setDownloadedIds(ids);
    try {
      localStorage.setItem('filemanager_downloaded_ids', JSON.stringify(ids));
    } catch (e) {
      console.error('Failed to save downloaded files history', e);
    }
  };

  // Intercept open and file download
  const handleOpenFile = (file: WorkspaceFile) => {
    if (!downloadedIds.includes(file.id)) {
      saveDownloadedIds([file.id, ...downloadedIds]);
    }
    onOpenFile(file);
  };

  const handleDownloadFileBlob = (blob: Blob, name: string) => {
    const matchedFile = propsFiles.find(f => f.name === name);
    if (matchedFile && !downloadedIds.includes(matchedFile.id)) {
      saveDownloadedIds([matchedFile.id, ...downloadedIds]);
    }
    downloadBlob(blob, name);
  };

  const handleDeleteDownloadRecord = (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this file from downloads? This action will also delete the file from your workspace database.');
    if (confirmDelete) {
      const updated = downloadedIds.filter(fid => fid !== id);
      saveDownloadedIds(updated);
      deleteFile(id);
    }
  };

  const handleClearAllDownloads = () => {
    const confirmClear = window.confirm('Are you sure you want to clear your download logs? This will reset your downloads filter tab records.');
    if (confirmClear) {
      saveDownloadedIds([]);
    }
  };

  // Filter downloaded files from the workspace propsFiles
  const downloadedFiles = propsFiles.filter(file => {
    if (file.category === 'folder') return false;
    
    const isExplicitDownload = downloadedIds.includes(file.id);
    const isProbablyGenerated = file.name.includes('_converted') || 
                                file.name.includes('_compressed') || 
                                file.name.includes('_copy');
                                
    return isExplicitDownload || isProbablyGenerated;
  });

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalSize = downloadedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  // Search & Filter
  const filtered = downloadedFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      result = (a.size || 0) - (b.size || 0);
    } else if (sortBy === 'date') {
      result = (a.createdAt || 0) - (b.createdAt || 0);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
      
      {/* Top Banner Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-[#E6F4EA]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-[#E6F4EA]'}`}>
              <Download className="w-5 h-5 text-[#137333]" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Downloaded Files</p>
              <p className="text-xl font-bold">{downloadedFiles.length} items</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-[#202124] text-emerald-400' : 'bg-[#E6F4EA] text-[#137333]'}`}>
            Offline Ready
          </span>
        </div>

        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-[#E8F0FE]'}`}>
              <Sparkles className="w-5 h-5 text-[#1A73E8]" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Total Downloads Size</p>
              <p className="text-xl font-bold">{formatSize(totalSize)}</p>
            </div>
          </div>
          {downloadedFiles.length > 0 && (
            <button
              onClick={handleClearAllDownloads}
              className="p-2 rounded-xl text-xs font-semibold border hover:bg-red-500/10 text-red-500 border-transparent transition-colors"
            >
              Clear Records
            </button>
          )}
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-[#E8EAED] dark:border-[#303134]">
        {/* Search */}
        <div className={`relative w-full sm:max-w-xs flex items-center rounded-xl p-1 px-3 border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F1F3F4] border-transparent focus-within:bg-white focus-within:border-[#1A73E8] focus-within:shadow-sm'} transition-all`}>
          <Search className={`w-4 h-4 mr-2 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
          <input
            type="text"
            placeholder="Search downloaded files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm py-1.5"
          />
        </div>

        {/* View and sort controls */}
        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          {/* Sorting Field */}
          <div className="flex items-center gap-1 text-xs">
            <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>SortBy:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`text-xs p-1.5 rounded-lg border outline-none ${isDark ? 'bg-[#202124] border-[#303134]' : 'bg-white border-[#DADCE0]'}`}
            >
              <option value="date">Date Added</option>
              <option value="size">Size</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Toggle Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className={`p-2 rounded-lg border transition-colors ${isDark ? 'border-[#303134] bg-[#303134] hover:bg-[#3C4043]' : 'border-[#DADCE0] bg-white hover:bg-[#F8F9FA]'}`}
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>

          {/* Toggle View Mode */}
          <div className={`flex items-center rounded-lg p-0.5 border ${isDark ? 'border-[#303134] bg-[#202124]' : 'border-[#DADCE0] bg-[#F1F3F4]'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? (isDark ? 'bg-[#303134] shadow' : 'bg-white shadow') : 'opacity-60'}`}
              title="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDark ? 'bg-[#303134] shadow' : 'bg-white shadow') : 'opacity-60'}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List of Downloads */}
      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#303134]' : 'bg-emerald-50'}`}>
              <Download className="w-8 h-8 text-emerald-600 opacity-80" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              {searchQuery ? 'No matching downloads' : 'No Download History'}
            </h3>
            <p className={`text-xs max-w-xs mt-1 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              {searchQuery 
                ? 'Try searching with a different file name.'
                : 'Files downloaded from URLs or generated by text-to-PDF, image converters, and zip tools will show up in this browser.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' 
            : 'flex flex-col gap-2'
          }>
            {sorted.map(file => (
              <FileCard
                key={file.id}
                file={file}
                isSelected={selectedFileIds.has(file.id)}
                isSelectMode={isSelectMode}
                viewMode={viewMode}
                isDark={isDark}
                getFileUrl={getFileUrl}
                handleFilePressStart={handleFilePressStart}
                handleFilePressEnd={handleFilePressEnd}
                toggleSelection={toggleSelection}
                openFile={handleOpenFile}
                fileMenuOpen={fileMenuOpen}
                setFileMenuOpen={setFileMenuOpen}
                renameFile={renameFile}
                openToolOverlay={openToolOverlay}
                convertDocToPdf={convertDocToPdf}
                convertPdfToImages={convertPdfToImages}
                extractZipFile={extractZipFile}
                downloadBlob={handleDownloadFileBlob}
                shareFile={shareFile}
                deleteFile={handleDeleteDownloadRecord}
                toggleFavorite={toggleFavorite}
                togglePin={togglePin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsBrowser;
