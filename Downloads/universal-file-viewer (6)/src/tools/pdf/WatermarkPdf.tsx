import React, { useState, useEffect, useRef, useTransition } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
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
  Stamp, 
  Plus, 
  Check, 
  RefreshCw, 
  Info,
  X,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  Sliders,
  Type,
  Image as ImageIcon,
  AlignCenter,
  AlignLeft,
  Settings,
  Eye,
  RotateCw,
  EyeOff
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

interface WatermarkPdfProps {
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

function hexToRgba(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  return { 
    r: isNaN(r) ? 0 : r, 
    g: isNaN(g) ? 0 : g, 
    b: isNaN(b) ? 0 : b 
  };
}

export const WatermarkPdf: React.FC<WatermarkPdfProps> = ({
  onClose,
  onAddFile,
  isDark: propIsDark,
  files = [],
  file
}) => {
  const [selectedPdf, setSelectedPdf] = useState<SelectedPdf | null>(null);
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  // Watermark Mode Configuration
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');

  // Text options
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [textOpacity, setTextOpacity] = useState(0.3);
  const [textRotation, setTextRotation] = useState(-30);
  const [textColor, setTextColor] = useState('#EF4444');

  // Image options
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBuffer, setImageBuffer] = useState<ArrayBuffer | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [imageOpacity, setImageOpacity] = useState(0.4);
  const [imageScale, setImageScale] = useState(150); // width in points

  // Positioning
  const [positionType, setPositionType] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom'>('center');
  const [customX, setCustomX] = useState(100);
  const [customY, setCustomY] = useState(100);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const [verticalOffset, setVerticalOffset] = useState(0);

  // Targets
  const [pageSelectionMode, setPageSelectionMode] = useState<'all' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState('1');

  // Preview generated URL
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfBuffer, setPreviewPdfBuffer] = useState<ArrayBuffer | null>(null);
  const [isPreviewCompiling, setIsPreviewCompiling] = useState(false);

  // Shared status & states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false);

  const [previewPageCount, setPreviewPageCount] = useState<number | null>(null);
  const [previewCurrentPage, setPreviewCurrentPage] = useState(1);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync System Theme
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
      handleLoadWorkspaceFile(file);
    }
  }, [file]);

  // Cleanup Urls
  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  // Keep Preview Updated (Debounced compilation of page 1 + page 2)
  useEffect(() => {
    if (!selectedPdf) {
      setPreviewPdfUrl(null);
      setPreviewPdfBuffer(null);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      generateWatermarkPreview();
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [
    selectedPdf,
    watermarkType,
    watermarkText,
    fontSize,
    textOpacity,
    textRotation,
    textColor,
    imageBuffer,
    imageMimeType,
    imageOpacity,
    imageScale,
    positionType,
    customX,
    customY,
    horizontalOffset,
    verticalOffset,
    pageSelectionMode,
    customPageRange
  ]);

  // Core Watermarking Function for dynamic preview and final generation
  const applyWatermarkToDocument = async (sourceBuffer: ArrayBuffer, onlyFirstTwoPages: boolean = false): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    // Resolve target page indices (0-based)
    let targetPagesIndices: number[] = [];
    if (pageSelectionMode === 'all') {
      targetPagesIndices = Array.from({ length: totalPages }, (_, i) => i);
    } else {
      const parsed = parsePagesRange(customPageRange, totalPages);
      targetPagesIndices = parsed.map(p => p - 1);
    }

    // Limit pages generated if compiling preview to maintain ultra speed
    if (onlyFirstTwoPages) {
      targetPagesIndices = targetPagesIndices.filter(p => p < 2);
    }

    // Embed fonts and image once for efficiency
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let embeddedImage: any = null;
    let imgRatio = 1;
    if (watermarkType === 'image' && imageBuffer) {
      try {
        if (imageMimeType === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBuffer);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBuffer);
        }
        imgRatio = embeddedImage.height / embeddedImage.width;
      } catch (err) {
        console.error('Image embedding failure', err);
      }
    }

    const { r, g, b } = hexToRgba(textColor);

    for (const pageIdx of targetPagesIndices) {
      if (pageIdx < 0 || pageIdx >= totalPages) continue;
      const page = pages[pageIdx];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      if (watermarkType === 'text' && watermarkText) {
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
        const textHeight = fontSize;

        let x = 0;
        let y = 0;

        // Position coordinates mapping
        if (positionType === 'center') {
          x = (pageWidth - textWidth) / 2 + horizontalOffset;
          y = (pageHeight - textHeight) / 2 + verticalOffset;
        } else if (positionType === 'top-left') {
          x = 24 + horizontalOffset;
          y = pageHeight - textHeight - 24 + verticalOffset;
        } else if (positionType === 'top-right') {
          x = pageWidth - textWidth - 24 + horizontalOffset;
          y = pageHeight - textHeight - 24 + verticalOffset;
        } else if (positionType === 'bottom-left') {
          x = 24 + horizontalOffset;
          y = 24 + verticalOffset;
        } else if (positionType === 'bottom-right') {
          x = pageWidth - textWidth - 24 + horizontalOffset;
          y = 24 + verticalOffset;
        } else {
          x = customX;
          y = customY;
        }

        page.drawText(watermarkText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(r, g, b),
          opacity: textOpacity,
          rotate: degrees(textRotation)
        });
      } else if (watermarkType === 'image' && embeddedImage) {
        const imgWidth = imageScale;
        const imgHeight = imgWidth * imgRatio;

        let x = 0;
        let y = 0;

        // Position coordinates mapping
        if (positionType === 'center') {
          x = (pageWidth - imgWidth) / 2 + horizontalOffset;
          y = (pageHeight - imgHeight) / 2 + verticalOffset;
        } else if (positionType === 'top-left') {
          x = 24 + horizontalOffset;
          y = pageHeight - imgHeight - 24 + verticalOffset;
        } else if (positionType === 'top-right') {
          x = pageWidth - imgWidth - 24 + horizontalOffset;
          y = pageHeight - imgHeight - 24 + verticalOffset;
        } else if (positionType === 'bottom-left') {
          x = 24 + horizontalOffset;
          y = 24 + verticalOffset;
        } else if (positionType === 'bottom-right') {
          x = pageWidth - imgWidth - 24 + horizontalOffset;
          y = 24 + verticalOffset;
        } else {
          x = customX;
          y = customY;
        }

        page.drawImage(embeddedImage, {
          x,
          y,
          width: imgWidth,
          height: imgHeight,
          opacity: imageOpacity
        });
      }
    }

    return await pdfDoc.save();
  };

  // Perform debounced background First Play preview compilation
  const generateWatermarkPreview = async () => {
    if (!selectedPdf) return;
    setIsPreviewCompiling(true);

    try {
      // compile only the first 2 pages of target configurations
      const previewBytes = await applyWatermarkToDocument(selectedPdf.buffer, true);
      const blob = new Blob([previewBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }

      setPreviewPdfUrl(url);
      setPreviewPdfBuffer(previewBytes.buffer);
    } catch (err) {
      console.error('Error generating live watermark preview', err);
    } finally {
      setIsPreviewCompiling(false);
    }
  };

  // Local PDF selection
  const handleLocalFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      NotificationManager.error('Unsupported file format. Please upload a standard PDF.');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();

      setSelectedPdf({
        name: file.name,
        size: file.size,
        pageCount: count,
        buffer
      });

      NotificationManager.success(`Successfully loaded draft with ${count} pages.`);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Could not parse target document structure.');
    } finally {
      e.target.value = '';
    }
  };

  // Workspace integration selection
  const handleLoadWorkspaceFile = async (wFile: WorkspaceFile) => {
    try {
      let buffer: ArrayBuffer;
      if (wFile.blob) {
        buffer = await wFile.blob.arrayBuffer();
      } else if (wFile.uri) {
        const res = await fetch(wFile.uri);
        buffer = await res.arrayBuffer();
      } else {
        throw new Error('Paths access corrupted');
      }

      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();

      setSelectedPdf({
        name: wFile.name,
        size: wFile.size,
        pageCount: count,
        buffer
      });

      setShowWorkspacePicker(false);
      NotificationManager.success(`Imported manual "${wFile.name}" from workspace list.`);
    } catch (err) {
      console.error(err);
      NotificationManager.error('Error reading index file.');
    }
  };

  // Image upload handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg)$/i)) {
      NotificationManager.error('Watermark support requires PNG or JPG/JPEG formats.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageBuffer(reader.result as ArrayBuffer);
      setImageMimeType(file.type);
      setImageFile(file);
      NotificationManager.success(`Embedded image watermark source "${file.name}"!`);
    };
    reader.onerror = () => {
      NotificationManager.error('Failed reading target image file.');
    };
    reader.readAsArrayBuffer(file);
  };

  // Final Action applying to ALL targeted elements
  const handleFinalCompilationAndSave = async () => {
    if (!selectedPdf) return;

    setIsProcessing(true);
    setProcessingStatus('Embedding watermark parameters securely offline...');

    try {
      const finalBytes = await applyWatermarkToDocument(selectedPdf.buffer, false);
      const finalBlob = new Blob([finalBytes], { type: 'application/pdf' });
      const outputName = `${selectedPdf.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;

      // Copy back to Workspace listing
      const storedAllFiles = localStorage.getItem('filemanager_all_files');
      const workspaceFiles: any[] = storedAllFiles ? JSON.parse(storedAllFiles) : [];
      
      const fileId = 'pdf-watermark-item-' + Math.random().toString(36).substring(2, 11);
      const newFileEntry = {
        id: fileId,
        name: outputName,
        path: '/' + outputName,
        category: 'pdf',
        size: finalBlob.size,
        mimeType: 'application/pdf',
        blob: finalBlob,
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
        isFavorite: false
      };

      const updatedWorkspace = [newFileEntry, ...workspaceFiles];
      localStorage.setItem('filemanager_all_files', JSON.stringify(updatedWorkspace));

      const storedDownloads = localStorage.getItem('filemanager_downloaded_ids');
      const downloadedIds: string[] = storedDownloads ? JSON.parse(storedDownloads) : [];
      const updatedDownloads = [fileId, ...downloadedIds];
      localStorage.setItem('filemanager_downloaded_ids', JSON.stringify(updatedDownloads));

      if (onAddFile) {
        onAddFile(newFileEntry);
      }

      // Download payload trigger
      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(finalBlob);
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          const cleanBase64 = rawBase64.split(',')[1];
          await Filesystem.writeFile({
            path: outputName,
            data: cleanBase64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success(`Successfully saved "${outputName}" to mobile Downloads!`);
        };
      } else {
        const downloadUrl = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = outputName;
        a.click();
        URL.revokeObjectURL(downloadUrl);
      }

      ToolNotifications.notifyPdfWatermarked(selectedPdf.name);
      NotificationManager.success(`Successfully added watermarked PDF to assets workspace!`);

      // Reset
      setSelectedPdf(null);
    } catch (err: any) {
      console.error(err);
      NotificationManager.error('Watermark application sequence failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareResult = async () => {
    if (!previewPdfBuffer || !selectedPdf) return;

    const outputName = `${selectedPdf.name.replace(/\.pdf$/i, '')}_watermarked.pdf`;
    const finalBlob = new Blob([previewPdfBuffer], { type: 'application/pdf' });

    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(finalBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const cacheFile = await Filesystem.writeFile({
            path: outputName,
            data: base64,
            directory: Directory.Cache
          });
          await Share.share({
            title: outputName,
            url: cacheFile.uri
          });
        };
      } catch (err) {
        console.error('Sharing failed', err);
      }
    } else if (navigator.share && File) {
      try {
        const fileObj = new File([finalBlob], outputName, { type: 'application/pdf' });
        await navigator.share({
          title: outputName,
          files: [fileObj]
        });
      } catch (e) {
        console.log('Share aborted', e);
      }
    } else {
      NotificationManager.info('Web Sharing is unsupported. Saved to custom Workspace successfully.');
    }
  };

  // Sync scroll paging
  const handleScrollPreview = () => {
    if (!previewScrollRef.current || !previewPageCount) return;
    const { scrollTop, scrollHeight, clientHeight } = previewScrollRef.current;
    
    const pageRatio = scrollTop / (scrollHeight - clientHeight);
    const calculatedPage = Math.min(
      Math.max(1, Math.round(pageRatio * previewPageCount) + 1),
      previewPageCount
    );
    setPreviewCurrentPage(calculatedPage);
  };

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
          <h1 className="text-[18px] font-medium tracking-tight" style={{fontFamily: "'Google Sans', 'Inter', sans-serif"}}>PDF Watermark</h1>
          <p className="text-xs text-gray-500 font-normal">Superimpose elegant texts or logo watermarks on your corporate documents</p>
        </div>
      </header>

      {/* LOADER SPLIT ANIMATION */}
      {isProcessing && (
        <div className={`p-8 flex flex-col items-center justify-center space-y-4 flex-1 ${isDark ? 'bg-black/90' : 'bg-white/95'}`}>
          <div className="relative flex items-center justify-center">
            <RefreshCw className="w-12 h-12 text-[#1A73E8] animate-spin" />
          </div>
          <h3 className="font-bold text-sm tracking-wide uppercase">{processingStatus}</h3>
          <p className="text-xs text-gray-500 max-w-xs text-center font-normal">Processing vector layers, anchoring transparency, and packing compilation files safely offline...</p>
        </div>
      )}

      {/* DETAILED CONTENT SEGMENT */}
      {!isProcessing && (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* STAGE 1: NO TARGET FILE */}
          {!selectedPdf && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-5">
              <div className="bg-blue-50 dark:bg-blue-950/45 p-6 rounded-full text-[#1A73E8]">
                <Stamp className="w-11 h-11" />
              </div>
              <div>
                <h2 className="text-[20px] font-medium leading-normal">Choose target PDF template</h2>
                <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
                  Design beautiful textual markings ("CONFIDENTIAL", "DRAFT") or load isolated branding logos. Works entirely offline ensuring absolute confidentiality.
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

          {/* STAGE 2: CONFIGURING OPTIONS */}
          {selectedPdf && (
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              
              {/* LEFT SIDE PANEL: SETTINGS CONTROLS */}
              <div className={`w-full lg:w-[380px] shrink-0 border-r flex flex-col overflow-y-auto no-scrollbar ${
                isDark ? 'border-[#3C4043] bg-[#2D2E30]/50' : 'bg-white border-[#E8EAED] shadow-sm'
              }`}>
                
                {/* DOCUMENT TOP STRIP INFO */}
                <div className="p-4 border-b shrink-0 flex items-center justify-between">
                  <div className="truncate pr-4">
                    <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Target Doc</span>
                    <h3 className="text-xs font-bold truncate mt-0.5" title={selectedPdf.name}>{selectedPdf.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedPdf.pageCount} pages • {formatBytes(selectedPdf.size)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPdf(null)}
                    className={`p-1.5 rounded-full border text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 border-transparent`}
                    title="Change selected document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* SELECT MODE: TEXT VS IMAGE */}
                <div className="p-4 border-b shrink-0 flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest pl-0.5">Watermark Style</label>
                  <div className={`flex rounded-xl p-1 bg-opacity-30 ${isDark ? 'bg-black/30' : 'bg-gray-100'}`}>
                    <button
                      onClick={() => setWatermarkType('text')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        watermarkType === 'text' 
                          ? isDark ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <Type className="w-3.5 h-3.5" /> Text Watermark
                    </button>
                    <button
                      onClick={() => setWatermarkType('image')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        watermarkType === 'image'
                          ? isDark ? 'bg-gray-800 text-white shadow' : 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Image Logo
                    </button>
                  </div>
                </div>

                {/* DETAILED OPTIONS ACCORDING TO THE STYLE */}
                <div className="p-4 space-y-4 flex-1">
                  
                  {/* STYLE A: TEXT CONFIGURATIONS */}
                  {watermarkType === 'text' && (
                    <div className="space-y-4">
                      
                      {/* TEXT VALUE INPUT */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider pl-0.5">Watermark Text</label>
                        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border ${
                          isDark ? 'bg-[#1F1F1F] border-[#3C4043]' : 'bg-[#F0F4F9] border-transparent'
                        }`}>
                          <Type className="w-4 h-4 text-gray-400 shrink-0" />
                          <input 
                            type="text" 
                            value={watermarkText}
                            onChange={e => setWatermarkText(e.target.value)}
                            placeholder="e.g. COPYRIGHTED"
                            className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold"
                          />
                        </div>
                      </div>

                      {/* TEXT SPECIFICS DENSITY CHIPS */}
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => setWatermarkText('CONFIDENTIAL')}
                          className="px-2 py-1 text-[9px] font-mono border rounded-lg bg-gray-500/5 hover:bg-gray-500/10 font-bold text-center"
                        >
                          CONFIDENTIAL
                        </button>
                        <button 
                          onClick={() => setWatermarkText('DO NOT COPY')}
                          className="px-2 py-1 text-[9px] font-mono border rounded-lg bg-gray-500/5 hover:bg-gray-500/10 font-bold text-center"
                        >
                          DO NOT COPY
                        </button>
                        <button 
                          onClick={() => setWatermarkText('DRAFT')}
                          className="px-2 py-1 text-[9px] font-mono border rounded-lg bg-gray-500/5 hover:bg-gray-500/10 font-bold text-center"
                        >
                          DRAFT
                        </button>
                        <button 
                          onClick={() => setWatermarkText('APPROVED')}
                          className="px-2 py-1 text-[9px] font-mono border rounded-lg bg-gray-500/5 hover:bg-gray-500/10 font-bold text-center"
                        >
                          APPROVED
                        </button>
                      </div>

                      {/* SLIDERS SECTION: SIZE, ROTATION, OPACITY */}
                      <div className="space-y-3 pt-2">
                        
                        {/* COLOR SELECT */}
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider pl-0.5">Text Color</label>
                          <div className="flex items-center gap-1.5">
                            <input 
                              type="color" 
                              value={textColor}
                              onChange={e => setTextColor(e.target.value)}
                              className="w-[24px] h-[24px] border-0 rounded cursor-pointer p-0 bg-transparent"
                            />
                            <span className="text-[10px] font-mono font-bold text-gray-400">{textColor.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* FONT SIZE SLIDER */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span>FONT SIZE</span>
                            <span className="font-mono">{fontSize} pt</span>
                          </div>
                          <input 
                            type="range" 
                            min="12" 
                            max="120"
                            step="2"
                            value={fontSize}
                            onChange={e => setFontSize(parseInt(e.target.value, 10))}
                            className="w-full accent-[#1A73E8]"
                          />
                        </div>

                        {/* ROTATION SLIDER */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span>ROTATION DEGREES</span>
                            <span className="font-mono">{textRotation}°</span>
                          </div>
                          <input 
                            type="range" 
                            min="-180" 
                            max="180"
                            step="5"
                            value={textRotation}
                            onChange={e => setTextRotation(parseInt(e.target.value, 10))}
                            className="w-full accent-[#1A73E8]"
                          />
                        </div>

                        {/* OPACITY SLIDER */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                            <span>OPACITY</span>
                            <span className="font-mono">{Math.round(textOpacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.05" 
                            max="1.0"
                            step="0.05"
                            value={textOpacity}
                            onChange={e => setTextOpacity(parseFloat(e.target.value))}
                            className="w-full accent-[#1A73E8]"
                          />
                        </div>

                      </div>

                    </div>
                  )}

                  {/* STYLE B: IMAGE LOGO CONFIGURATIONS */}
                  {watermarkType === 'image' && (
                    <div className="space-y-4">
                      
                      {/* FILE INPUT OR IMAGE HIGHLIGHT */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider pl-0.5">Upload Logo Image (PNG/JPG)</label>
                        
                        {!imageFile ? (
                          <label className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer flex flex-col items-center justify-center space-y-1.5 transition-all ${
                            isDark ? 'border-gray-700 hover:bg-white/5' : 'border-gray-250 hover:bg-gray-50'
                          }`}>
                            <ImageIcon className="w-6 h-6 text-blue-500" />
                            <span className="text-[11px] font-bold">Pick Image File</span>
                            <span className="text-[9px] text-gray-400">Allows transparency in transparent PNG files</span>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/jpg"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                            isDark ? 'bg-black/20 border-gray-800' : 'bg-gray-50 border-[#DCDCDC]'
                          }`}>
                            <div className="flex items-center gap-2 truncate">
                              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              <div className="truncate pr-2">
                                <p className="text-xs font-bold truncate">{imageFile.name}</p>
                                <p className="text-[9px] text-gray-400 font-mono">{formatBytes(imageFile.size)}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                setImageFile(null);
                                setImageBuffer(null);
                              }}
                              className="p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* SLIDERS FOR RESIZING & OPACITY */}
                      {imageBuffer && (
                        <div className="space-y-3 pt-2">
                          
                          {/* WIDTH DEGREES SCALE */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                              <span>IMAGE WIDTH</span>
                              <span className="font-mono">{imageScale} pt</span>
                            </div>
                            <input 
                              type="range" 
                              min="30" 
                              max="450"
                              step="5"
                              value={imageScale}
                              onChange={e => setImageScale(parseInt(e.target.value, 10))}
                              className="w-full accent-[#1A73E8]"
                            />
                          </div>

                          {/* OPACITY SLIDER */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                              <span>OPACITY</span>
                              <span className="font-mono">{Math.round(imageOpacity * 100)}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.05" 
                              max="1.0"
                              step="0.05"
                              value={imageOpacity}
                              onChange={e => setImageOpacity(parseFloat(e.target.value))}
                              className="w-full accent-[#1A73E8]"
                            />
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* COMMON ELEMENT: POSITION MODE SELECT */}
                  <div className="space-y-2 pt-2 border-t border-[#DCDCDC] dark:border-gray-800">
                    <label className="text-[10px] font-extrabold text-gray-450 uppercase tracking-wider pl-0.5">Anchoring Position</label>
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { label: 'Center', val: 'center' },
                        { label: 'Top Left', val: 'top-left' },
                        { label: 'Top Right', val: 'top-right' },
                        { label: 'Bottom L', val: 'bottom-left' },
                        { label: 'Bottom R', val: 'bottom-right' },
                        { label: 'Custom', val: 'custom' },
                      ].map(item => (
                        <button
                          key={item.val}
                          onClick={() => setPositionType(item.val as any)}
                          className={`py-1.5 border rounded-lg text-[10px] font-bold truncate transition-all ${
                            positionType === item.val
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : isDark ? 'bg-gray-800 border-gray-750 text-gray-300 hover:bg-gray-700' : 'bg-gray-50 border-gray-250 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* OFFSET SLIDERS OR CUSTOM XY CONTROLS */}
                    {positionType !== 'custom' ? (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 block uppercase">Offset X ({horizontalOffset} pt)</span>
                          <input 
                            type="range"
                            min="-250"
                            max="250"
                            step="5"
                            value={horizontalOffset}
                            onChange={e => setHorizontalOffset(parseInt(e.target.value, 10))}
                            className="w-full accent-[#1A73E8]"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-gray-400 block uppercase">Offset Y ({verticalOffset} pt)</span>
                          <input 
                            type="range"
                            min="-250"
                            max="250"
                            step="5"
                            value={verticalOffset}
                            onChange={e => setVerticalOffset(parseInt(e.target.value, 10))}
                            className="w-full accent-[#1A73E8]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-450 block">X Point</span>
                          <input 
                            type="number"
                            value={customX}
                            onChange={e => setCustomX(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className={`w-full text-xs font-mono font-bold px-2 py-1.5 border rounded-lg ${
                              isDark ? 'bg-gray-900 border-gray-850' : 'bg-white border-gray-250'
                            }`}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-450 block">Y Point</span>
                          <input 
                            type="number"
                            value={customY}
                            onChange={e => setCustomY(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className={`w-full text-xs font-mono font-bold px-2 py-1.5 border rounded-lg ${
                              isDark ? 'bg-gray-900 border-gray-850' : 'bg-white border-gray-250'
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* COMMON ELEMENT: PAGE RANGE CONTROLS */}
                  <div className="space-y-2 pt-2 border-t border-[#DCDCDC] dark:border-gray-800">
                    <label className="text-[10px] font-extrabold text-gray-455 uppercase tracking-wider pl-0.5">Applied Pages Range</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPageSelectionMode('all')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          pageSelectionMode === 'all'
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : isDark ? 'bg-gray-800 border-gray-750 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        All Pages ({selectedPdf.pageCount})
                      </button>
                      <button
                        onClick={() => setPageSelectionMode('custom')}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          pageSelectionMode === 'custom'
                            ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                            : isDark ? 'bg-gray-800 border-gray-750 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        Selected Pages
                      </button>
                    </div>

                    {pageSelectionMode === 'custom' && (
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 border ${
                          isDark ? 'bg-[#1F1F1F] border-[#3C4043]' : 'bg-[#F0F4F9] border-transparent'
                        }`}>
                          <Sliders className="w-3.5 h-3.5 text-gray-400" />
                          <input 
                            type="text" 
                            value={customPageRange}
                            onChange={e => setCustomPageRange(e.target.value)}
                            placeholder="e.g. 1, 3, 5-8"
                            className="flex-1 bg-transparent border-none outline-none text-xs placeholder-gray-500 font-bold"
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 pl-0.5">Separate with commas or dashes (e.g., 1-2, 4).</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* ACTION TRIGGER BUTTON */}
                <div className={`p-4 border-t shrink-0 ${
                  isDark ? 'bg-[#212121] border-[#3C4043]' : 'bg-gray-50 border-[#E8EAED]'
                }`}>
                  <button
                    onClick={handleFinalCompilationAndSave}
                    disabled={watermarkType === 'image' && !imageBuffer}
                    className={`w-full py-3 rounded-full text-sm font-semibold tracking-wide shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                      watermarkType === 'image' && !imageBuffer
                        ? 'bg-gray-400 opacity-40 text-white cursor-not-allowed shadow-none'
                        : 'bg-[#1A73E8] hover:bg-[#1557B0] text-white shadow-[0_4px_10px_rgba(26,115,232,0.3)]'
                    }`}
                  >
                    <Stamp className="w-4 h-4" /> Apply & Save PDF
                  </button>
                </div>

              </div>

              {/* RIGHT SIDE PREVIEW BOX: HIGH-FIDELITY PDF PREVIEW FOR LIVE SENSE */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-gray-150 dark:bg-[#121212] relative">
                
                {/* FLOATING OPTIONS HEADER CONTROLS */}
                <div className="flex items-center justify-between pb-3 shrink-0 z-10">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-450" />
                    <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                      Live Preview Stage
                    </h3>
                  </div>
                  {previewPdfUrl && (
                    <button
                      onClick={handleShareResult}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                        isDark ? 'bg-white/5 border-gray-700 text-white hover:bg-white/10' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Draft
                    </button>
                  )}
                </div>

                {/* LOAD OR DRAFT WRAPPER CONTAINER */}
                <div className="flex-1 flex items-center justify-center relative min-h-[300px]">
                  
                  {/* LIVE SPINNER ON BACKGROUND RENDERING */}
                  {isPreviewCompiling && (
                    <div className="absolute top-4 right-4 z-20 bg-black/60 text-white px-3 py-1.5 rounded-full flex items-center gap-2 font-mono text-[10px]">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                      Updating Live Draft...
                    </div>
                  )}

                  {!previewPdfUrl ? (
                    <div className="text-center p-8 text-gray-400 space-y-2">
                      <EyeOff className="w-8 h-8 mx-auto" />
                      <p className="text-xs">Previewing configurations requires watermarking target selected files...</p>
                    </div>
                  ) : (
                    <div 
                      ref={previewScrollRef}
                      onScroll={handleScrollPreview}
                      className="w-full h-full max-h-[82vh] overflow-y-auto style-scrollbar flex flex-col items-center py-4 space-y-6 scroll-smooth"
                    >
                      <Document
                        file={previewPdfUrl}
                        onLoadSuccess={({ numPages }) => setPreviewPageCount(numPages)}
                        loading={
                          <div className="flex flex-col items-center justify-center p-12 text-center text-xs font-mono text-gray-400 animate-pulse space-y-1.5">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#1A73E8]" />
                            <span>Compiling high fidelity rendering...</span>
                          </div>
                        }
                        className="flex flex-col items-center gap-6"
                      >
                        {Array.from(new Array(previewPageCount || 1), (_, index) => (
                          <div 
                            key={`preview_pdf_page_${index + 1}`}
                            className="p-1 animate-fadeIn rounded-2xl bg-white dark:bg-black/40 border border-gray-305 dark:border-gray-800 shadow"
                          >
                            <Page 
                              pageNumber={index + 1} 
                              scale={1.0}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              loading={<div className="w-[320px] h-[450px] bg-slate-400/5 animate-pulse rounded" />}
                            />
                            <div className="py-2 text-center text-[10px] font-mono text-gray-400">
                              PAGE {index + 1} OF {selectedPdf.pageCount} (PREVIEW STAGE)
                            </div>
                          </div>
                        ))}
                      </Document>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* WORKSPACE SELECTION MODAL LAYER */}
      {showWorkspacePicker && (
        <div className="fixed inset-0 z-55 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] ${
            isDark ? 'bg-[#28292c] text-[#E3E3E3]' : 'bg-white text-[#202124]'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
              isDark ? 'border-[#3C4043] bg-[#2E3033]' : 'border-gray-200 bg-gray-50'
            }`}>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <FolderOpen className="w-4.5 h-4.5 text-blue-500" /> Pull Workspace Sources
              </h3>
              <button 
                onClick={() => setShowWorkspacePicker(false)}
                className="p-1 rounded-full hover:bg-gray-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {workspacePdfs.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleLoadWorkspaceFile(item)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    isDark ? 'bg-gray-800/40 border-gray-850 hover:bg-gray-800' : 'bg-gray-50 border-gray-150 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="truncate pr-2">
                      <p className="text-xs font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono italic">{formatBytes(item.size)}</p>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-40s rotate-180" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WatermarkPdf;
