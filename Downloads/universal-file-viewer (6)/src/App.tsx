/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Folder, Globe, Plus, ChevronLeft } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// --- Services & Utilities ---
import { formatBytes } from './utils/imageUtils';

// --- Pages ---
import HomePage from './pages/HomePage';
import FilesPage from './pages/FilesPage';
import FavoritesManager from './filemanager/FavoritesManager';
import ToolsPage from './pages/ToolsPage';
import SettingsPage from './pages/SettingsPage';
import SearchPage from './pages/SearchPage';

// --- Shared Components ---
import { Header } from './components/Header';
import { BottomNavigation } from './components/BottomNavigation';
import { LoadingScreen } from './components/LoadingScreen';
import { Sidebar } from './components/Sidebar';

// --- Tools ---
import ImageToPdf from './tools/pdf/ImageToPdf';
import PdfToImages from './tools/pdf/PdfToImages';
import MergePdf from './tools/pdf/MergePdf';
import SplitPdf from './tools/pdf/SplitPdf';
import WatermarkPdf from './tools/pdf/WatermarkPdf';
import ProtectPdf from './tools/pdf/ProtectPdf';
import CompressPdf from './tools/pdf/CompressPdf';
import RotatePdf from './tools/pdf/RotatePdf';
import ImageCompressor from './tools/ImageCompressor';

// --- Overlays & Dialogs ---
import UrlImportDialog from './components/common/UrlImportDialog';
import FileInfoDialog from './components/common/FileInfoDialog';
import ViewerOverlay from './components/viewer/ViewerOverlay';

// --- Providers, Contexts & Hooks ---
import { ThemeProvider, useTheme } from './core/ThemeProvider';
import { PermissionProvider, usePermissions } from './core/PermissionProvider';
import { NotificationProvider } from './core/NotificationProvider';
import { AdProvider } from './core/AdProvider';
import { NavigationManager, useNavigation } from './core/NavigationManager';
import { useFiles } from './hooks/useFiles';
import { usePullToRefresh } from './hooks/usePullToRefresh';

// --- Types ---
import { WorkspaceFile, FileCategory } from './types/file';

function AppContent() {
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentNav, setCurrentNav, activeOverlay, openOverlay, closeOverlay, isViewerImmersive, setIsViewerImmersive } = useNavigation();
  const { perms, setPerms, requestPermission } = usePermissions();

  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const f = useFiles();
  const ptr = usePullToRefresh();

  useEffect(() => {
    let backButtonListener: any = null;
    if (Capacitor.isNativePlatform()) {
      backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (activeOverlay !== 'none') {
          closeOverlay();
        } else if (f.urlModalOpen) {
           f.setUrlModalOpen(false);
        } else if (currentNav !== 'home') {
          setCurrentNav('home');
        } else if (!canGoBack) {
          CapacitorApp.exitApp();
        } else {
          window.history.back();
        }
      });
    }

    return () => {
      if (backButtonListener) {
        backButtonListener.then((listener: any) => listener.remove());
      }
    };
  }, [activeOverlay, currentNav, f.urlModalOpen]);

  useEffect(() => {
    f.performScan();
  }, []);

  const activeFile = f.files.find(item => item.id === f.activeFileId) || null;

  return (
    <div className={`flex justify-center min-h-screen ${isDark ? 'bg-black' : 'bg-[#E8EAED]'}`}>
      <div className={`w-full ${isDark ? 'bg-[#1F1F1F] text-[#E3E3E3]' : 'bg-[#F8F9FA] text-[#202124]'} h-screen flex flex-col relative shadow-2xl overflow-hidden font-sans`}>
        {loading && <LoadingScreen isDark={isDark} />}

        {/* Main Base Screens */}
        {activeOverlay === 'none' && (
          <>
            <Header currentNav={currentNav} setCurrentNav={setCurrentNav} isDark={isDark} onMenuClick={() => setSidebarOpen(true)} />

            <main 
              ref={ptr.scrollRef}
              onTouchStart={ptr.handleTouchStart}
              onTouchMove={ptr.handleTouchMove}
              onTouchEnd={() => ptr.handleTouchEnd(f.performScan)}
              className="flex-1 overflow-y-auto pb-28 scroll-smooth relative"
            >
              <div 
                className="w-full flex items-center justify-center overflow-hidden transition-all duration-200" 
                style={{ height: `${ptr.pullDist}px` }}
              >
                {ptr.pullDist > 10 && (
                  <div className={`flex items-center gap-2 text-sm font-medium ${isDark ? 'text-[#8AB4F8]' : 'text-[#1A73E8]'}`}>
                     <RefreshCw className={`w-5 h-5 ${ptr.refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${ptr.pullDist * 2}deg)` }}/>
                     {ptr.refreshing ? 'Refreshing...' : 'Pull to refresh'}
                  </div>
                )}
              </div>
              
              {currentNav === 'home' && (
                <HomePage
                  isDark={isDark}
                  setCurrentNav={setCurrentNav}
                  setCategoryFilter={f.setCategoryFilter}
                  setSubCategory={f.setSubCategory}
                  favorites={f.favorites}
                  recent={f.recent}
                  openFile={(file) => f.openFile(file, openOverlay)}
                  getFileUrl={f.getFileUrl}
                  handleFilePressStart={f.toggleSelection}
                  handleFilePressEnd={() => {}}
                  toggleSelection={f.toggleSelection}
                  fileMenuOpen={f.fileMenuOpen}
                  setFileMenuOpen={f.setFileMenuOpen}
                  renameFile={f.renameFile}
                  convertDocToPdf={(file) => f.convertDocToPdf(file, setLoading)}
                  convertPdfToImages={(file) => { f.setActiveFileId(file.id); openOverlay('tool_format'); }}
                  openToolOverlay={(toolId, file) => { f.setActiveFileId(file.id); openOverlay(toolId); }}
                  extractZipFile={(file) => f.extractZipFile(file, closeOverlay)}
                  downloadBlob={f.downloadBlob}
                  shareFile={f.shareFile}
                  deleteFile={f.deleteFile}
                  toggleFavorite={f.toggleFavorite}
                  togglePin={f.togglePin}
                />
              )}

              {currentNav === 'files' && (
                <FilesPage
                  files={f.files}
                  isDark={isDark}
                  onOpenFile={(file) => f.openFile(file, openOverlay)}
                  getFileUrl={f.getFileUrl}
                  isSelectMode={f.isSelectMode}
                  setIsSelectMode={f.setIsSelectMode}
                  selectedFileIds={f.selectedFileIds}
                  setSelectedFileIds={f.setSelectedFileIds}
                  handleFilePressStart={f.toggleSelection}
                  handleFilePressEnd={() => {}}
                  toggleSelection={f.toggleSelection}
                  bulkDelete={f.bulkDelete}
                  fileMenuOpen={f.fileMenuOpen}
                  setFileMenuOpen={f.setFileMenuOpen}
                  renameFile={f.renameFile}
                  convertDocToPdf={(file) => f.convertDocToPdf(file, setLoading)}
                  convertPdfToImages={(file) => { f.setActiveFileId(file.id); openOverlay('tool_format'); }}
                  openToolOverlay={(toolId, file) => { f.setActiveFileId(file.id); openOverlay(toolId); }}
                  extractZipFile={(file) => f.extractZipFile(file, closeOverlay)}
                  downloadBlob={f.downloadBlob}
                  shareFile={f.shareFile}
                  deleteFile={f.deleteFile}
                  toggleFavorite={f.toggleFavorite}
                  togglePin={f.togglePin}
                  categoryFilter={f.categoryFilter}
                  setCategoryFilter={f.setCategoryFilter}
                  searchQuery={f.searchQuery}
                  setSearchQuery={f.setSearchQuery}
                  subCategory={f.subCategory}
                  setSubCategory={f.setSubCategory}
                />
              )}

              {currentNav === 'starred' && (
                <FavoritesManager
                  files={f.files}
                  isDark={isDark}
                  onOpenFile={(file) => f.openFile(file, openOverlay)}
                  getFileUrl={f.getFileUrl}
                  isSelectMode={f.isSelectMode}
                  setIsSelectMode={f.setIsSelectMode}
                  selectedFileIds={f.selectedFileIds}
                  setSelectedFileIds={f.setSelectedFileIds}
                  handleFilePressStart={f.toggleSelection}
                  handleFilePressEnd={() => {}}
                  toggleSelection={f.toggleSelection}
                  fileMenuOpen={f.fileMenuOpen}
                  setFileMenuOpen={f.setFileMenuOpen}
                  renameFile={f.renameFile}
                  convertDocToPdf={(file) => f.convertDocToPdf(file, setLoading)}
                  convertPdfToImages={(file) => { f.setActiveFileId(file.id); openOverlay('tool_format'); }}
                  openToolOverlay={(toolId, file) => { f.setActiveFileId(file.id); openOverlay(toolId); }}
                  extractZipFile={(file) => f.extractZipFile(file, closeOverlay)}
                  downloadBlob={f.downloadBlob}
                  shareFile={f.shareFile}
                  deleteFile={f.deleteFile}
                  toggleFavorite={f.toggleFavorite}
                  togglePin={f.togglePin}
                />
              )}

              {currentNav === 'tools' && (
                <ToolsPage
                  isDark={isDark}
                  openOverlay={openOverlay}
                />
              )}

              {currentNav === 'settings' && (
                <SettingsPage
                  isDark={isDark}
                  theme={theme}
                  setTheme={setTheme}
                  files={f.files}
                  perms={perms}
                  setPerms={setPerms}
                  requestPermission={requestPermission}
                />
              )}

              {currentNav === 'search' && (
                <SearchPage
                  files={f.files}
                  isDark={isDark}
                  openFile={(file) => f.openFile(file, openOverlay)}
                  getFileUrl={f.getFileUrl}
                  setCurrentNav={setCurrentNav}
                  toggleFavorite={f.toggleFavorite}
                  deleteFile={f.deleteFile}
                />
              )}
            </main>

            {(currentNav === 'files' || currentNav === 'home') && activeOverlay === 'none' && (
              <div className="absolute bottom-24 right-5 z-40 flex flex-col items-end gap-3">
                 {f.fabOpen && (
                  <div className={`flex flex-col gap-2 p-3 rounded-2xl shadow-lg border ${isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'} origin-bottom-right transition-all`}>
                     <div onClick={f.handleImportFilesCapacitor} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`}>
                        <div className="bg-[#4285F4]/10 p-2 rounded-full text-[#4285F4]"><Folder className="w-5 h-5"/></div>
                        <span className={`text-[14px] font-medium ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>Device Storage</span>
                        <input id="hidden-file-input" type="file" multiple onChange={(e) => { f.handleImportFiles(e); }} className="hidden" />
                     </div>
                     <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`} onClick={() => f.setUrlModalOpen(true)}>
                        <div className="bg-[#34A853]/10 p-2 rounded-full text-[#34A853]"><Globe className="w-5 h-5"/></div>
                        <span className={`text-[14px] font-medium ${isDark ? 'text-[#E3E3E3]' : 'text-[#202124]'}`}>From Web URL</span>
                     </div>
                  </div>
                )}
                <button onClick={() => f.setFabOpen(!f.fabOpen)} className="flex items-center justify-center gap-2 px-4 h-14 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-[20px] shadow-[0_4px_10px_rgba(26,115,232,0.4)] cursor-pointer hover:shadow-lg active:scale-95 transition-all w-max font-medium text-[15px]">
                  <Plus className={`w-6 h-6 transition-transform ${f.fabOpen ? 'rotate-45' : ''}`} />
                  <span className="pr-1">New</span>
                </button>
              </div>
            )}

            <BottomNavigation currentNav={currentNav} setCurrentNav={setCurrentNav} isDark={isDark} />
          </>
        )}

        <UrlImportDialog
          isOpen={f.urlModalOpen}
          isDark={isDark}
          urlInput={f.urlInput}
          isDownloadingUrl={f.isDownloadingUrl}
          onUrlChange={f.setUrlInput}
          onClose={() => f.setUrlModalOpen(false)}
          onSubmit={f.handleUrlDownload}
        />

        <FileInfoDialog
          isOpen={activeOverlay === 'file_info'}
          file={activeFile}
          isDark={isDark}
          onClose={closeOverlay}
          onOpenFile={(file) => f.openFile(file, openOverlay)}
          formatBytes={formatBytes}
        />

        <ViewerOverlay
          isOpen={activeOverlay === 'viewer'}
          file={activeFile}
          isDark={isDark}
          isImmersive={isViewerImmersive}
          onToggleImmersive={() => setIsViewerImmersive(prev => !prev)}
          onClose={closeOverlay}
          onExtractZip={(file) => f.extractZipFile(file, closeOverlay)}
          onDownload={(file) => f.downloadBlob(file.blob as Blob, file.name)}
          onShare={f.shareFile}
          onToggleFavorite={f.toggleFavorite}
          onShowDetails={() => { closeOverlay(); setTimeout(() => openOverlay('file_info'), 50); }}
          getFileUrl={f.getFileUrl}
        />

        {activeOverlay === 'tool_compile' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <ImageToPdf 
               onClose={closeOverlay} 
               onAddFile={f.addFile} 
               onOpenFile={(file) => f.openFile(file, openOverlay)} 
               isDark={isDark} 
             />
          </div>
        )}

        {activeOverlay === 'tool_compress' && (
          <div className={`absolute inset-0 z-50 flex flex-col ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-[#F8F9FA] text-[#202124]'}`}>
            <header className={`px-3 py-3 flex items-center justify-between border-b shrink-0 sticky top-0 z-10 ${isDark ? 'border-[#3C4043] bg-[#303134]' : 'border-[#E8EAED] bg-white'}`}>
              <button onClick={() => closeOverlay()} className={`p-2 rounded-full ${isDark ? 'hover:bg-[#3C4043]' : 'hover:bg-[#F0F4F9]'}`}><ChevronLeft className="w-6 h-6" /></button>
              <h2 className="text-[18px] font-medium flex-1 px-2 text-center" style={{fontFamily: "'Google Sans', 'Inter', sans-serif"}}>Compressor</h2>
              <div className="w-10"></div>
            </header>
            <div className="flex-1 overflow-y-auto">
              <ImageCompressor />
            </div>
          </div>
        )}

        {activeOverlay === 'tool_format' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <PdfToImages file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} />
          </div>
        )}

        {activeOverlay === 'tool_merge' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <MergePdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        {activeOverlay === 'tool_split' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <SplitPdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        {activeOverlay === 'tool_watermark' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <WatermarkPdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        {activeOverlay === 'tool_protect' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <ProtectPdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        {activeOverlay === 'tool_compress_pdf' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <CompressPdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        {activeOverlay === 'tool_rotate' && (
          <div className={`absolute inset-0 z-50 flex flex-col overflow-y-auto ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
             <RotatePdf file={activeFile} onClose={closeOverlay} onAddFile={f.addFile} isDark={isDark} files={f.files} />
          </div>
        )}

        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentNav={currentNav}
          setCurrentNav={setCurrentNav}
          categoryFilter={f.categoryFilter}
          setCategoryFilter={f.setCategoryFilter}
          isDark={isDark}
          onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        />

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PermissionProvider>
        <NotificationProvider>
          <AdProvider>
            <NavigationManager>
              <AppContent />
            </NavigationManager>
          </AdProvider>
        </NotificationProvider>
      </PermissionProvider>
    </ThemeProvider>
  );
}

export type { WorkspaceFile, FileCategory };
