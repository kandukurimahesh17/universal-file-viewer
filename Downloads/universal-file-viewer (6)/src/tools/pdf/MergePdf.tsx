import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Trash2, 
  FileText, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  Info,
  X,
  PlusCircle,
  FolderOpen,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { NotificationManager } from '../../notifications/NotificationManager';
import { ToolNotifications } from '../../notifications/ToolNotifications';
import { WorkspaceFile } from '../../types/file';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SelectedPdf {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  buffer: ArrayBuffer;
}

interface MergeResult {
  blob: Blob;
  url: string;
  size: number;
  pageCount: number;
  name: string;
}

interface MergePdfProps {
  onClose?: () => void;
  onAddFile?: (file: any) => void;
  isDark?: boolean;
  files?: WorkspaceFile[];
  file?: WorkspaceFile;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const MergePdf: React.FC<MergePdfProps> = ({ 
  onClose, 
  onAddFile, 
  isDark: propIsDark,
  files = [],
  file
}) => {
  const [selectedPdfs, setSelectedPdfs] = useState<SelectedPdf[]>([]);
  const [outputName, setOutputName] = useState('Merged_Documents');
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  // Modals & UI controls
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // Result info
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  // Previewer zooming & scanning states
  const [zoom, setZoom] = useState(1.0);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Detect Dark Theme
  useEffect(() => {
    if (propIsDark !== undefined) return;
    const checkDark = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      setLocalIsDark(isDarkClass);
    };
    checkDark();
    
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [propIsDark]);

  useEffect(() => {
    if (file && selectedPdfs.length === 0) {
      handleAddWorkspaceFile(file);
    }
  }, [file]);

  // Clean URLs on unmount
  useEffect(() => {
    return () => {
      if (mergeResult) {
        URL.revokeObjectURL(mergeResult.url);
      }
    };
  }, [mergeResult]);

  // Handle local files imports
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await processAndAddFiles(Array.from(e.target.files));
    e.target.value = ''; // Reset input to fire again
  };

  const processAndAddFiles = async (fileList: File[]) => {
    const pdfs = fileList.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) {
      NotificationManager.error('Please select valid PDF files only.');
      return;
    }

    const processedList: SelectedPdf[] = [];

    for (const file of pdfs) {
      try {
        const buffer = await file.arrayBuffer();
        // Extract basic metadata utilizing pdf-lib
        const doc = await PDFDocument.load(buffer);
        const pageCount = doc.getPageCount();

        processedList.push({
          id: 'pdf-item-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now(),
          name: file.name,
          size: file.size,
          pageCount,
          buffer
        });
      } catch (err: any) {
        console.error('Failed to parse PDF', err);
        NotificationManager.error(`Could not read "${file.name}". Is it password protected?`);
      }
    }

    if (processedList.length > 0) {
      setSelectedPdfs(prev => [...prev, ...processedList]);
      NotificationManager.success(`Imported ${processedList.length} PDF file(s).`);
    }
  };

  // Pick from Workspace Handler
  const handleAddWorkspaceFile = async (wFile: WorkspaceFile) => {
    // Check if copy is already added
    if (selectedPdfs.some(item => item.name === wFile.name && item.size === wFile.size)) {
      NotificationManager.info(`"${wFile.name}" is already in the list.`);
      return;
    }

    try {
      let buffer: ArrayBuffer;
      if (wFile.blob) {
        buffer = await wFile.blob.arrayBuffer();
      } else if (wFile.uri) {
        const res = await fetch(wFile.uri);
        buffer = await res.arrayBuffer();
      } else {
        throw new Error('No readable data path');
      }

      const doc = await PDFDocument.load(buffer);
      const pageCount = doc.getPageCount();

      setSelectedPdfs(prev => [...prev, {
        id: 'pdf-item-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now(),
        name: wFile.name,
        size: wFile.size,
        pageCount,
        buffer
      }]);
      NotificationManager.success(`Added "${wFile.name}" to merge sequence.`);
    } catch (err: any) {
      console.error(err);
      NotificationManager.error(`Could not import "${wFile.name}": File access error.`);
    }
  };

  // Reordering functions
  const moveItemUp = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedPdfs];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setSelectedPdfs(updated);
  };

  const moveItemDown = (index: number) => {
    if (index === selectedPdfs.length - 1) return;
    const updated = [...selectedPdfs];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setSelectedPdfs(updated);
  };

  const removeItem = (id: string) => {
    setSelectedPdfs(prev => prev.filter(item => item.id !== id));
  };

  // Perform Merge Flow
  const handleMergePdfFiles = async () => {
    if (selectedPdfs.length < 2) {
      NotificationManager.error('Please select at least 2 PDF documents to merge.');
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setProcessingStatus('Assembling merge documents...');

    try {
      // 1. Create a blank PDF doc
      const mergedPdf = await PDFDocument.create();
      let currentPageProgress = 15;
      const progressDelta = 70 / selectedPdfs.length;

      // 2. Loop through and extract pages via pdf-lib copyPages method
      for (const item of selectedPdfs) {
        setProcessingStatus(`Injecting pages from "${item.name}"...`);
        const srcPdf = await PDFDocument.load(item.buffer, { ignoreEncryption: true });
        
        // Copy all pages
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));

        currentPageProgress += progressDelta;
        setProgress(Math.min(90, Math.round(currentPageProgress)));
      }

      setProcessingStatus('Saving merged structural tree...');
      setProgress(92);
      const mergedBytes = await mergedPdf.save();
      
      const fileBlob = new Blob([mergedBytes], { type: 'application/pdf' });
      const fileUrl = URL.createObjectURL(fileBlob);
      const cleanName = outputName.trim().replace(/\.pdf$/i, '') + '.pdf';

      setMergeResult({
        blob: fileBlob,
        url: fileUrl,
        size: fileBlob.size,
        pageCount: mergedPdf.getPageCount(),
        name: cleanName
      });

      // Register the file directly to the workspace automatically!
      try {
        const storedAllFiles = localStorage.getItem('filemanager_all_files');
        const workspaceFiles: any[] = storedAllFiles ? JSON.parse(storedAllFiles) : [];
        
        const fileId = 'pdf-merged-' + Math.random().toString(36).substring(2, 11);
        const newFileEntry = {
          id: fileId,
          name: cleanName,
          path: '/' + cleanName,
          category: 'pdf',
          size: fileBlob.size,
          mimeType: 'application/pdf',
          blob: fileBlob,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          isFavorite: false
        };
        
        localStorage.setItem('filemanager_all_files', JSON.stringify([newFileEntry, ...workspaceFiles]));

        if (onAddFile) {
          onAddFile(newFileEntry);
        }

        // Add to downloads index
        const storedDownloads = localStorage.getItem('filemanager_downloaded_ids');
        const downloadedIds: string[] = storedDownloads ? JSON.parse(storedDownloads) : [];
        if (!downloadedIds.includes(fileId)) {
          localStorage.setItem('filemanager_downloaded_ids', JSON.stringify([fileId, ...downloadedIds]));
        }
      } catch (innerErr) {
        console.warn('Workspace registration failed', innerErr);
      }

      setProgress(100);
      setProcessingStatus('Merge operation complete!');
      ToolNotifications.notifyPdfMerged(cleanName, selectedPdfs.length);

    } catch (err: any) {
      console.error(err);
      NotificationManager.error(`Merge process failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Result actions
  const handleDownload = async () => {
    if (!mergeResult) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.requestPermissions();
        const reader = new FileReader();
        reader.readAsDataURL(mergeResult.blob);
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          const cleanBase64 = rawBase64.split(',')[1];
          
          await Filesystem.writeFile({
            path: mergeResult.name,
            data: cleanBase64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success(`Successfully saved "${mergeResult.name}" to Downloads!`);
        };
      } catch (err: any) {
        console.error('Mobile save failed', err);
        NotificationManager.error('Downloads permission or saving failed.');
      }
    } else {
      const a = document.createElement('a');
      a.href = mergeResult.url;
      a.download = mergeResult.name;
      a.click();
    }
  };

  const handleShare = async () => {
    if (!mergeResult) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(mergeResult.blob);
        reader.onloadend = async () => {
          const rawBase = reader.result as string;
          const fileBase = rawBase.split(',')[1];
          
          const cacheFile = await Filesystem.writeFile({
            path: mergeResult.name,
            data: fileBase,
            directory: Directory.Cache
          });
          
          await Share.share({
            title: mergeResult.name,
            url: cacheFile.uri
          });
        };
      } catch (err) {
        console.error('Native sharing failed', err);
      }
    } else if (navigator.share && File) {
      try {
        const fileObj = new File([mergeResult.blob], mergeResult.name, { type: 'application/pdf' });
        await navigator.share({
          title: mergeResult.name,
          files: [fileObj]
        });
      } catch (e) {
        console.log('Share canceled or failing', e);
        NotificationManager.info('Web Share aborted. File has been saved to workspace.');
      }
    } else {
      NotificationManager.info('Direct sharing unsupported on this browser. Use Download instead.');
    }
  };

  // Rendering Document preview
  const handleScrollPreview = () => {
    if (!previewContainerRef.current || !numPages) return;
    const { scrollTop, scrollHeight, clientHeight } = previewContainerRef.current;
    
    const pageRatio = scrollTop / (scrollHeight - clientHeight);
    const calculatedPage = Math.min(
      Math.max(1, Math.round(pageRatio * numPages) + 1),
      numPages
    );
    setCurrentPage(calculatedPage);
  };

  const scrollToPreviewPage = (pIndex: number) => {
    if (!previewContainerRef.current || !numPages) return;
    const { scrollHeight } = previewContainerRef.current;
    const pageHeight = scrollHeight / numPages;
    previewContainerRef.current.scrollTo({ top: pageHeight * (pIndex - 1), behavior: 'smooth' });
    setCurrentPage(pIndex);
  };

  // Workspace items to list
  const workspacePdfs = files.filter(f => f.category === 'pdf' && !f.isDirectory);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'bg-[#1F1F1F] text-[#E3E3E3]' : 'bg-[#F8F9FA] text-[#202124]'}`}>
      
      {/* HEADER SECTION */}
      <header className={`px-4 py-4 flex items-center gap-3 border-b shrink-0 ${isDark ? 'border-[#3C4043] bg-[#2D2E30]' : 'border-[#E8EAED] bg-white shadow-sm'}`}>
        <button 
          onClick={onClose} 
          className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#444746]'}`}
          title="Back to utilities"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-medium tracking-tight" style={{fontFamily: "'Google Sans', 'Inter', sans-serif"}}>PDF Merger</h1>
          <p className="text-xs text-gray-500 font-normal">Package offline PDFs into a single compiled document</p>
        </div>
      </header>

      {/* RENDER PROGRESS COVER OVERLAY */}
      {isProcessing && (
        <div className={`p-8 flex flex-col items-center justify-center space-y-4 flex-1 ${isDark ? 'bg-black/90' : 'bg-white/95'}`}>
          <div className="relative flex items-center justify-center">
            <RefreshCw className="w-12 h-12 text-[#1A73E8] animate-spin" />
            <span className="absolute text-xs font-bold text-blue-600 font-mono">{progress}%</span>
          </div>
          <h3 className="font-bold text-sm tracking-wide uppercase">{processingStatus}</h3>
          <p className="text-xs text-gray-500 max-w-xs text-center">Creating virtual pages structure, extracting layers and merging layout coordinates...</p>
        </div>
      )}

      {/* RENDER DUAL BODY VIEW: PICKER STAGE OR COMPLETED PREVIEW */}
      {!isProcessing && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {!mergeResult ? (
            <div className="flex-1 flex flex-col overflow-hidden md:flex-row">
              
              {/* PRIMARY LEFT PANEL: PDF SELECTOR & LIST */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                
                {/* LARGE DRAG OR CHOOSE WINDOW */}
                <div className={`border-2 border-dashed rounded-3xl p-6 text-center transition-all ${
                  isDark ? 'border-gray-700 bg-[#2D2E30]/40' : 'border-gray-300 bg-white shadow-sm'
                } flex flex-col items-center justify-center gap-4`}>
                  <div className="bg-[#FEF7E0] p-4 rounded-full text-[#B06000]">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Select PDFs to combine</h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Upload documents on your device, or pull PDFs already saved within your Workspace storage</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 w-full mt-2">
                    <button 
                      onClick={() => setShowWorkspacePicker(true)}
                      className="flex items-center gap-2 justify-center px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full cursor-pointer text-xs font-semibold shadow-sm active:scale-95 transition-transform h-11"
                    >
                      <Plus className="w-4 h-4" /> Add PDF from Workspace
                    </button>
                    
                    {workspacePdfs.length > 0 && (
                      <div className={`flex items-center gap-2 justify-center px-4 py-2 border rounded-full text-xs font-semibold h-11 ${
                        isDark ? 'bg-white/5 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}>
                        <FolderOpen className="w-4 h-4" /> {workspacePdfs.length} PDFs available
                      </div>
                    )}
                  </div>
                </div>

                {/* PDF INTERACTIVE SEQUENCE CONTAINER */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      Merge Sequence ({selectedPdfs.length})
                    </h3>
                    {selectedPdfs.length > 0 && (
                      <button 
                        onClick={() => setSelectedPdfs([])}
                        className="text-xs text-red-500 hover:underline font-semibold"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {selectedPdfs.length > 0 ? (
                    <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar pb-10">
                      {selectedPdfs.map((pdf, index) => (
                        <div 
                          key={pdf.id}
                          className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                            isDark ? 'bg-[#2D2E30] border-gray-800' : 'bg-white border-[#E8EAED] shadow-sm'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDark ? 'bg-gray-800 text-[#E3E3E3]' : 'bg-[#E8F0FE] text-[#1A73E8]'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate" title={pdf.name}>
                              {pdf.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                              <span className="font-mono">{formatBytes(pdf.size)}</span>
                              <span>•</span>
                              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                {pdf.pageCount} {pdf.pageCount === 1 ? 'page' : 'pages'}
                              </span>
                            </div>
                          </div>

                          {/* REORDER / INTERACTION ACTIONS CONTAINER */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => moveItemUp(index)}
                              disabled={index === 0}
                              className={`p-1.5 rounded-lg border transition-all ${
                                index === 0 
                                  ? 'opacity-30 cursor-not-allowed border-transparent' 
                                  : isDark ? 'hover:bg-white/10 hover:text-white border-transparent' : 'hover:bg-gray-100 border-transparent'
                              }`}
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveItemDown(index)}
                              disabled={index === selectedPdfs.length - 1}
                              className={`p-1.5 rounded-lg border transition-all ${
                                index === selectedPdfs.length - 1 
                                  ? 'opacity-30 cursor-not-allowed border-transparent' 
                                  : isDark ? 'hover:bg-white/10 hover:text-white border-transparent' : 'hover:bg-gray-100 border-transparent'
                              }`}
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(pdf.id)}
                              className={`p-1.5 rounded-lg transition-all text-red-500 shrink-0 ${
                                isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'
                              }`}
                              title="Delete PDF"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-10 text-center rounded-2xl border flex flex-col items-center justify-center flex-1 ${
                      isDark ? 'bg-[#2D2E30]/20 border-gray-800 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}>
                      <Info className="w-8 h-8 opacity-40 mb-2" />
                      <p className="text-xs">No documents placed in queue yet.</p>
                      <p className="text-[10px] text-gray-400 mt-1">Files will render in sequential order from top to bottom</p>
                    </div>
                  )}
                </div>

              </div>
              
              {/* SLATE BOTTOM ACTIONS FOR PDF GENERATION */}
              <div className={`p-4 shrink-0 border-t flex flex-col gap-3 ${
                isDark ? 'bg-[#212121] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
              }`}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Output File Name</label>
                  <div className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 border ${
                    isDark ? 'bg-[#1F1F1F] border-[#3C4043]' : 'bg-[#F0F4F9] border-transparent'
                  }`}>
                    <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                    <input 
                      type="text" 
                      value={outputName}
                      onChange={e => setOutputName(e.target.value)}
                      placeholder="Enter filename"
                      className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-500 font-semibold"
                    />
                    <span className="text-xs text-gray-400 font-medium font-mono shrink-0">.pdf</span>
                  </div>
                </div>

                <button
                  onClick={handleMergePdfFiles}
                  disabled={selectedPdfs.length < 2}
                  className={`w-full py-3 rounded-full text-sm font-semibold tracking-wide shadow-md cursor-pointer transition-all active:scale-[0.98] ${
                    selectedPdfs.length < 2 
                      ? 'bg-gray-400 opacity-40 cursor-not-allowed text-white shadow-none'
                      : 'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-[0_4px_10px_rgba(26,115,232,0.3)]'
                  }`}
                >
                  Merge PDFs ({selectedPdfs.length} files)
                </button>
              </div>

            </div>
          ) : (
            
            /* COMPLETED MERGED PREVIEW RESULT STATE */
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* METADATA SUMMARY BAR */}
              <div className={`p-3.5 px-4 font-normal text-xs flex items-center justify-between border-b ${
                isDark ? 'bg-black/20 border-[#3C4043]' : 'bg-[#E8F0FE] border-[#ADCCF9] text-[#1967D2]'
              }`}>
                <div className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="font-semibold truncate">Successfully Merged Into "{mergeResult.name}"!</span>
                </div>
                <button 
                  onClick={() => setMergeResult(null)}
                  className="font-bold underline hover:no-underline pl-2 shrink-0 text-blue-600 dark:text-blue-400"
                >
                  Create New Merge
                </button>
              </div>

              {/* ACTION TOOLBAR */}
              <div className={`p-3 px-4 flex items-center justify-between border-b gap-3 shrink-0 ${
                isDark ? 'bg-[#2D2E30] border-[#3C4043]' : 'bg-white border-[#E8EAED]'
              }`}>
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-gray-400">Merged document details</span>
                  <span className="text-xs font-bold leading-none mt-1">
                    {mergeResult.pageCount} pages • {formatBytes(mergeResult.size)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShare}
                    className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-[#E3E3E3]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title="Share merged PDF"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-semibold shadow-sm active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>

              {/* REACT PDF DRAWING AREA */}
              <div className="flex-1 flex overflow-hidden">
                <div 
                  className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar bg-gray-200 dark:bg-[#121212]"
                  ref={previewContainerRef}
                  onScroll={handleScrollPreview}
                >
                  <div className="flex items-center justify-center mb-4 z-10 sticky top-0 bg-transparent pointer-events-none">
                    <div className="flex items-center gap-3 p-1.5 px-3 rounded-full bg-black/60 backdrop-blur pointer-events-auto text-white text-xs font-semibold shadow shadow-black">
                      <button 
                        onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} 
                        className="p-1 hover:bg-white/20 active:scale-95 rounded transition-transform"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span>{Math.round(zoom * 100)}%</span>
                      <button 
                        onClick={() => setZoom(z => Math.min(2.5, z + 0.2))} 
                        className="p-1 hover:bg-white/20 active:scale-95 rounded transition-transform"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <span className="opacity-40">|</span>
                      <span>{currentPage} / {numPages || '--'}</span>
                    </div>
                  </div>

                  <Document
                    file={mergeResult.url}
                    onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                    loading={<div className="flex justify-center p-12 text-xs font-mono text-gray-500 animate-pulse">Rendering merged layout preview...</div>}
                    className="flex flex-col items-center gap-4"
                  >
                    {numPages && Array.from(new Array(numPages), (_, i) => (
                      <div key={`page_${i + 1}`} className="shadow-lg relative border dark:border-gray-800 bg-white">
                        <Page 
                          pageNumber={i + 1} 
                          scale={zoom}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                        <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded font-bold font-mono">
                          Page {i + 1}
                        </div>
                      </div>
                    ))}
                  </Document>
                </div>

                {/* THUMBNAIL BAR */}
                {numPages && (
                  <div className="w-36 overflow-y-auto border-l bg-white dark:bg-[#1E1E1E] dark:border-gray-800 shrink-0 p-3 no-scrollbar hidden md:block">
                    <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-1 mb-3">Pages</h4>
                    <Document file={mergeResult.url} className="flex flex-col gap-3 items-center">
                      {Array.from(new Array(numPages), (_, index) => (
                        <div 
                          key={`thumb_${index + 1}`} 
                          onClick={() => scrollToPreviewPage(index + 1)}
                          className={`cursor-pointer transition-all border-2 w-full flex flex-col justify-center p-0.5 rounded ${
                            currentPage === index + 1 
                              ? 'border-blue-500 shadow ring-2 ring-blue-500/20' 
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <Page 
                            pageNumber={index + 1} 
                            scale={0.15} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                          />
                          <span className="text-[9px] text-center font-mono mt-0.5 font-bold block">Page {index + 1}</span>
                        </div>
                      ))}
                    </Document>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* OVERLAY: OFFLINE WORKSPACE PDF SELECTION DRAWER */}
      {showWorkspacePicker && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl border flex flex-col max-h-[85vh] animate-slide-up ${
            isDark ? 'bg-[#2D2E30] border-gray-800 text-white' : 'bg-white border-[#E8EAED] text-gray-900 shadow-2xl'
          }`}>
            <header className="p-4 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold">Pick PDFs from Workspace</h3>
              </div>
              <button 
                onClick={() => setShowWorkspacePicker(false)}
                className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {workspacePdfs.map(wp => {
                const isAlreadySelected = selectedPdfs.some(p => p.name === wp.name && p.size === wp.size);
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      if (!isAlreadySelected) handleAddWorkspaceFile(wp);
                    }}
                    className={`p-3.5 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                      isAlreadySelected 
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 pointer-events-none'
                        : isDark ? 'bg-gray-800/50 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100/80 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`w-5 h-5 ${isAlreadySelected ? 'text-amber-500' : 'text-blue-500'}`} />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate leading-tight">{wp.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono leading-none mt-1">
                          {formatBytes(wp.size)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isAlreadySelected ? (
                        <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-305 text-[10px] uppercase font-mono font-black border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Selected
                        </div>
                      ) : (
                        <button className="h-8 w-8 hover:bg-emerald-500/10 text-emerald-500 flex items-center justify-center rounded-full transition-transform active:scale-95">
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <footer className="p-4 border-t shrink-0 flex justify-end">
              <button
                onClick={() => setShowWorkspacePicker(false)}
                className="px-6 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full text-xs font-semibold shadow"
              >
                Close Picker
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};

export default MergePdf;
