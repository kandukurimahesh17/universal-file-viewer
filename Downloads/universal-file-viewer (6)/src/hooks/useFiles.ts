import { useState, useEffect, useRef } from 'react';
import { WorkspaceFile } from '../types/file';
import { FileService } from '../services/FileService';
import { DownloadService } from '../services/DownloadService';
import { PdfService } from '../services/PdfService';
import { ZipService } from '../services/ZipService';
import { FileOperations } from '../filemanager/FileOperations';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Capacitor } from '@capacitor/core';
import { SearchEngine } from '../search/SearchEngine';
import { DownloadNotifications } from '../notifications/DownloadNotifications';
import { ToolNotifications } from '../notifications/ToolNotifications';
import { NotificationManager } from '../notifications/NotificationManager';

export const useFiles = () => {
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subCategory, setSubCategory] = useState<string>('all');

  const [fileMenuOpen, setFileMenuOpen] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const [fabOpen, setFabOpen] = useState(false);
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isDownloadingUrl, setIsDownloadingUrl] = useState(false);

  const urlCache = useRef<{ [key: string]: string }>({});

  // 1. Initial Local Cache Load
  useEffect(() => {
    const cached = localStorage.getItem('filemanager_all_files');
    let loadedFiles: WorkspaceFile[] = [];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Remove any previous mock or simulated files to adhere to instructions strictly
          loadedFiles = parsed.filter(
            lf => lf && lf.id && 
                  !lf.id.startsWith('mahesh_') && 
                  !lf.id.startsWith('scan-') && 
                  !lf.id.startsWith('mock_') &&
                  !(lf.uri && lf.uri.startsWith('file:///simulated_root'))
          );
        }
      } catch (e) {
        console.error("Failed to restore file list from localStorage", e);
      }
    }

    setFiles(loadedFiles);
    localStorage.setItem('filemanager_all_files', JSON.stringify(loadedFiles));

    const restoreBlobs = async () => {
      try {
        const { IndexedFileDB } = await import('../database/IndexedFileDB');
        let changed = false;
        const updatedFiles = await Promise.all(
          loadedFiles.map(async (f) => {
            const isInvalidBlob = !f.blob || (typeof f.blob === 'object' && !(f.blob instanceof Blob) && Object.keys(f.blob).length === 0);
            if (isInvalidBlob) {
              const blob = await IndexedFileDB.getFileBlob(f.id);
              if (blob) {
                changed = true;
                return { ...f, blob };
              }
            }
            return f;
          })
        );
        if (changed) {
          setFiles(updatedFiles);
        }
      } catch (e) {
        console.error('Failed to restore file blobs from IndexedFileDB:', e);
      }
    };
    if (loadedFiles.length > 0) {
      restoreBlobs();
    }
  }, []);

  // 1.5 Add file explicitly
  const addFile = async (newFileEntry: WorkspaceFile) => {
    try {
      if (newFileEntry.blob) {
        const { IndexedFileDB } = await import('../database/IndexedFileDB');
        await IndexedFileDB.saveFileBlob(newFileEntry.id, newFileEntry.blob);
      }
    } catch(e) {}
    setFiles(prev => {
      const merged = [newFileEntry, ...prev];
      syncToLocalStorage(merged);
      return merged;
    });
  };

  // Sync files to SearchEngine index dynamically
  useEffect(() => {
    if (files) {
      SearchEngine.initialize(files).catch(err => {
        console.warn("Index rebuilding failed dynamically:", err);
      });
    }
  }, [files]);

  // Sync to localStorage of files
  const syncToLocalStorage = (updatedFiles: WorkspaceFile[]) => {
    // Strip the blob property from files before writing to localStorage to prevent polluting/corruption
    const cleanFiles = updatedFiles.map(f => {
      const { blob, ...rest } = f;
      return rest;
    });
    localStorage.setItem('filemanager_all_files', JSON.stringify(cleanFiles));
  };

  // 2. Perform File Auto-Scan
  const performScan = async () => {
    const scanned = await FileService.performScan();
    if (scanned && scanned.length > 0) {
      setFiles(prev => {
        const existing = new Set(prev.map(p => p.name));
        const newOnes = scanned.filter(f => !existing.has(f.name));
        const merged = [...newOnes, ...prev];
        syncToLocalStorage(merged);
        return merged;
      });
    }
  };

  // 3. Resolve Media URL (cached Blobs)
  const getFileUrl = (file: WorkspaceFile) => {
    if (!urlCache.current[file.id]) {
      if (file.blob && (file.blob instanceof Blob)) {
        try {
          urlCache.current[file.id] = URL.createObjectURL(file.blob);
        } catch (err) {
          console.warn("Failed to create object URL in getFileUrl", err);
          if (file.uri) {
            urlCache.current[file.id] = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(file.uri) : file.uri;
          }
        }
      } else if (file.uri) {
        urlCache.current[file.id] = Capacitor.isNativePlatform() ? Capacitor.convertFileSrc(file.uri) : file.uri;
      }
    }
    return urlCache.current[file.id];
  };

  // 4. Import Native/Capacitor file
  const handleImportFilesCapacitor = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FilePicker.pickFiles({
          multiple: true,
          readData: false,
        } as any);
        const { IndexedFileDB } = await import('../database/IndexedFileDB');
        const newItems: WorkspaceFile[] = [];
        const now = Date.now();
        for (let i = 0; i < result.files.length; i++) {
          const file = result.files[i];
          let blob: Blob;
          if (file.blob) {
            blob = file.blob;
          } else if (file.path) {
            const fileUrl = Capacitor.convertFileSrc(file.path);
            const res = await fetch(fileUrl);
            blob = await res.blob();
          } else {
             continue;
          }

          const newId = 'file-' + Math.random().toString(36).substr(2, 9);
          await IndexedFileDB.saveFileBlob(newId, blob);

          newItems.push({
              id: newId,
              name: file.name,
              path: file.path || '/',
              category: FileService.getFileCategory(file.name, file.mimeType || ''),
              size: file.size,
              mimeType: file.mimeType || '',
              blob: blob,
              lastModified: now + i,
              isFavorite: false,
              isPinned: false
          });
        }
        setFiles(prev => {
          const merged = [...newItems, ...prev];
          syncToLocalStorage(merged);
          return merged;
        });
        setFabOpen(false);
      } else {
        document.getElementById('hidden-file-input')?.click();
      }
    } catch (e) {
      console.error(e);
      setFabOpen(false);
    }
  };

  // 5. Import standard input file (Web SPA fallback)
  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    try {
      const { IndexedFileDB } = await import('../database/IndexedFileDB');
      const newItems: WorkspaceFile[] = [];
      const now = Date.now();
      for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          if (file.size <= 0) continue;
          
          const newId = 'file-' + Math.random().toString(36).substr(2, 9);
          await IndexedFileDB.saveFileBlob(newId, file);

          newItems.push({
              id: newId,
              name: file.name,
              path: '/',
              category: FileService.getFileCategory(file.name, file.type),
              size: file.size,
              mimeType: file.type,
              blob: file,
              lastModified: now + i,
              isFavorite: false,
              isPinned: false
          });
      }
      setFiles(prev => {
        const merged = [...newItems, ...prev];
        syncToLocalStorage(merged);
        return merged;
      });
    } catch (err) {
      console.error('Failed to import file blobs:', err);
    } finally {
      setFabOpen(false);
      e.target.value = '';
    }
  };

  // 6. Download file from URL
  const handleUrlDownload = async () => {
    if (!urlInput.trim()) return;
    setIsDownloadingUrl(true);
    DownloadNotifications.notifyDownloadStarted(urlInput);
    try {
      const file = await DownloadService.downloadFromUrl(urlInput);
      if (file.blob) {
        const { IndexedFileDB } = await import('../database/IndexedFileDB');
        await IndexedFileDB.saveFileBlob(file.id, file.blob);
      }
      setFiles(prev => {
        const merged = [file, ...prev];
        syncToLocalStorage(merged);
        return merged;
      });
      setUrlModalOpen(false);
      setUrlInput('');
      setFabOpen(false);
      DownloadNotifications.notifyDownloadSuccess(file.name, file.size);
    } catch (e: any) {
      DownloadNotifications.notifyDownloadError(urlInput, e.message);
    } finally {
      setIsDownloadingUrl(false);
    }
  };

  // 7. Core document to PDF conversion
  const convertDocToPdf = async (file: WorkspaceFile, setLoading: (l: boolean) => void) => {
    try {
      setLoading(true);
      const newFile = await PdfService.convertDocToPdf(file);
      setFiles(prev => {
        const merged = [newFile, ...prev];
        syncToLocalStorage(merged);
        return merged;
      });
      ToolNotifications.notifyPdfMerged(newFile.name, 1);
    } catch(e: any) {
      NotificationManager.error('Conversion failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // 8. Single File Deletion
  const deleteFile = async (id: string) => {
    try {
      const { IndexedFileDB } = await import('../database/IndexedFileDB');
      await IndexedFileDB.deleteFileBlob(id);
    } catch (e) {
      console.warn("IndexedFileDB blob delete failed for single file:", e);
    }
    const updated = await FileOperations.deleteFile(files, id, urlCache);
    setFiles(updated);
    syncToLocalStorage(updated);
  };

  // 9. Single File favorite toggle
  const toggleFavorite = (id: string) => {
    const updated = FileOperations.toggleFavorite(files, id);
    setFiles(updated);
    syncToLocalStorage(updated);
  };

  // 10. Single File pinning toggle
  const togglePin = (id: string) => {
    const updated = FileOperations.togglePin(files, id);
    setFiles(updated);
    syncToLocalStorage(updated);
  };

  // 11. Rename Workspace File
  const renameFile = async (id: string) => {
    const updated = await FileOperations.renameFile(files, id);
    if (updated) {
       setFiles(updated);
       syncToLocalStorage(updated);
    }
  };

  // 12. Native sharing
  const shareFile = async (file: WorkspaceFile) => {
    await FileOperations.shareFile(file);
  };

  // 13. Blob file download wrapper
  const downloadBlob = async (blob: Blob, name: string) => {
    await FileOperations.downloadBlob(blob, name);
  };

  // 14. ZIP File extraction integration
  const extractZipFile = async (file: WorkspaceFile, closeOverlay: () => void) => {
    try {
      const newFiles = await ZipService.extractZip(file);
      setFiles(prev => {
        const merged = [...newFiles, ...prev];
        syncToLocalStorage(merged);
        return merged;
      });
      ToolNotifications.notifyZipExtracted(file.name, newFiles.length);
      closeOverlay();
    } catch (e: any) {
      NotificationManager.error("Failed to extract ZIP: " + (e.message || "corrupt or unsupported structure"));
    }
  };

  // 15. Standard Multi-select toggle
  const toggleSelection = (id: string) => {
      const newSel = new Set(selectedFileIds);
      if (newSel.has(id)) newSel.delete(id);
      else newSel.add(id);
      setSelectedFileIds(newSel);
      if (newSel.size === 0) {
         setIsSelectMode(false);
      } else {
         setIsSelectMode(true);
      }
  };

  // 16. Multi-select bulk deletion
  const bulkDelete = async () => {
     if (!confirm(`Delete ${selectedFileIds.size} files?`)) return;
     
     try {
       const { IndexedFileDB } = await import('../database/IndexedFileDB');
       for (const id of Array.from(selectedFileIds)) {
         await IndexedFileDB.deleteFileBlob(id);
       }
     } catch (e) {
       console.warn("IndexedFileDB delete failed during bulk delete:", e);
     }
     
     if (Capacitor.isNativePlatform()) {
        try {
          const filesToDelete = files.filter(f => selectedFileIds.has(f.id));
          const { DeleteManager } = await import('../filemanager/DeleteManager');
          await DeleteManager.deleteFiles(filesToDelete as any);
        } catch (e) {
          console.error("Bulk delete native error", e);
        }
     }

     setFiles(prev => {
       const filtered = prev.filter(f => !selectedFileIds.has(f.id));
       syncToLocalStorage(filtered);
       return filtered;
     });
     setIsSelectMode(false);
     setSelectedFileIds(new Set());
  };

  // 17. Safe document load & viewer triggering
  const openFile = async (file: WorkspaceFile, openOverlay: (overlay: any) => void) => {
    setActiveFileId(file.id);
    openOverlay('viewer');
    setFileMenuOpen(null);

    let finalBlob = (file.blob && file.blob instanceof Blob) ? file.blob : null;
    if (!finalBlob) {
      // 0. Try to load from IndexedDB first as a reliable Web upload source
      try {
        const { IndexedFileDB } = await import('../database/IndexedFileDB');
        const dbBlob = await IndexedFileDB.getFileBlob(file.id);
        if (dbBlob) {
          finalBlob = dbBlob;
        }
      } catch (err) {
        console.warn("IndexedFileDB lookup failed during openFile:", err);
      }

      // 1. Try to fetch the file contents via AndroidStorage (covers simulated, Web database, native Storage)
      if (!finalBlob) {
        try {
          const { AndroidStorage } = await import('../integrations/AndroidStorage');
          const resolved = await AndroidStorage.openFile(file);
          if (resolved) {
            finalBlob = resolved;
          }
        } catch (err) {
          console.warn("AndroidStorage lookup failed during openFile:", err);
        }
      }

      // 2. Fallback to direct fetch utilizing convertFileSrc
      if (!finalBlob && file.uri && !file.uri.startsWith('file:///simulated_root')) {
        try {
          const res = await fetch(Capacitor.convertFileSrc(file.uri));
          finalBlob = await res.blob();
        } catch (e) {
          console.error("Direct fetch of uri failed during openFile:", e);
        }
      }
    }

    setFiles(prev => {
      const updated = prev.map(f => f.id === file.id ? { ...f, blob: finalBlob || f.blob, lastAccessedAt: Date.now() } : f);
      syncToLocalStorage(updated);
      return updated;
    });
  };

  // Computations
  const favorites = files.filter(f => f.isFavorite).sort((a,b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));
  const recent = [...files].sort((a,b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.lastAccessedAt || 0) - (a.lastAccessedAt || 0);
  }).slice(0, 10);

  return {
    files,
    setFiles,
    searchQuery,
    setSearchQuery,
    activeFileId,
    setActiveFileId,
    categoryFilter,
    setCategoryFilter,
    fileMenuOpen,
    setFileMenuOpen,
    isSelectMode,
    setIsSelectMode,
    selectedFileIds,
    setSelectedFileIds,
    fabOpen,
    setFabOpen,
    urlModalOpen,
    setUrlModalOpen,
    urlInput,
    setUrlInput,
    isDownloadingUrl,
    setIsDownloadingUrl,
    favorites,
    recent,
    subCategory,
    setSubCategory,

    performScan,
    getFileUrl,
    handleImportFilesCapacitor,
    handleImportFiles,
    addFile,
    handleUrlDownload,
    convertDocToPdf,
    deleteFile,
    toggleFavorite,
    togglePin,
    renameFile,
    shareFile,
    downloadBlob,
    extractZipFile,
    toggleSelection,
    bulkDelete,
    openFile,
  };
};

export default useFiles;
