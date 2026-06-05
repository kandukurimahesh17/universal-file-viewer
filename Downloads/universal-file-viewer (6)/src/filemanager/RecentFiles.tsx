import React, { useState, useEffect } from 'react';
import { WorkspaceFile } from '../App';
import { RecentFilesDB } from '../database/RecentFilesDB';
import FileCard from '../components/FileCard';
import { Clock, Search, Grid, List as ListIcon, Trash2, ArrowUpDown, Sliders, Settings } from 'lucide-react';

interface RecentFilesProps {
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

export const RecentFiles: React.FC<RecentFilesProps> = ({
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
  const [recentFiles, setRecentFiles] = useState<WorkspaceFile[]>([]);
  const [maxRecentCount, setMaxRecentCount] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'opened' | 'name' | 'size'>('opened');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showConfig, setShowConfig] = useState(false);

  // Load configured limit from local storage
  useEffect(() => {
    const savedLimit = localStorage.getItem('filemanager_recent_max_limit');
    if (savedLimit) {
      setMaxRecentCount(parseInt(savedLimit, 10));
    }
  }, []);

  // Update recent files on prop changes or maxRecentCount
  useEffect(() => {
    const resolved = RecentFilesDB.getRecentFiles(propsFiles, maxRecentCount);
    setRecentFiles(resolved);
  }, [propsFiles, maxRecentCount]);

  const handleOpenFile = (file: WorkspaceFile) => {
    // Track file on opening
    RecentFilesDB.trackFile(file.id, maxRecentCount);
    onOpenFile(file);
    // Refresh list
    const resolved = RecentFilesDB.getRecentFiles(propsFiles, maxRecentCount);
    setRecentFiles(resolved);
  };

  const handleLimitChange = (newLimit: number) => {
    setMaxRecentCount(newLimit);
    localStorage.setItem('filemanager_recent_max_limit', newLimit.toString());
  };

  const handleClearHistory = () => {
    const confirmClear = window.confirm('Are you sure you want to clear your entire files opening history?');
    if (confirmClear) {
      RecentFilesDB.clearRecent();
      setRecentFiles([]);
    }
  };

  // Filter & sort
  const filtered = recentFiles.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let result = 0;
    if (sortBy === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortBy === 'size') {
      result = a.size - b.size;
    } else if (sortBy === 'opened') {
      const records = RecentFilesDB.getRecentRecords();
      const timeA = records.find(r => r.fileId === a.id)?.lastOpenedAt || 0;
      const timeB = records.find(r => r.fileId === b.id)?.lastOpenedAt || 0;
      result = timeA - timeB; // ascending reference
    }
    return sortOrder === 'asc' ? result : -result;
  });

  const getRelativeTimeString = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (secs < 60) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getFileLastOpenedString = (id: string): string => {
    const records = RecentFilesDB.getRecentRecords();
    const rec = records.find(r => r.fileId === id);
    if (!rec) return 'Unknown';
    return getRelativeTimeString(rec.lastOpenedAt);
  };

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
      
      {/* Upper Panel Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-[#E8F0FE]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-[#E8F0FE]'}`}>
              <Clock className="w-5 h-5 text-[#1A73E8]" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>Recently Opened</p>
              <p className="text-xl font-bold">{recentFiles.length} items</p>
            </div>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`p-2 rounded-xl border transition-colors flex items-center gap-1 text-xs font-semibold ${isDark ? 'border-[#303134] hover:bg-[#3C4043]' : 'border-[#DADCE0] hover:bg-[#F1F3F4]'}`}
          >
            <Settings className="w-4 h-4" /> Limit: {maxRecentCount}
          </button>
        </div>

        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-sm border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#202124]' : 'bg-red-50'}`}>
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>History Actions</p>
              <p className="text-sm font-medium">Clear items</p>
            </div>
          </div>
          {recentFiles.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="p-2 rounded-xl text-xs font-semibold border border-red-200 text-red-500 bg-red-50/50 hover:bg-red-100 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Config slider overlay/section */}
      {showConfig && (
        <div className={`mx-4 p-4 rounded-xl border mb-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150 ${isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#DADCE0]'}`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Configure History Limit
            </h4>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#1A73E8]/20 text-blue-800 dark:text-blue-300">
              Max {maxRecentCount} files
            </span>
          </div>
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mb-3">
            Adjust the slider below to set the maximum quantity of recently opened files to be stored in history.
          </p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={maxRecentCount}
              onChange={e => handleLimitChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex items-center gap-1.5">
              {[10, 20, 50, 100].map(val => (
                <button
                  key={val}
                  onClick={() => handleLimitChange(val)}
                  className={`px-3 py-1 text-xs rounded-lg border transition-all ${maxRecentCount === val ? 'bg-blue-600 text-white border-transparent' : 'bg-transparent text-inherit border-gray-300 dark:border-gray-600'}`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-[#E8EAED] dark:border-[#303134]">
        {/* Search */}
        <div className={`relative w-full sm:max-w-xs flex items-center rounded-xl p-1 px-3 border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F1F3F4] border-transparent focus-within:bg-white focus-within:border-[#1A73E8] focus-within:shadow-sm'} transition-all`}>
          <Search className={`w-4 h-4 mr-2 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`} />
          <input
            type="text"
            placeholder="Search recent history..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm py-1.5"
          />
        </div>

        {/* View and sort controls */}
        <div className="flex items-center gap-3 justify-end w-full sm:w-auto">
          {/* Sorting Field */}
          <div className="flex items-center gap-1 text-xs">
            <span className={isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}>Sort:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`text-xs p-1.5 rounded-lg border outline-none ${isDark ? 'bg-[#202124] border-[#303134]' : 'bg-white border-[#DADCE0]'}`}
            >
              <option value="opened">Last Opened</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
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

      {/* Grid or List of Recent Files */}
      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#303134]' : 'bg-blue-50'}`}>
              <Clock className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>
              {searchQuery ? 'No matching recent files' : 'No Recent History'}
            </h3>
            <p className={`text-xs max-w-xs mt-1 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              {searchQuery 
                ? 'Try searching with a different file name or clear the search query.'
                : 'Any files or documents you view or open will show up here consecutively in order of visitation.'}
            </p>
          </div>
        ) : (
          <div>
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' 
              : 'flex flex-col gap-2'
            }>
              {sorted.map(file => (
                <div key={file.id} className="relative group">
                  <FileCard
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
                    downloadBlob={downloadBlob}
                    shareFile={shareFile}
                    deleteFile={deleteFile}
                    toggleFavorite={toggleFavorite}
                    togglePin={togglePin}
                  />
                  {/* Subtle date/time stamp badge */}
                  <div className={`absolute top-2 left-2 z-10 pointer-events-none text-[9px] px-1.5 py-0.5 rounded font-mono font-medium backdrop-blur-sm opacity-90 transition-opacity ${isDark ? 'bg-black/60 text-blue-300' : 'bg-white/80 text-blue-700 shadow-sm'}`}>
                    {getFileLastOpenedString(file.id)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentFiles;

