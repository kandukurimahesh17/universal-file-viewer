import React, { useState, useEffect, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import JSZip from 'jszip';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Trash2, 
  FileText, 
  Split, 
  Plus, 
  Check, 
  Sparkles, 
  RefreshCw, 
  Info,
  X,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Layers,
  ChevronRight,
  Sliders,
  CheckSquare,
  Square
} from 'lucide-react';
import { NotificationManager } from '../../notifications/NotificationManager';
import { ToolNotifications } from '../../notifications/ToolNotifications';
import { WorkspaceFile } from '../../types/file';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SelectedPdf {
  name: string;
  size: number;
  pageCount: number;
  buffer: ArrayBuffer;
}

interface SplitPart {
  id: string;
  name: string;
  rangeInput: string;
}

interface GeneratedPart {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  pageCount: number;
  size: number;
}

interface SplitPdfProps {
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

/**
 * Parses user range string (e.g. "1-5, 8, 10-12") into sorted array of 1-based page indices
 */
function parsePagesRange(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const s = Math.max(1, Math.min(start, totalPages));
        const e = Math.max(1, Math.min(end, totalPages));
        const step = s <= e ? 1 : -1;
        for (let i = s; step > 0 ? i <= e : i >= e; i += step) {
          pages.add(i);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        pages.add(pageNum);
      }
    }
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export const SplitPdf: React.FC<SplitPdfProps> = ({ 
  onClose, 
  onAddFile, 
  isDark: propIsDark,
  files = [],
  file
}) => {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  // Split Configuration modes: 'extract' (one PDF with selected pages) | 'parts' (multiple multi-page ranges)
  const [splitMode, setSplitMode] = useState<'extract' | 'parts'>('extract');

  // Custom Extraction states (Single output)
  const [customRange, setCustomRange] = useState('1-3');
  const [extractedPdfName, setExtractedPdfName] = useState('Extracted_Document');

  // Multiple Split states (Multiple outputs)
  const [splitParts, setSplitParts] = useState<SplitPart[]>([
    { id: 'part-1', name: 'Part_1', rangeInput: '1-2' },
    { id: 'part-2', name: 'Part_2', rangeInput: '3' }
  ]);

  // Modals & UI states
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [progress, setProgress] = useState(0);

  // Split Output documents list
  const [generatedParts, setGeneratedParts] = useState<GeneratedPart[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  // Document preview zoom/paging controls
  const [zoom, setZoom] = useState(0.95);
  const [previewPages, setPreviewPages] = useState<number | null>(null);
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  // Sync / theme detection
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
    if (file && !selectedPdf) {
      handleAddWorkspaceFile(file);
    }
  }, [file]);

  // Clean object URLs on unmount or reset
  useEffect(() => {
    return () => {
      generatedParts.forEach(part => URL.revokeObjectURL(part.url));
    };
  }, [generatedParts]);

  // Real-time synchronization: parse current range and update matching active selection set
  const getActiveSelectedPages = (): Set<number> => {
    if (!selectedPdf) return new Set();
    
    if (splitMode === 'extract') {
      return new Set(parsePagesRange(customRange, selectedPdf.pageCount));
    } else {
      // Unite all split ranges to highlight targeted pages in thumbnails grid
      const combined = new Set<number>();
      splitParts.forEach(part => {
        parsePagesRange(part.rangeInput, selectedPdf.pageCount).forEach(p => combined.add(p));
      });
      return combined;
    }
  };

  const activePages = getActiveSelectedPages();

  // Handle local image/file selects
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    await processAndLoadPdf(e.target.files[0]);
    e.target.value = '';
  };

  const processAndLoadPdf = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      NotificationManager.error('Invalid file format. Please upload a PDF.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();

      setSelectedPdf({
        name: file.name,
        size: file.size,
        pageCount,
        buffer
      });

      // Initialize range inputs safely
      const defaultMax = Math.min(3, pageCount);
      setCustomRange(`1-${defaultMax}`);
      setExtractedPdfName(`${file.name.replace(/\.pdf$/i, '')}_split`);

      setSplitParts([
        { id: 'part-1', name: 'Part_1', rangeInput: `1-${Math.ceil(pageCount / 2)}` },
        { id: 'part-2', name: 'Part_2', rangeInput: pageCount > 1 ? `${Math.ceil(pageCount / 2) + 1}-${pageCount}` : '1' }
      ]);

      // Reset old outputs
      setGeneratedParts([]);
      setActivePreviewId(null);

      NotificationManager.success(`Loaded "${file.name}" with ${pageCount} pages.`);
    } catch (err: any) {
      console.error('Failed to parse PDF', err);
      NotificationManager.error('Could not decrypt or parse PDF. File may be encrypted.');
    }
  };

  const handleAddWorkspaceFile = async (wFile: WorkspaceFile) => {
    try {
      let buffer: ArrayBuffer;
      if (wFile.blob) {
        buffer = await wFile.blob.arrayBuffer();
      } else if (wFile.uri) {
        const res = await fetch(wFile.uri);
        buffer = await res.arrayBuffer();
      } else {
        throw new Error('Access path missing');
      }

      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageCount = doc.getPageCount();

      setSelectedPdf({
        name: wFile.name,
        size: wFile.size,
        pageCount,
        buffer
      });

      const defaultMax = Math.min(3, pageCount);
      setCustomRange(`1-${defaultMax}`);
      setExtractedPdfName(`${wFile.name.replace(/\.pdf$/i, '')}_split`);

      setSplitParts([
        { id: 'part-1', name: 'Part_1', rangeInput: `1-${Math.ceil(pageCount / 2)}` },
        { id: 'part-2', name: 'Part_2', rangeInput: pageCount > 1 ? `${Math.ceil(pageCount / 2) + 1}-${pageCount}` : '1' }
      ]);

      setGeneratedParts([]);
      setActivePreviewId(null);
      setShowWorkspacePicker(false);

      NotificationManager.success(`Loaded "${wFile.name}" successfully.`);
    } catch (err: any) {
      console.error(err);
      NotificationManager.error('Failed to parse selected Workspace PDF.');
    }
  };

  // Thumbnail interactivity
  const handlePageClick = (pageNum: number) => {
    if (!selectedPdf) return;

    if (splitMode === 'extract') {
      const indices = parsePagesRange(customRange, selectedPdf.pageCount);
      let updated: number[];
      if (indices.includes(pageNum)) {
        updated = indices.filter(p => p !== pageNum);
      } else {
        updated = [...indices, pageNum].sort((a, b) => a - b);
      }

      // Convert indices back to text range format
      if (updated.length === 0) {
        setCustomRange('');
      } else {
        // Build comma separated string
        setCustomRange(updated.join(','));
      }
    }
  };

  // Helper Preset Selections
  const applyPresetSelection = (type: 'all' | 'odd' | 'even' | 'clear') => {
    if (!selectedPdf) return;
    const total = selectedPdf.pageCount;
    let pages: number[] = [];

    if (type === 'all') {
      pages = Array.from({ length: total }, (_, i) => i + 1);
    } else if (type === 'odd') {
      pages = Array.from({ length: total }, (_, i) => i + 1).filter(p => p % 2 !== 0);
    } else if (type === 'even') {
      pages = Array.from({ length: total }, (_, i) => i + 1).filter(p => p % 2 === 0);
    }

    if (splitMode === 'extract') {
      setCustomRange(pages.join(','));
    }
  };

  // Multiple Split Parts manipulation
  const addSplitPart = () => {
    if (!selectedPdf) return;
    const count = splitParts.length + 1;
    setSplitParts(prev => [...prev, {
      id: 'part-' + Math.random().toString(36).substring(2, 9),
      name: `Part_${count}`,
      rangeInput: `${selectedPdf.pageCount}`
    }]);
  };

  const removeSplitPart = (id: string) => {
    if (splitParts.length <= 1) {
      NotificationManager.info('Must specify at least one target splitting part.');
      return;
    }
    setSplitParts(prev => prev.filter(p => p.id !== id));
  };

  const updatePartName = (id: string, name: string) => {
    setSplitParts(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p));
  };

  const updatePartRange = (id: string, value: string) => {
    setSplitParts(prev => prev.map(p => p.id === id ? { ...p, rangeInput: value } : p));
  };

  const handleSmartDivide = (size: number) => {
    if (!selectedPdf) return;
    const total = selectedPdf.pageCount;
    const result: SplitPart[] = [];
    let currentPart = 1;

    for (let i = 1; i <= total; i += size) {
      const end = Math.min(i + size - 1, total);
      result.push({
        id: 'p-' + currentPart,
        name: `Part_${currentPart}`,
        rangeInput: i === end ? `${i}` : `${i}-${end}`
      });
      currentPart++;
    }

    setSplitParts(result);
    NotificationManager.success(`Auto-generated ${result.length} split ranges!`);
  };

  // Perform PDF Split Execution
  const handleExecuteSplit = async () => {
    if (!selectedPdf) return;

    // Validate page range arrays
    type Plan = { name: string; pages: number[] };
    const splitPlans: Plan[] = [];

    if (splitMode === 'extract') {
      const pages = parsePagesRange(customRange, selectedPdf.pageCount);
      if (pages.length === 0) {
        NotificationManager.error('No pages selected or parsed within range specifications.');
        return;
      }
      const cleanName = extractedPdfName.trim().replace(/\.pdf$/i, '') + '.pdf';
      splitPlans.push({ name: cleanName, pages });
    } else {
      // Validate all parts
      for (const part of splitParts) {
        const pages = parsePagesRange(part.rangeInput, selectedPdf.pageCount);
        if (pages.length === 0) {
          NotificationManager.error(`Part "${part.name}" has an invalid or empty page selection range.`);
          return;
        }
        const cleanName = part.name.trim().replace(/\.pdf$/i, '') + '.pdf';
        splitPlans.push({ name: cleanName, pages });
      }
    }

    setIsProcessing(true);
    setProgress(15);
    setProcessingStatus('Securing output structures...');

    try {
      const outputs: GeneratedPart[] = [];
      const delta = 80 / splitPlans.length;
      let totalProgress = 15;

      const basePdf = await PDFDocument.load(selectedPdf.buffer, { ignoreEncryption: true });

      for (const plan of splitPlans) {
        setProcessingStatus(`Structuring columns for "${plan.name}" (${plan.pages.length} pages)...`);
        
        // Create new pdf and extract pages
        const newDoc = await PDFDocument.create();
        
        // pdf-lib operates on 0-based index for copyPages
        const zeroBasedPages = plan.pages.map(p => p - 1);
        const copiedPages = await newDoc.copyPages(basePdf, zeroBasedPages);
        copiedPages.forEach(page => newDoc.addPage(page));

        const bytes = await newDoc.save();
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        outputs.push({
          id: 'gen-part-' + Math.random().toString(36).substring(2, 11),
          name: plan.name,
          blob,
          url,
          pageCount: plan.pages.length,
          size: blob.size
        });

        totalProgress += delta;
        setProgress(Math.min(95, Math.ceil(totalProgress)));
      }

      setProcessingStatus('Exporting split objects dynamically...');
      
      // Auto save split results into offline workspace
      const storedAllFiles = localStorage.getItem('filemanager_all_files');
      const workspaceFiles: any[] = storedAllFiles ? JSON.parse(storedAllFiles) : [];
      let updatedWorkspace = [...workspaceFiles];

      const storedDownloads = localStorage.getItem('filemanager_downloaded_ids');
      const downloadedIds: string[] = storedDownloads ? JSON.parse(storedDownloads) : [];
      let updatedDownloads = [...downloadedIds];

      outputs.forEach(outItem => {
        const fileId = 'pdf-split-item-' + Math.random().toString(36).substring(2, 11);
        const newFileEntry = {
          id: fileId,
          name: outItem.name,
          path: '/' + outItem.name,
          category: 'pdf',
          size: outItem.size,
          mimeType: 'application/pdf',
          blob: outItem.blob,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          isFavorite: false
        };

        updatedWorkspace = [newFileEntry, ...updatedWorkspace];
        updatedDownloads = [fileId, ...updatedDownloads];

        if (onAddFile) {
          onAddFile(newFileEntry);
        }
      });

      localStorage.setItem('filemanager_all_files', JSON.stringify(updatedWorkspace));
      localStorage.setItem('filemanager_downloaded_ids', JSON.stringify(updatedDownloads));

      setGeneratedParts(outputs);
      setActivePreviewId(outputs[0].id);

      setProgress(100);
      setProcessingStatus('Completed split processing sequence successfully.');
      ToolNotifications.notifyPdfSplit(selectedPdf.name, outputs.length);

    } catch (err: any) {
      console.error(err);
      NotificationManager.error(`Splitting PDF pipeline failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download Output Part
  const handleDownloadPart = async (part: GeneratedPart) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.requestPermissions();
        const reader = new FileReader();
        reader.readAsDataURL(part.blob);
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          const cleanBase64 = rawBase64.split(',')[1];
          
          await Filesystem.writeFile({
            path: part.name,
            data: cleanBase64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success(`Successfully saved "${part.name}" to Downloads folder.`);
        };
      } catch (err) {
        console.error('Android folder write error', err);
        NotificationManager.error('Failed to save to mobile device local storage.');
      }
    } else {
      const a = document.createElement('a');
      a.href = part.url;
      a.download = part.name;
      a.click();
    }
  };

  // ZIP packaging for multiple generated parts
  const handleDownloadAllAsZip = async () => {
    if (generatedParts.length === 0) return;
    
    setIsProcessing(true);
    setProcessingStatus('Compiling files inside Zip payload...');
    setProgress(30);

    try {
      const zip = new JSZip();
      
      generatedParts.forEach(p => {
        zip.file(p.name, p.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFilename = `Split_Parts_${Date.now()}.zip`;

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(zipBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await Filesystem.writeFile({
            path: zipFilename,
            data: base64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success(`Successfully saved Zip index "${zipFilename}" to Downloads directory!`);
        };
      } else {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFilename;
        a.click();
        URL.revokeObjectURL(url);
      }

      ToolNotifications.notifyZipCreated(zipFilename, generatedParts.length);
    } catch (e: any) {
      console.error(e);
      NotificationManager.error('Failed to pack elements output: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Share output part
  const handleSharePart = async (part: GeneratedPart) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(part.blob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const cacheFile = await Filesystem.writeFile({
            path: part.name,
            data: base64,
            directory: Directory.Cache
          });
          await Share.share({
            title: part.name,
            url: cacheFile.uri
          });
        };
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else if (navigator.share && File) {
      try {
        const fileObj = new File([part.blob], part.name, { type: 'application/pdf' });
        await navigator.share({
          title: part.name,
          files: [fileObj]
        });
      } catch (e) {
        console.log('Share aborted', e);
      }
    } else {
      NotificationManager.info('Web Share unsupported. Re-saved directly to local workspace.');
    }
  };

  // Sync scroll positioning
  const handleScrollPreview = () => {
    if (!previewScrollRef.current || !previewPages) return;
    const { scrollTop, scrollHeight, clientHeight } = previewScrollRef.current;
    
    const pageRatio = scrollTop / (scrollHeight - clientHeight);
    const calculatedPage = Math.min(
      Math.max(1, Math.round(pageRatio * previewPages) + 1),
      previewPages
    );
    setPreviewCurrentPage(calculatedPage);
  };

  const scrollToPreviewPage = (pIndex: number) => {
    if (!previewScrollRef.current || !previewPages) return;
    const { scrollHeight } = previewScrollRef.current;
    const pageHeight = scrollHeight / previewPages;
    previewScrollRef.current.scrollTo({ top: pageHeight * (pIndex - 1), behavior: 'smooth' });
    setPreviewCurrentPage(pIndex);
  };

  // Retrieve active preview item from list
  const activePreviewPart = generatedParts.find(p => p.id === activePreviewId);
  const workspacePdfs = files.filter(f => f.category === 'pdf' && !f.isDirectory);

  return (
    <div className={`flex flex-col h-full w-full ${isDark ? 'bg-[#1F1F1F] text-[#E3E3E3]' : 'bg-[#F8F9FA] text-[#202124]'}`}>
      
      {/* APP HEADER */}
      <header className={`px-4 py-4 flex items-center gap-3 border-b shrink-0 ${isDark ? 'border-[#3C4043] bg-[#2D2E30]' : 'border-[#E8EAED] bg-white shadow-sm'}`}>
        <button 
          onClick={onClose} 
          className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-black/5 text-[#444746]'}`}
          title="Back to utilities"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-[18px] font-medium tracking-tight" style={{fontFamily: "'Google Sans', 'Inter', sans-serif"}}>PDF Splitter</h1>
          <p className="text-xs text-gray-500 font-normal">Extract specific pages or break a doc into smaller PDF parts offline</p>
        </div>
      </header>

      {/* LOADER SPLIT ANIMATION */}
      {isProcessing && (
        <div className={`p-8 flex flex-col items-center justify-center space-y-4 flex-1 ${isDark ? 'bg-black/90' : 'bg-white/95'}`}>
          <div className="relative flex items-center justify-center">
            <RefreshCw className="w-12 h-12 text-[#1A73E8] animate-spin" />
            <span className="absolute text-xs font-bold text-blue-600 font-mono">{progress}%</span>
          </div>
          <h3 className="font-bold text-sm tracking-wide uppercase">{processingStatus}</h3>
          <p className="text-xs text-gray-500 max-w-xs text-center font-normal">Processing vector parameters, rendering canvas thumbnails, and writing isolated file parts structure securely offline...</p>
        </div>
      )}

      {/* VIEW STAGES */}
      {!isProcessing && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* STAGE 1: NO PDF HIGHLIGHTED */}
          {!selectedPdf && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-5">
              <div className="bg-[#E8F0FE] p-6 rounded-full text-[#1967D2] animate-bounce">
                <Split className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-[20px] font-medium leading-normal">Choose target PDF Document</h2>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Extract individual page ranges or auto decompose lengthy manuals into isolated segments. Works completely offline ensuring confidential files never leave this device.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full py-4 justify-center">
                <button 
                  onClick={() => setShowWorkspacePicker(true)}
                  className="relative flex items-center justify-center gap-2 px-6 py-3 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-full cursor-pointer text-xs font-semibold shadow active:scale-95 transition-all w-full sm:w-auto h-12"
                >
                  <Plus className="w-4.5 h-4.5" /> Select File From Workspace
                </button>

                {workspacePdfs.length > 0 ? (
                  <div
                    className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-full text-xs font-semibold w-full sm:w-auto h-12 ${
                      isDark ? 'border-gray-700 bg-gray-800 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <FolderOpen className="w-4.5 h-4.5" /> {(workspacePdfs.length)} Available
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 font-mono italic">Workspace has no PDF files loaded yet.</div>
                )}
              </div>
            </div>
          )}

          {/* STAGE 2: PDF LOADED & READY TO CONFIGURE SPLIT */}
          {selectedPdf && generatedParts.length === 0 && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* LEFT COLUMN: ACTIONS & SETTINGS */}
              <div className={`w-full md:w-[380px] shrink-0 border-r flex flex-col overflow-y-auto ${
                isDark ? 'border-[#3C4043] bg-[#2D2E30]/50' : 'bg-white border-[#E8EAED] shadow-sm'
              }`}>
                
                {/* BACK TO SELECTION LINK */}
                <div className="p-4 border-b shrink-0 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Target Doc</span>
                    <h3 className="text-xs font-bold truncate mt-0.5" title={selectedPdf.name}>{selectedPdf.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedPdf.pageCount} pages • {formatBytes(selectedPdf.size)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPdf(null)}
                    className={`p-1.5 rounded-full border text-red-505 ${isDark ? 'hover:bg-white/10 border-transparent' : 'hover:bg-red-50 border-transparent'}`}
                    title="Change selected document"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* MODES TOGGLE */}
                <div className="p-4 border-b shrink-0 flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-widest pl-0.5">Extraction Method</label>
                  <div className={`flex rounded-xl p-1 ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setSplitMode('extract')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        splitMode === 'extract' 
                          ? isDark ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Selected Extract
                    </button>
                    <button
                      onClick={() => setSplitMode('parts')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        splitMode === 'parts'
                          ? isDark ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      Split Multiparts
                    </button>
                  </div>
                </div>

                {/* SUB MENU SECTION: OPTION A. SELECTED EXTRACT */}
                {splitMode === 'extract' && (
                  <div className="p-4 space-y-4 flex-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Extracted Pages Range</label>
                        <span className="text-[10px] text-blue-500 font-mono font-bold">1-{selectedPdf.pageCount} max</span>
                      </div>
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                        isDark ? 'bg-[#1F1F1F] border-[#3C4043]' : 'bg-[#F0F4F9] border-transparent'
                      }`}>
                        <Sliders className="w-4 h-4 text-blue-505 shrink-0" />
                        <input 
                          type="text" 
                          value={customRange}
                          onChange={e => setCustomRange(e.target.value)}
                          placeholder="e.g. 1, 3, 5-8"
                          className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold"
                        />
                      </div>
                      <p className="text-[10px] text-gray-450 leading-relaxed pt-0.5">
                        Define isolated pages or segments utilizing commas or dashes. (e.g. <span className="font-mono bg-gray-200 dark:bg-gray-800 px-1 rounded">1-3, 5, 7-10</span>)
                      </p>
                    </div>

                    {/* BULK PRESETS FOR HIGHR SPEED DENSITY SELECTING */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-widest pl-0.5">Page Selection Presets</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => applyPresetSelection('all')}
                          className={`py-1.5 border rounded-lg text-[11px] font-semibold transition-all ${
                            isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-7 py-1 text-white' : 'bg-gray-50 border-gray-250 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          All Pages
                        </button>
                        <button 
                          onClick={() => applyPresetSelection('odd')}
                          className={`py-1.5 border rounded-lg text-[11px] font-semibold transition-all ${
                            isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-7 text-white' : 'bg-gray-50 border-gray-250 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          Odd Pages ({Math.ceil(selectedPdf.pageCount / 2)})
                        </button>
                        <button 
                          onClick={() => applyPresetSelection('even')}
                          className={`py-1.5 border rounded-lg text-[11px] font-semibold transition-all ${
                            isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-7 text-white' : 'bg-gray-50 border-gray-250 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          Even Pages ({Math.floor(selectedPdf.pageCount / 2)})
                        </button>
                        <button 
                          onClick={() => applyPresetSelection('clear')}
                          className={`py-1.5 border rounded-lg text-[11px] font-semibold transition-all text-red-500 ${
                            isDark ? 'bg-gray-800 border-gray-700 hover:bg-red-950/20' : 'bg-gray-50 border-gray-250 hover:bg-red-50'
                          }`}
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    {/* OUTPUT NAME CONFIGURATION */}
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Output File Name</label>
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
                        isDark ? 'bg-[#1F1F1F] border-[#3C4043]' : 'bg-[#F0F4F9] border-transparent'
                      }`}>
                        <FileText className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                        <input 
                          type="text" 
                          value={extractedPdfName}
                          onChange={e => setExtractedPdfName(e.target.value)}
                          placeholder="Filename"
                          className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold"
                        />
                        <span className="text-[10px] text-gray-400 font-mono">.pdf</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#E8F0FE]/50 dark:bg-blue-900/15 rounded-2xl flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-505 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-relaxed text-gray-400">
                        Interactive Mode: You can click directly on the PDF page cards on the right side to toggle custom page selections!
                      </p>
                    </div>
                  </div>
                )}

                {/* SUB MENU SECTION: OPTION B. MULTIPART SPLIT */}
                {splitMode === 'parts' && (
                  <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
                    
                    {/* CHUNKS AUTO PRESET SHORTCUTS */}
                    <div className="space-y-1 shrink-0">
                      <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-widest pl-0.5">Quick Splits Generator</label>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleSmartDivide(1)}
                          className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold ${
                            isDark ? 'bg-gray-800 border-gray-750 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          Single Pages
                        </button>
                        <button 
                          onClick={() => handleSmartDivide(2)}
                          className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold ${
                            isDark ? 'bg-gray-800 border-gray-750 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          Every 2 Pages
                        </button>
                        <button 
                          onClick={() => handleSmartDivide(5)}
                          className={`flex-1 py-1.5 border rounded-lg text-[10px] font-bold ${
                            isDark ? 'bg-gray-800 border-gray-750 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-800'
                          }`}
                        >
                          Every 5 Pages
                        </button>
                      </div>
                    </div>

                    {/* PARTS INDEPENDENT LIST */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-[150px]">
                      <div className="flex items-center justify-between pb-1.5">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Document Parts List</label>
                        <button 
                          onClick={addSplitPart}
                          className="text-xs text-blue-500 hover:underline font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Part
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar pr-0.5">
                        {splitParts.map((item, index) => {
                          const matchingIndices = parsePagesRange(item.rangeInput, selectedPdf.pageCount);
                          const isInvalid = matchingIndices.length === 0;

                          return (
                            <div 
                              key={item.id}
                              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                                isDark ? 'bg-black/25 border-gray-800' : 'bg-gray-50 border-[#E8EAED] shadow-sm'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400">File Output {index + 1}</span>
                                <button 
                                  onClick={() => removeSplitPart(item.id)}
                                  className="text-[10px] text-red-500 font-semibold"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="flex gap-2">
                                {/* part Name */}
                                <div className={`flex-1 flex items-center border rounded-lg px-2 py-1 ${
                                  isDark ? 'bg-gray-900 border-transparent' : 'bg-white border-[#DCDCDC]'
                                }`}>
                                  <input 
                                    type="text" 
                                    value={item.name}
                                    onChange={e => updatePartName(item.id, e.target.value)}
                                    placeholder="Part name"
                                    className="w-full bg-transparent border-none outline-none text-[11px] font-bold"
                                  />
                                </div>
                                
                                {/* part range */}
                                <div className={`w-[85px] flex items-center border rounded-lg px-2 py-1 ${
                                  isInvalid 
                                    ? 'bg-red-500/10 border-red-500' 
                                    : isDark ? 'bg-gray-900 border-transparent' : 'bg-white border-[#DCDCDC]'
                                }`}>
                                  <input 
                                    type="text" 
                                    value={item.rangeInput}
                                    onChange={e => updatePartRange(item.id, e.target.value)}
                                    placeholder="Range"
                                    className="w-full bg-transparent border-none outline-none text-center text-[10px] font-mono font-bold"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-gray-400">Pages matched</span>
                                <span className={`text-[9px] font-bold font-mono ${
                                  isInvalid ? 'text-red-550' : 'text-blue-500'
                                }`}>
                                  {isInvalid ? 'Empty Range' : `${matchingIndices.length} pages: [${matchingIndices.join(',')}]`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}

                {/* BOTTOM ACTION CTA SECTION */}
                <div className={`p-4 border-t ${
                  isDark ? 'bg-[#212121] border-[#3C4043]' : 'bg-gray-50 border-[#E8EAED]'
                }`}>
                  <button
                    onClick={handleExecuteSplit}
                    disabled={activePages.size === 0}
                    className={`w-full py-3 rounded-full text-sm font-semibold tracking-wide shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activePages.size === 0
                        ? 'bg-gray-400 opacity-40 cursor-not-allowed text-white shadow-none'
                        : 'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-[0_4px_10px_rgba(26,115,232,0.3)]'
                    }`}
                  >
                    <Split className="w-4 h-4" /> Execute PDF Split ({activePages.size} targeted)
                  </button>
                </div>

              </div>

              {/* RIGHT COLUMN: INTERACTIVE ORIGINAL PDF THUMBNAILS CONTAINER */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-100 dark:bg-[#121212] flex flex-col">
                <div className="flex justify-between items-center pb-3">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">
                    Original Pages Directory ({selectedPdf.pageCount})
                  </h3>
                  <p className="text-[11px] text-gray-400 hidden sm:block">Click any page card to toggle extraction</p>
                </div>

                <div className="flex-1">
                  <Document
                    file={selectedPdf.buffer}
                    loading={<div className="flex justify-center p-12 text-xs font-mono text-gray-500 animate-pulse">Scanning documents structure...</div>}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  >
                    {Array.from(new Array(selectedPdf.pageCount), (_, index) => {
                      const pageNum = index + 1;
                      const isActive = activePages.has(pageNum);

                      return (
                        <div 
                          key={`original_page_${pageNum}`}
                          onClick={() => handlePageClick(pageNum)}
                          className={`relative border-2 rounded-2xl overflow-hidden p-1.5 transition-all cursor-pointer bg-white dark:bg-[#1E1E1E] flex flex-col justify-between select-none ${
                            isActive 
                              ? 'border-blue-500 ring-2 ring-blue-500/20 shadow' 
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
                          }`}
                        >
                          {/* Checked Icon */}
                          <div className="absolute top-2 right-2 z-10">
                            {isActive ? (
                              <div className="bg-[#1A73E8] text-white p-1 rounded-full shadow">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="bg-black/35 backdrop-blur p-1 rounded-full text-white border border-white/20">
                                <span className="w-3.5 h-3.5 block" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 flex items-center justify-center py-2 bg-gray-50 dark:bg-black/10 rounded-xl overflow-hidden">
                            <Page 
                              pageNumber={pageNum} 
                              scale={0.25} 
                              renderTextLayer={false} 
                              renderAnnotationLayer={false}
                            />
                          </div>
                          
                          <div className={`mt-2 py-1 text-center font-mono text-[10px] font-extrabold rounded-lg ${
                            isActive 
                              ? 'bg-blue-50 dark:bg-blue-900/25 text-[#1967D2] dark:text-blue-300' 
                              : 'text-gray-400'
                          }`}>
                            PAGE {pageNum}
                          </div>
                        </div>
                      );
                    })}
                  </Document>
                </div>
              </div>

            </div>
          )}

          {/* STAGE 3: SPLIT SUCCEEDED & RENDER PRODUCTS */}
          {generatedParts.length > 0 && (
            <div className={`flex-1 flex flex-col md:flex-row overflow-hidden ${
              isDark ? 'bg-[#18181A]' : 'bg-[#F2F4F7]'
            }`}>
              
              {/* LEFT SIDE: SPLIT FILES LIST & BUTTONS */}
              <div className={`w-full md:w-[320px] shrink-0 border-r flex flex-col overflow-y-auto ${
                isDark ? 'border-gray-800 bg-[#212124]' : 'bg-white border-[#DCDCDC] shadow'
              }`}>
                
                <div className="p-4 border-b shrink-0 bg-[#E8F0FE] dark:bg-blue-950/20 text-[#1967D2] dark:text-blue-300 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase">Done</span>
                    <h3 className="text-xs font-bold mt-0.5">Split successfully complete!</h3>
                    <p className="text-[10px] text-gray-500 leading-none mt-1">Generated {generatedParts.length} files</p>
                  </div>
                  <button 
                    onClick={() => {
                      setGeneratedParts([]);
                      setActivePreviewId(null);
                    }}
                    className="text-xs underline hover:no-underline font-extrabold shrink-0"
                  >
                    Start Over
                  </button>
                </div>

                {/* ZIP ACTION FOR MULTIPLE PRODUCTS */}
                {generatedParts.length > 1 && (
                  <div className="p-3 border-b shrink-0 flex flex-col gap-2 bg-[#E1F5FE]/30 dark:bg-[#0288d1]/5">
                    <p className="text-[10px] text-gray-400">Save all compiled documents together as a single ZIP archive instantly.</p>
                    <button
                      onClick={handleDownloadAllAsZip}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition-all shadow active:scale-95 flex items-center justify-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" /> Download All as ZIP
                    </button>
                  </div>
                )}

                {/* FILE LIST ELEMENTS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-0.5">Generated Parts</label>
                  
                  {generatedParts.map((item, index) => {
                    const isSelected = activePreviewId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActivePreviewId(item.id);
                          setPreviewCurrentPage(1);
                        }}
                        className={`p-3 rounded-2xl flex items-center gap-3 cursor-pointer border transition-all ${
                          isSelected 
                            ? 'bg-[#1A73E8]/10 border-[#1A73E8]/40 shadow' 
                            : isDark ? 'bg-gray-800/25 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 shadow-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected 
                            ? 'bg-[#1A73E8] text-white' 
                            : 'bg-red-100 dark:bg-red-950/20 text-red-500'
                        }`}>
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="text-xs font-bold truncate leading-tight" title={item.name}>
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-gray-400 leading-none mt-1 font-mono">
                            {item.pageCount} pages • {formatBytes(item.size)}
                          </p>
                        </div>
                        
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isSelected ? 'text-[#1A73E8] translate-x-1' : 'text-gray-400 opacity-60'
                        }`} />
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* RIGHT SIDE: FILE PREVIEWER IF FILE IS SELECTED */}
              {activePreviewPart ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* PREVIEW CONTAINER HEADER */}
                  <div className={`p-3 px-4 flex items-center justify-between border-b shrink-0 ${
                    isDark ? 'bg-[#2D2E30] border-gray-800' : 'bg-white border-[#E8EAED]'
                  }`}>
                    <div className="truncate min-w-0 pr-4">
                      <span className="text-[9px] font-mono leading-none text-gray-400">Previewer: Active Document Part</span>
                      <h4 className="text-xs font-bold leading-none truncate mt-1" title={activePreviewPart.name}>
                        {activePreviewPart.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSharePart(activePreviewPart)}
                        className={`p-2 rounded-full cursor-pointer transition-all active:scale-95 ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadPart(activePreviewPart)}
                        className="flex items-center gap-1 bg-[#1A73E8] hover:bg-[#1557B0] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm active:scale-95 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  </div>

                  {/* REACT PDF VIEWPORT AREA */}
                  <div className="flex-1 flex overflow-hidden">
                    <div 
                      className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar bg-gray-250 dark:bg-[#121212]"
                      ref={previewScrollRef}
                      onScroll={handleScrollPreview}
                    >
                      <div className="flex items-center justify-center mb-3 sticky top-0 bg-transparent z-20 pointer-events-none">
                        <div className="flex items-center gap-3 p-1 rounded-full bg-black/65 backdrop-blur-sm pointer-events-auto text-white text-[10px] font-bold px-3">
                          <button 
                            onClick={() => setZoom(z => Math.max(0.6, z - 0.2))} 
                            className="p-1 hover:bg-white/10 active:scale-95 rounded"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span>{Math.round(zoom * 100)}%</span>
                          <button 
                            onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
                            className="p-1 hover:bg-white/10 active:scale-95 rounded"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <span className="opacity-40">|</span>
                          <span>{previewCurrentPage} / {previewPages || '--'}</span>
                        </div>
                      </div>

                      <Document
                        file={activePreviewPart.url}
                        onLoadSuccess={({ numPages }) => setPreviewPages(numPages)}
                        loading={<div className="flex justify-center p-12 text-xs font-mono text-gray-500 animate-pulse">Rendering merged layout preview...</div>}
                        className="flex flex-col items-center gap-4"
                      >
                        {previewPages && Array.from(new Array(previewPages), (_, i) => (
                          <div key={`pages_out_${i + 1}`} className="shadow border dark:border-gray-800 bg-white relative">
                            <Page 
                              pageNumber={i + 1} 
                              scale={zoom}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />
                            <div className="absolute top-2 left-2 bg-black/40 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
                              Page {i + 1}
                            </div>
                          </div>
                        ))}
                      </Document>

                    </div>

                    {/* SATELLITE THUMBNAIL TRACKER */}
                    {previewPages && (
                      <div className="w-32 border-l shrink-0 bg-white dark:bg-[#1E1E1E] dark:border-gray-800 overflow-y-auto p-3 no-scrollbar hidden pr-2 lg:block">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3">Pages</h4>
                        <Document file={activePreviewPart.url} className="flex flex-col gap-3 items-center">
                          {Array.from(new Array(previewPages), (_, index) => (
                            <div 
                              key={`thumb_out_node_${index + 1}`} 
                              onClick={() => scrollToPreviewPage(index + 1)}
                              className={`cursor-pointer border-2 p-0.5 rounded transition-all w-full flex flex-col justify-center items-center ${
                                previewCurrentPage === index + 1 
                                  ? 'border-blue-500 shadow ring-2 ring-blue-500/10' 
                                  : 'border-transparent hover:border-gray-350 dark:hover:border-gray-700'
                              }`}
                            >
                              <Page 
                                pageNumber={index + 1} 
                                scale={0.14} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                              />
                              <span className="text-[9px] font-mono text-gray-450 mt-1 font-bold">Page {index + 1}</span>
                            </div>
                          ))}
                        </Document>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-400">
                  <Layers className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-xs">No split part selected to preview.</p>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* OVERLAY: OFFLINE WORKSPACE PDF SELECTION DRAWER */}
      {showWorkspacePicker && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center sm:justify-center p-4">
          <div className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl border flex flex-col max-h-[85vh] animate-slide-up ${
            isDark ? 'bg-[#2D2E30] border-gray-800 text-white' : 'bg-white border-[#E8EAED] text-gray-950 shadow-2xl'
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
                return (
                  <div
                    key={wp.id}
                    onClick={() => handleAddWorkspaceFile(wp)}
                    className={`p-3 rounded-2xl flex items-center justify-between cursor-pointer border transition-all ${
                      isDark ? 'bg-gray-800/40 border-gray-800 hover:bg-gray-800' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div className="truncate">
                        <p className="text-xs font-bold truncate leading-tight">{wp.name}</p>
                        <p className="text-[9px] text-gray-405 font-mono leading-none mt-1">
                          {formatBytes(wp.size)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <button className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-500 text-[10px] font-bold rounded-full hover:bg-blue-100 transition-all">
                        SELECT
                      </button>
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

export default SplitPdf;
