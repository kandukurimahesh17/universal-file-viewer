import React from 'react';
import { 
  Download, Folder, FileText, Grid, Layers, HardDrive, 
  Image as ImageIcon, Music, Video, Archive, Code 
} from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { FileCard } from '../components/FileCard';
import FileIcon from '../components/FileIcon';
import { WorkspaceFile } from '../App';
import { NavPage } from '../core/NavigationManager';

interface HomePageProps {
  isDark: boolean;
  setCurrentNav: (nav: NavPage) => void;
  setCategoryFilter: (filter: string) => void;
  setSubCategory: (sub: string) => void;
  favorites: WorkspaceFile[];
  recent: WorkspaceFile[];
  openFile: (file: WorkspaceFile) => void;
  getFileUrl: (file: WorkspaceFile) => string;
  handleFilePressStart: (id: string) => void;
  handleFilePressEnd: () => void;
  toggleSelection: (id: string) => void;
  fileMenuOpen: string | null;
  setFileMenuOpen: (id: string | null) => void;
  renameFile: (id: string) => void;
  convertDocToPdf: (file: WorkspaceFile) => void;
  openToolOverlay?: (toolId: string, file: WorkspaceFile) => void;
  convertPdfToImages: (file: WorkspaceFile) => void;
  extractZipFile: (file: WorkspaceFile) => void;
  downloadBlob: (blob: Blob, name: string) => void;
  shareFile: (file: WorkspaceFile) => void;
  deleteFile: (id: string) => void;
  toggleFavorite: (id: string) => void;
  togglePin: (id: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  isDark,
  setCurrentNav,
  setCategoryFilter,
  setSubCategory,
  favorites,
  recent,
  openFile,
  getFileUrl,
  handleFilePressStart,
  handleFilePressEnd,
  toggleSelection,
  fileMenuOpen,
  setFileMenuOpen,
  renameFile,
  convertDocToPdf,
  openToolOverlay,
  convertPdfToImages,
  extractZipFile,
  downloadBlob,
  shareFile,
  deleteFile,
  toggleFavorite,
  togglePin,
}) => {
  return (
    <div className="px-5 space-y-6 pb-6 w-full">
      {/* Search Bar - Google Style Pill */}
      <SearchBar isDark={isDark} onClick={() => setCurrentNav('search')} placeholder="Search in Workspace" />

      {/* Suggested Categories */}
      <div>
        <h2 className={`text-sm font-semibold mb-4 tracking-tight ${isDark ? 'text-[#9AA0A6]' : 'text-[#303134]'}`}>
          Suggested Categories
        </h2>
        <div className="grid grid-cols-4 gap-3.5 sm:gap-4">
          {[
            { 
              label: 'PDFs', 
              icon: <FileText className="w-6 h-6 text-[#EA4335]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('documents');
                setSubCategory('pdf');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Docs', 
              icon: <FileText className="w-6 h-6 text-[#4285F4]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('documents');
                setSubCategory('word');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Images', 
              icon: <ImageIcon className="w-6 h-6 text-[#34A853]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('image');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Audio', 
              icon: <Music className="w-6 h-6 text-[#FBBC05]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('audio');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Video', 
              icon: <Video className="w-6 h-6 text-[#EA4335]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('video');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Zips', 
              icon: <Archive className="w-6 h-6 text-[#7D756C]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('zip');
                setCurrentNav('files');
              }
            },
            { 
              label: 'Code', 
              icon: <Code className="w-6 h-6 text-[#4285F4]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('code');
                setCurrentNav('files');
              }
            },
            { 
              label: 'All', 
              icon: <Folder className="w-6 h-6 text-[#5F6368] dark:text-[#9AA0A6]" strokeWidth={1.5} />, 
              onClick: () => {
                setCategoryFilter('all');
                setSubCategory('all');
                setCurrentNav('files');
              }
            },
          ].map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-5 px-2 rounded-[24px] cursor-pointer transition-all duration-200 active:scale-95 border hover:scale-[1.02] ${
                isDark 
                  ? 'bg-[#202124] border-[#303134] hover:bg-[#303134] text-[#E3E3E3] shadow-[0_2px_8px_rgba(0,0,0,0.2)]' 
                  : 'bg-white border-[#E8EAED]/90 hover:bg-[#F8F9FA] text-[#3C4043] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(32,33,36,0.06)]'
              }`}
            >
              <div className="mb-2 flex items-center justify-center">
                {item.icon}
              </div>
              <span className={`text-[12px] font-medium tracking-tight text-center ${isDark ? 'text-[#E3E3E3]' : 'text-[#3C4043]'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <div>
        <h2 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
          Recent
        </h2>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <div className={`p-8 text-center rounded-3xl ${isDark ? 'bg-[#303134]' : 'bg-white border border-[#E8EAED]'}`}>
              <div
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${
                  isDark ? 'bg-[#202124]' : 'bg-[#F0F4F9]'
                }`}
              >
                <HardDrive className={`w-6 h-6 ${isDark ? 'text-[#9AA0A6]' : 'text-[#4285F4]'}`} />
              </div>
              <p className={`text-sm mb-1 ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>Nothing here yet</p>
              <p className={`text-[12px] ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                Device documents and downloads will appear here.
              </p>
            </div>
          ) : (
            recent.map(f => (
              <FileCard
                key={f.id}
                file={f}
                isSelected={false}
                isSelectMode={false}
                viewMode="list"
                isDark={isDark}
                getFileUrl={getFileUrl}
                handleFilePressStart={handleFilePressStart}
                handleFilePressEnd={handleFilePressEnd}
                toggleSelection={toggleSelection}
                openFile={openFile}
                fileMenuOpen={fileMenuOpen}
                setFileMenuOpen={setFileMenuOpen}
                renameFile={renameFile}
                convertDocToPdf={convertDocToPdf}
                openToolOverlay={openToolOverlay}
                convertPdfToImages={convertPdfToImages}
                extractZipFile={extractZipFile}
                downloadBlob={downloadBlob}
                shareFile={shareFile}
                deleteFile={deleteFile}
                toggleFavorite={toggleFavorite}
                togglePin={togglePin}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
