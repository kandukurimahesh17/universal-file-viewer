import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from '../App';
import { FavoritesDB } from '../database/FavoritesDB';
import FileCard from '../components/FileCard';
import { Star, Search, Grid, List as ListIcon, Trash2, ArrowUpDown, ShieldAlert, Sparkles } from 'lucide-react';

interface FavoritesManagerProps {
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

export const FavoritesManager: React.FC<FavoritesManagerProps> = ({
  files: propsFiles,
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
  const [internalFiles, setInternalFiles] = useState<WorkspaceFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sync favorites state
  useEffect(() => {
    if (propsFiles && propsFiles.length > 0) {
      // Filter out files that are genuinely favorited
      const favList = propsFiles.filter(f => f.isFavorite || FavoritesDB.isFavorite(f.id));
      setInternalFiles(favList);
    } else {
      // In case we are standalone, we mock or load local references
      const localFavIds = FavoritesDB.getFavoriteIds();
      // Look for files in localStorage list if workspace files aren't passing.
      try {
        const storedAllFiles = localStorage.getItem('filemanager_all_files');
        if (storedAllFiles) {
          const parsed: WorkspaceFile[] = JSON.parse(storedAllFiles);
          setInternalFiles(parsed.filter(f => localFavIds.includes(f.id)));
        }
      } catch (e) {
        console.error('Failed to load local backup files', e);
      }
    }
  }, [propsFiles]);

  const handleToggleFavorite = (id: string) => {
    FavoritesDB.toggleFavorite(id);
    toggleFavorite(id);
    setInternalFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearAllFavorites = () => {
    const confirmClear = window.confirm('Are you sure you want to remove all files from Favorites?');
    if (confirmClear) {
      const favIds = internalFiles.map(f => f.id);
      favIds.forEach(id => {
        FavoritesDB.removeFavorite(id);
        toggleFavorite(id);
      });
      setInternalFiles([]);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filter & sort
  const filteredFavorites = internalFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    let result = 0;
    if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      result = a.size - b.size;
    } else if (sortBy === 'date') {
      result = (a.createdAt || 0) - (b.createdAt || 0);
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const totalSize = internalFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-[#FDE8E8]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-amber-100'}`}>
              <Star className="w-5 h-5 text-[#FBBC05] fill-current" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Starred Items</p>
              <p className="text-xl font-bold">{internalFiles.length} files</p>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDark ? 'bg-[#202124] text-amber-400' : 'bg-amber-100 text-amber-800'}`}>
            Quick Access
          </span>
        </div>

        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-[#E8F0FE]'}`}>
              <Sparkles className="w-5 h-5 text-[#1A73E8]" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Total Storage Used</p>
              <p className="text-xl font-bold">{formatSize(totalSize)}</p>
            </div>
          </div>
          {internalFiles.length > 0 && (
            <button
              onClick={handleClearAllFavorites}
              className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-medium transition-colors hover:bg-red-500/10 text-red-500`}
            >
              <Trash2 className="w-4 h-4" /> Clear All
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
            placeholder="Search favorites..."
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
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="date">Last Modified</option>
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
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDark ? 'bg-[#303134] shadow' : 'bg-white shadow') : 'opacity-60'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List of Favorites */}
      <div className="flex-1 overflow-y-auto p-4">
        {sortedFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#303134]' : 'bg-amber-50'}`}>
              <Star className="w-8 h-8 text-[#FBBC05] opacity-80" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              {searchQuery ? 'No matching favorites' : 'No Starred Files'}
            </h3>
            <p className={`text-xs max-w-xs mt-1 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              {searchQuery 
                ? 'Try searching with a different file name or clear the search query.'
                : 'Star important files, documents, or photos to quickly locate them in this tab anytime.'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' 
            : 'flex flex-col gap-2'
          }>
            {sortedFavorites.map(file => (
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
                openFile={onOpenFile}
                fileMenuOpen={fileMenuOpen}
                setFileMenuOpen={setFileMenuOpen}
                renameFile={renameFile}
                openToolOverlay={openToolOverlay}
                convertDocToPdf={convertDocToPdf}
                convertPdfToImages={convertPdfToImages}
                extractZipFile={extractZipFile}
                downloadBlob={downloadBlob}
                shareFile={shareFile}
                deleteFile={deleteFile}
                toggleFavorite={handleToggleFavorite}
                togglePin={togglePin}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesManager;
