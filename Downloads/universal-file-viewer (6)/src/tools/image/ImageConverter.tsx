import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Trash2, 
  Image as ImageIcon, 
  FileImage,
  RefreshCw, 
  X, 
  Check, 
  Eye, 
  Settings,
  Sparkles,
  FolderOpen,
  Info
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import JSZip from 'jszip';
import { NotificationManager } from '../../notifications/NotificationManager';
import { ToolNotifications } from '../../notifications/ToolNotifications';

// Fully offline 24-bit BMP encoder to guarantee cross-browser BMP export
function encodeBMP(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not get 2D context");
  
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // BMP row padding: bytes per row must be a multiple of 4
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // File Header (BITMAPFILEHEADER)
  view.setUint16(0, 0x424D, false); // "BM"
  view.setUint32(2, fileSize, true); // File size
  view.setUint32(6, 0, true);        // Reserved
  view.setUint32(10, 54, true);      // Offset of pixel data

  // Info Header (BITMAPINFOHEADER)
  view.setUint32(14, 40, true);      // Header size
  view.setInt32(18, width, true);     // Width
  view.setInt32(22, height, true);    // Height (positive = bottom-up)
  view.setUint16(26, 1, true);       // Color planes
  view.setUint16(28, 24, true);      // Bits per pixel (24-bit RGB)
  view.setUint32(30, 0, true);       // Compression (0 = uncompressed BI_RGB)
  view.setUint32(34, pixelArraySize, true); // Image size
  view.setInt32(38, 2835, true);     // Horizontal 72 DPI
  view.setInt32(42, 2835, true);     // Vertical 72 DPI
  view.setUint32(46, 0, true);       // Palette colors
  view.setUint32(50, 0, true);       // Important colors

  let offset = 54;
  const bytes = new Uint8Array(buffer);
  
  // BMP writes pixels bottom-to-top
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = y * width * 4;
    let xOffset = 0;
    
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + xOffset;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      bytes[offset++] = b; // Blue
      bytes[offset++] = g; // Green
      bytes[offset++] = r; // Red
      
      xOffset += 4;
    }
    
    // Add trailing row alignment padding bytes
    const writtenBytes = width * 3;
    const padding = rowSize - writtenBytes;
    for (let p = 0; p < padding; p++) {
      bytes[offset++] = 0;
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

interface ImageInputItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  width: number;
  height: number;
}

interface ConversionResult {
  id: string;
  blob: Blob;
  url: string;
  name: string;
  size: number;
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'webp' | 'bmp';
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface ImageConverterProps {
  onClose?: () => void;
  onAddFile?: (file: any) => void;
  isDark?: boolean;
}

export const ImageConverter: React.FC<ImageConverterProps> = ({ onClose, onAddFile, isDark: propIsDark }) => {
  const [selectedItems, setSelectedItems] = useState<ImageInputItem[]>([]);
  const [convertedItems, setConvertedItems] = useState<ConversionResult[]>([]);
  const [localIsDark, setLocalIsDark] = useState(false);
  const isDark = propIsDark !== undefined ? propIsDark : localIsDark;

  // Global Config parameters
  const [targetFormat, setTargetFormat] = useState<'jpg' | 'png' | 'webp' | 'bmp'>('png');
  const [quality, setQuality] = useState<number>(90);
  const [resizeType, setResizeType] = useState<'original' | 'scale' | 'custom'>('original');
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);

  // Processing Animation state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [estRemainingSeconds, setEstRemainingSeconds] = useState<number | null>(null);

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

  // Cleanup Object URLs
  useEffect(() => {
    return () => {
      selectedItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
      convertedItems.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, []);

  // Image Loader with dimensions parsing
  const loadImageDetails = (file: File): Promise<ImageInputItem> => {
    return new Promise((resolve) => {
      const previewUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          id: 'img-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => {
        // Fallback placeholder dimensions
        resolve({
          id: 'img-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now(),
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          width: 0,
          height: 0
        });
      };
      img.src = previewUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(f => f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|gif)$/i.test(f.name));
    if (validFiles.length === 0) {
      NotificationManager.error('Please select valid image files only (JPG, PNG, WEBP, BMP, GIF).');
      return;
    }

    const loadedItems: ImageInputItem[] = [];
    for (const f of validFiles) {
      const detail = await loadImageDetails(f);
      loadedItems.push(detail);
    }

    setSelectedItems(prev => [...prev, ...loadedItems]);

    // Pre-populate custom dimensions with first image dimensions if empty
    if (loadedItems.length > 0 && !customWidth && !customHeight) {
      setCustomWidth(loadedItems[0].width.toString());
      setCustomHeight(loadedItems[0].height.toString());
    }
  };

  const removeSelectedItem = (id: string) => {
    setSelectedItems(prev => {
      const item = prev.find(x => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(x => x.id !== id);
    });
  };

  // Keep aspect ratio intact when inputting custom width
  const handleWidthChange = (val: string) => {
    setCustomWidth(val);
    if (!maintainAspectRatio || selectedItems.length === 0) return;
    
    const numWidth = parseFloat(val);
    if (isNaN(numWidth) || numWidth <= 0) return;

    // Use ratio from the first image
    const firstImg = selectedItems[0];
    if (firstImg.width > 0) {
      const ratio = firstImg.height / firstImg.width;
      setCustomHeight(Math.round(numWidth * ratio).toString());
    }
  };

  // Keep aspect ratio intact when inputting custom height
  const handleHeightChange = (val: string) => {
    setCustomHeight(val);
    if (!maintainAspectRatio || selectedItems.length === 0) return;

    const numHeight = parseFloat(val);
    if (isNaN(numHeight) || numHeight <= 0) return;

    // Use ratio from the first image
    const firstImg = selectedItems[0];
    if (firstImg.height > 0) {
      const ratio = firstImg.width / firstImg.height;
      setCustomWidth(Math.round(numHeight * ratio).toString());
    }
  };

  // Core conversion loop
  const executeConversion = async () => {
    if (selectedItems.length === 0) return;
    
    setIsProcessing(true);
    setProgress(2);
    setProcessingStatus('Starting offline formatting...');
    setEstRemainingSeconds(Math.ceil(selectedItems.length * 0.5));

    // Clear old converted products
    convertedItems.forEach(item => URL.revokeObjectURL(item.url));
    const results: ConversionResult[] = [];
    const startTime = Date.now();

    try {
      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        
        // Feed progress feedback
        const stepProgress = Math.round(2 + (i / selectedItems.length) * 95);
        setProgress(stepProgress);
        setProcessingStatus(`Rendering and compressing image "${item.name}"... (${i + 1}/${selectedItems.length})`);
        
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = (i || 1) / elapsed; // items per second
        const remaining = selectedItems.length - i;
        setEstRemainingSeconds(Math.ceil(remaining / (speed || 1)));

        // Create canvas
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Failed to load image: ${item.name}`));
          img.src = item.previewUrl;
        });

        // Compute output dimensions
        let targetW = img.width;
        let targetH = img.height;

        if (resizeType === 'scale') {
          const factor = scalePercent / 100;
          targetW = Math.max(1, Math.round(img.width * factor));
          targetH = Math.max(1, Math.round(img.height * factor));
        } else if (resizeType === 'custom') {
          const parsedW = parseInt(customWidth, 10);
          const parsedH = parseInt(customHeight, 10);
          if (!isNaN(parsedW) && parsedW > 0) targetW = parsedW;
          if (!isNaN(parsedH) && parsedH > 0) targetH = parsedH;
        }

        // Draw onto canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not acquire 2D context");

        // Fill background color for transparent pixels when converting to JPEG
        if (targetFormat === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Convert options
        let outBlob: Blob;
        let outMime = 'image/png';
        const qualityVal = quality / 100;

        if (targetFormat === 'jpg') {
          outMime = 'image/jpeg';
        } else if (targetFormat === 'webp') {
          outMime = 'image/webp';
        } else if (targetFormat === 'bmp') {
          outMime = 'image/bmp';
        }

        if (targetFormat === 'bmp') {
          outBlob = encodeBMP(canvas);
        } else {
          const dataUrl = canvas.toDataURL(outMime, qualityVal);
          const byteString = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let k = 0; k < byteString.length; k++) {
            ia[k] = byteString.charCodeAt(k);
          }
          outBlob = new Blob([ab], { type: outMime });
        }

        // Clean name
        const cleanBase = item.name.replace(/\.[^/.]+$/, "");
        const finalName = `${cleanBase}_converted.${targetFormat}`;

        const outputUrl = URL.createObjectURL(outBlob);
        
        results.push({
          id: item.id,
          blob: outBlob,
          url: outputUrl,
          name: finalName,
          size: outBlob.size,
          width: targetW,
          height: targetH,
          format: targetFormat
        });

        // Let background processes catch up
        await new Promise(resolve => setTimeout(resolve, 80));
      }

      setConvertedItems(results);
      setProgress(100);
      setProcessingStatus('Completed processing pipeline successfully');

      // Trigger conversion notifications
      results.forEach(res => {
        ToolNotifications.notifyConversionSuccess(res.name, 'image', res.format);
      });

      // Sync metadata database
      try {
        const storedAllFiles = localStorage.getItem('filemanager_all_files');
        const workspaceFiles: any[] = storedAllFiles ? JSON.parse(storedAllFiles) : [];
        
        const newFileEntries = results.map(res => ({
          id: 'conv-' + Math.random().toString(36).substr(2, 9),
          name: res.name,
          path: '/' + res.name,
          category: 'image',
          size: res.size,
          mimeType: res.blob.type,
          blob: res.blob,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          isFavorite: false
        }));

        localStorage.setItem('filemanager_all_files', JSON.stringify([...newFileEntries, ...workspaceFiles]));

        if (onAddFile) {
          newFileEntries.forEach(entry => onAddFile(entry));
        }
      } catch (innerErr) {
        console.warn('Sync converted index database failed', innerErr);
      }

    } catch (err: any) {
      console.error(err);
      NotificationManager.error('Formatting compilation encountered an error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setEstRemainingSeconds(null);
    }
  };

  // Downloads, Share, Open actions handler
  const handleItemDownload = async (item: ConversionResult) => {
    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.requestPermissions();
        const reader = new FileReader();
        reader.readAsDataURL(item.blob);
        reader.onloadend = async () => {
          const rawBase = reader.result as string;
          const cleanBase = rawBase.split(',')[1];
          await Filesystem.writeFile({
            path: item.name,
            data: cleanBase,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success('Saved directly into downloads directory folder!');
        };
      } catch (err) {
        console.error('Android native save downloads failed', err);
        NotificationManager.error('Permission denied or storage error encountered while trying to write file.');
      }
    } else {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = item.name;
      a.click();
    }
  };

  const handleItemOpen = (item: ConversionResult) => {
    window.open(item.url, '_blank');
  };

  const handleItemShare = async (item: ConversionResult) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(item.blob);
        reader.onloadend = async () => {
          const rawBase = reader.result as string;
          const fileBase = rawBase.split(',')[1];
          const cacheFile = await Filesystem.writeFile({
            path: item.name,
            data: fileBase,
            directory: Directory.Cache
          });
          await Share.share({
            title: item.name,
            url: cacheFile.uri
          });
        };
      } catch (err) {
        console.error('Mobile share call failing', err);
      }
    } else if (navigator.share && File) {
      try {
        const fileObj = new File([item.blob], item.name, { type: item.blob.type });
        await navigator.share({
          files: [fileObj],
          title: item.name
        });
      } catch (e) {
        console.log('Web Share API aborted', e);
        handleItemDownload(item);
      }
    } else {
      handleItemDownload(item);
    }
  };

  // ZIP batch compilation downloader
  const downloadAllAsZip = async () => {
    if (convertedItems.length === 0) return;
    
    setIsProcessing(true);
    setProgress(5);
    setProcessingStatus('Assembling files into compressed archive package...');

    try {
      const zip = new JSZip();
      convertedItems.forEach(item => {
        zip.file(item.name, item.blob);
      });

      setProgress(60);
      setProcessingStatus('Compressing ZIP file contents...');

      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        setProgress(Math.round(60 + (metadata.percent / 100) * 35));
      });

      const zipName = `Converted_Batch_${Date.now()}.zip`;
      
      setProgress(100);
      setProcessingStatus('ZIP archive assembled successfully');

      if (Capacitor.isNativePlatform()) {
        const reader = new FileReader();
        reader.readAsDataURL(zipBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          await Filesystem.writeFile({
            path: zipName,
            data: base64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success('Saved ZIP bundle into Downloads folder directory!');
        };
      } else {
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (err: any) {
      console.error(err);
      NotificationManager.error('Failed to assemble files to zip payload: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const restartTool = () => {
    selectedItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
    convertedItems.forEach(item => URL.revokeObjectURL(item.url));
    setSelectedItems([]);
    setConvertedItems([]);
    setProgress(0);
  };

  return (
    <div className={`p-4 md:p-6 min-h-full flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
      
      {/* Header Banner */}
      <div className="flex items-center gap-3 mb-6">
        {onClose && (
          <button onClick={onClose} className={`mr-1 p-2 rounded-full ${isDark ? 'hover:bg-[#303134]' : 'hover:bg-[#F0F4F9]'}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}
        <div className={`p-2.5 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#303134]' : 'bg-[#E8F0FE]'}`}>
          <FileImage className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-[#1A73E8]'}`} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Offline Image Converter</h1>
          <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
            Convert, scale, and compress images offline in premium Google Material style
          </p>
        </div>
      </div>

      {convertedItems.length === 0 ? (
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          
          {/* Main workspace (Selector or list) */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Import Trigger zone */}
            <div 
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files) {
                  const arr = Array.from(e.dataTransfer.files);
                  const valid = arr.filter(f => f.type.startsWith('image/'));
                  if (valid.length > 0) {
                    const wrap = async () => {
                      const list: ImageInputItem[] = [];
                      for (const file of valid) {
                        const r = await loadImageDetails(file);
                        list.push(r);
                      }
                      setSelectedItems(prev => [...prev, ...list]);
                    };
                    wrap();
                  }
                }
              }}
              className={`cursor-pointer hover:scale-[1.002] duration-200 border-2 border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center ${isDark ? 'border-[#3C4043] bg-[#303134] hover:border-blue-400' : 'border-[#DADCE0] bg-[#F8F9FA] hover:border-[#1A73E8]'}`}
            >
              <input
                id="converter-file-selector"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <label htmlFor="converter-file-selector" className="cursor-pointer flex flex-col items-center justify-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#202124] text-blue-400' : 'bg-[#E8F0FE] text-[#1A73E8]'}`}>
                  <ImageIcon className="w-7 h-7" />
                </div>
                <p className="text-base font-semibold mb-1">Select Images to Format</p>
                <p className={`text-xs mb-4 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
                  PNG, JPG, BMP, WEBP, or GIF up to 50MB
                </p>
                <span className="px-5 py-2.5 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                  Browse Files
                </span>
              </label>
            </div>

            {/* List of images ready */}
            {selectedItems.length > 0 && (
              <div className="flex-1 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] mb-3">
                  Selected Images ({selectedItems.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
                  {selectedItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`flex flex-col rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'bg-[#303134] border-[#3C4043]' : 'bg-white border-[#E8EAED]'}`}
                    >
                      <div className="h-36 bg-[#202124] relative flex items-center justify-center overflow-hidden">
                        <img 
                          src={item.previewUrl} 
                          alt="Input" 
                          className="max-w-full max-h-full object-contain"
                        />
                        <button 
                          onClick={() => removeSelectedItem(item.id)}
                          className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col gap-1.5">
                        <p className="text-xs font-semibold truncate" title={item.name}>
                          {item.name}
                        </p>
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-gray-400">
                          <span>{formatBytes(item.size)}</span>
                          <span>{item.width} × {item.height}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar configuration block */}
          <div className="w-full lg:w-80 shrink-0">
            <div className={`p-5 rounded-3xl border sticky top-6 flex flex-col gap-5 shadow-sm ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
              
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-700">
                <Settings className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Export Settings
                </h2>
              </div>

              {/* Format selection options */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Output Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['png', 'jpg', 'webp', 'bmp'] as const).map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => setTargetFormat(fmt)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-wider ${
                        targetFormat === fmt 
                          ? 'bg-blue-600 border-transparent text-white shadow-sm' 
                          : (isDark ? 'bg-[#202124] border-transparent text-neutral-400 hover:bg-[#3C4043]' : 'bg-white border-[#DADCE0] text-neutral-700 hover:bg-[#F1F3F4]')
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Quality control slider */}
              {(targetFormat === 'jpg' || targetFormat === 'webp') && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Quality</label>
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">{quality}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={e => setQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-blue-600 py-2 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                    <span>Compress / Small Size</span>
                    <span>High Quality</span>
                  </div>
                </div>
              )}

              {/* Scaling mode */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Dimensions Resize</label>
                <div className="flex flex-col gap-2">
                  <select
                    value={resizeType}
                    onChange={e => setResizeType(e.target.value as any)}
                    className={`w-full py-2 px-3 text-xs outline-none rounded-xl border font-semibold ${isDark ? 'bg-[#202124] border-transparent text-white' : 'bg-white border-[#DADCE0] text-gray-700'}`}
                  >
                    <option value="original">Original Dimensions</option>
                    <option value="scale">Factor Percentage Scale</option>
                    <option value="custom">Custom Maximum Bounds</option>
                  </select>

                  {/* Factor scale rendering slider */}
                  {resizeType === 'scale' && (
                    <div className="flex flex-col gap-1 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Scale factor</span>
                        <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{scalePercent}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={scalePercent}
                        onChange={e => setScalePercent(parseInt(e.target.value, 10))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Custom width dimensions input */}
                  {resizeType === 'custom' && (
                    <div className="flex flex-col gap-2.5 pt-1.5">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400">Max Width (px)</span>
                          <input
                            type="number"
                            min="1"
                            value={customWidth}
                            onChange={e => handleWidthChange(e.target.value)}
                            placeholder="e.g. 1920"
                            className={`w-full py-1.5 px-2.5 text-xs rounded-lg border outline-none font-bold ${isDark ? 'bg-[#202124] border-transparent text-white focus:border-blue-500' : 'bg-white border-[#DADCE0] text-[#202124] focus:border-blue-600'}`}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400">Max Height (px)</span>
                          <input
                            type="number"
                            min="1"
                            value={customHeight}
                            onChange={e => handleHeightChange(e.target.value)}
                            placeholder="e.g. 1080"
                            className={`w-full py-1.5 px-2.5 text-xs rounded-lg border outline-none font-bold ${isDark ? 'bg-[#202124] border-transparent text-white focus:border-blue-500' : 'bg-white border-[#DADCE0] text-[#202124] focus:border-blue-600'}`}
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer mt-1">
                        <input
                          type="checkbox"
                          checked={maintainAspectRatio}
                          onChange={e => setMaintainAspectRatio(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Lock locked aspect ratio
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <button
                  onClick={executeConversion}
                  className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 tracking-wider text-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Format {selectedItems.length} {selectedItems.length === 1 ? 'Image' : 'Images'}
                </button>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Outputs showcase container rendering */
        <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Conversion Product Outcomes</h2>
            
            {convertedItems.length > 1 && (
              <button
                onClick={downloadAllAsZip}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <FolderOpen className="w-4 h-4" /> Down All (.zip Archive)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {convertedItems.map((item, idx) => {
              const original = selectedItems.find(x => x.id === item.id) || selectedItems[idx] || { size: 0, width: 0, height: 0 };
              const ratio = Math.max(1, Math.round(((item.size - original.size) / (original.size || 1)) * 100));
              const isSmaller = item.size < original.size;
              const savings = isSmaller 
                ? Math.round(((original.size - item.size) / (original.size || 1)) * 100)
                : 0;

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-3xl border flex flex-col md:flex-row gap-4 items-center shadow-sm ${isDark ? 'bg-[#303134] border-transparent' : 'bg-white border-[#E8EAED]'}`}
                >
                  <div className="w-28 h-28 flex-shrink-0 bg-black/5 dark:bg-black/20 rounded-2xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={item.url} 
                      alt="Output" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 min-w-0 w-full flex flex-col gap-1.5">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-gray-100" title={item.name}>
                      {item.name}
                    </p>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
                      <div>Original: <b className="font-mono text-gray-700 dark:text-neutral-300">{formatBytes(original.size)}</b></div>
                      <div>Formatted: <b className="font-mono text-gray-700 dark:text-neutral-300">{formatBytes(item.size)}</b></div>
                      <div>Original Dimensions: <b className="font-mono">{original.width}×{original.height}</b></div>
                      <div>New Dimensions: <b className="font-mono">{item.width}×{item.height}</b></div>
                    </div>

                    {isSmaller && savings > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold self-start mt-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        Saved {savings}% bytes
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 mt-2.5">
                      <button
                        onClick={() => handleItemDownload(item)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleItemShare(item)}
                        className={`p-2 rounded-full border transition-colors ${isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50'}`}
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleItemOpen(item)}
                        className={`p-2 rounded-full border transition-colors ${isDark ? 'border-neutral-700 hover:bg-neutral-800' : 'border-neutral-200 hover:bg-neutral-50'}`}
                        title="Open File"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={restartTool}
            className={`self-center mt-6 text-sm font-semibold hover:underline cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}
          >
            Run Another Batch Format Conversion
          </button>
        </div>
      )}

      {/* Progress Mask Dialog (Google Style) */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className={`p-6 md:p-8 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center ${isDark ? 'bg-[#303134]' : 'bg-white'}`}>
            
            {/* Circular Progress Loader Ring */}
            <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className={`${isDark ? 'stroke-neutral-700' : 'stroke-neutral-100'}`}
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="stroke-blue-600 transition-all duration-300"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={((100 - progress) / 100) * (2 * Math.PI * 32)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-2 flex items-center justify-center text-lg font-bold">
                {progress}%
              </div>
            </div>

            {/* Micro Linear Loader indicator bar */}
            <div className="w-full bg-neutral-150 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h3 className="text-base font-bold mb-1">
              Formatting & Compressing
            </h3>
            
            <p className={`text-xs mb-3 font-medium min-h-8 px-4 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              {processingStatus}
            </p>

            {estRemainingSeconds !== null && estRemainingSeconds > 0 && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isDark ? 'bg-[#202124] text-neutral-400' : 'bg-neutral-50 text-neutral-600'}`}>
                {estRemainingSeconds}s remaining
              </span>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ImageConverter;
