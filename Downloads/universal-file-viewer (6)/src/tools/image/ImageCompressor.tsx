import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Download, 
  Share2, 
  Trash2, 
  Image as ImageIcon, 
  RefreshCw, 
  X, 
  Check, 
  Eye, 
  Sliders,
  Sparkles,
  Info,
  Maximize2,
  FileDown,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { NotificationManager } from '../../notifications/NotificationManager';
import { ToolNotifications } from '../../notifications/ToolNotifications';

interface CompressorResult {
  blob: Blob;
  url: string;
  size: number;
  width: number;
  height: number;
  qualityUsed: number;
  scaleUsed: number;
  percentageDiff: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const ImageCompressor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);
  const [format, setFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');

  // Interactive configurations
  const [compressionMode, setCompressionMode] = useState<'target' | 'manual'>('target');
  const [targetSizePreset, setTargetSizePreset] = useState<number | null>(1); // in MB (e.g. 1 MB). Null if using custom text slider
  const [customTargetSlider, setCustomTargetSlider] = useState<number>(1000); // in KB (1000 KB = 1MB)
  
  // Manual sliders
  const [manualQuality, setManualQuality] = useState<number>(75);
  const [manualScale, setManualScale] = useState<number>(100);

  // States for compressor output
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [estimatedSeconds, setEstimatedSeconds] = useState<number | null>(null);

  // Results
  const [compressedResult, setCompressedResult] = useState<CompressorResult | null>(null);

  // Compare slide handle percentage state (0 to 100)
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const [isDark, setIsDark] = useState<boolean>(false);

  // Detect Dark Theme
  useEffect(() => {
    const checkDark = () => {
      const isDarkClass = document.documentElement.classList.contains('dark');
      setIsDark(isDarkClass);
    };
    checkDark();
    
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Sync format with file type
  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.type.includes('png')) {
        setFormat('png');
      } else if (selectedFile.type.includes('webp')) {
        setFormat('webp');
      } else {
        setFormat('jpg');
      }
    }
  }, [selectedFile]);

  // Handle image selections
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setupImage(e.target.files[0]);
    }
  };

  const setupImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      NotificationManager.error('Please select a valid image file.');
      return;
    }

    // Cleanup previous object URLs
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedResult) URL.revokeObjectURL(compressedResult.url);

    setCompressedResult(null);
    setSelectedFile(file);
    setOriginalSize(file.size);
    
    // Set custom target limit slider to roughly half of current file size
    const halfSizeKb = Math.max(50, Math.round((file.size / 1024) * 0.5));
    setCustomTargetSlider(Math.min(halfSizeKb, 5000));

    const url = URL.createObjectURL(file);
    setOriginalUrl(url);

    // Parse image scale boundaries
    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.width);
      setOriginalHeight(img.height);
    };
    img.src = url;
  };

  // Slider Mouse Move calculation
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  // Iterative Adaptive Compression search
  const runCompressionMode = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(5);
    setProcessingStatus('Parsing file metadata and setting canvas grid...');
    setEstimatedSeconds(3);

    const isLossy = format === 'jpg' || format === 'webp';
    let mimeType = 'image/jpeg';
    if (format === 'png') mimeType = 'image/png';
    else if (format === 'webp') mimeType = 'image/webp';

    // Set target bytes based on settings
    let targetBytes = originalSize * 0.7; // default fallback compression of 30% savings

    if (compressionMode === 'target') {
      if (targetSizePreset !== null) {
        targetBytes = targetSizePreset * 1024 * 1024;
      } else {
        targetBytes = customTargetSlider * 1024;
      }
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 300)); // smooth experience transitions
      setProgress(25);
      setProcessingStatus('Starting multi-pass optimizer passes...');

      // Load image details
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load selected image into Canvas.'));
        img.src = originalUrl;
      });

      let finalBlob = selectedFile as Blob;
      let finalQuality = manualQuality / 100;
      let finalScale = manualScale / 100;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (compressionMode === 'manual') {
        const w = Math.max(1, Math.round(originalWidth * finalScale));
        const h = Math.max(1, Math.round(originalHeight * finalScale));
        canvas.width = w;
        canvas.height = h;

        if (ctx) {
          if (format === 'jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
          } else {
            ctx.clearRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
        }

        setProgress(70);
        setProcessingStatus('Encoding final image format payload...');

        const dataUrl = canvas.toDataURL(mimeType, finalQuality);
        const byteString = atob(dataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let k = 0; k < byteString.length; k++) {
          ia[k] = byteString.charCodeAt(k);
        }
        finalBlob = new Blob([ab], { type: mimeType });
        
      } else {
        // Target Sizing Sieve search algorithm (max 6 passes for fast response)
        // Adjust both scale and quality to squeeze size into target boundary
        const searches = isLossy ? [
          { scale: 1.0, quality: 0.9 },
          { scale: 1.0, quality: 0.75 },
          { scale: 0.9, quality: 0.7 },
          { scale: 0.8, quality: 0.6 },
          { scale: 0.7, quality: 0.5 },
          { scale: 0.5, quality: 0.4 }
        ] : [
          // For PNGs we scale dimension parameters only as quality doesn't compress png lossless algorithm
          { scale: 1.0, quality: 1.0 },
          { scale: 0.85, quality: 1.0 },
          { scale: 0.7, quality: 1.0 },
          { scale: 0.55, quality: 1.0 },
          { scale: 0.4, quality: 1.0 },
          { scale: 0.25, quality: 1.0 }
        ];

        let bestBlob: Blob | null = null;
        let bestQuality = 1.0;
        let bestScale = 1.0;

        for (let pass = 0; pass < searches.length; pass++) {
          const runItem = searches[pass];
          const trScale = runItem.scale;
          const trQuality = runItem.quality;

          setProgress(Math.round(25 + (pass / searches.length) * 55));
          setProcessingStatus(`Iterating optimization pass ${pass + 1}...`);
          setEstimatedSeconds(Math.max(1, Math.ceil((searches.length - pass) * 0.4)));

          const w = Math.max(1, Math.round(originalWidth * trScale));
          const h = Math.max(1, Math.round(originalHeight * trScale));

          canvas.width = w;
          canvas.height = h;

          if (ctx) {
            if (format === 'jpg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, w, h);
            } else {
              ctx.clearRect(0, 0, w, h);
            }
            ctx.drawImage(img, 0, 0, w, h);
          }

          const dataUrl = canvas.toDataURL(mimeType, trQuality);
          const byteString = atob(dataUrl.split(',')[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let k = 0; k < byteString.length; k++) {
            ia[k] = byteString.charCodeAt(k);
          }
          const trialBlob = new Blob([ab], { type: mimeType });

          if (trialBlob.size <= targetBytes) {
            bestBlob = trialBlob;
            bestQuality = trQuality;
            bestScale = trScale;
            break; // Perfect fit found!
          } else {
            // Track the smallest one we get in case we don't fit target
            if (!bestBlob || trialBlob.size < bestBlob.size) {
              bestBlob = trialBlob;
              bestQuality = trQuality;
              bestScale = trScale;
            }
          }

          // Delay slightly to keep CPU running UI frame updates
          await new Promise(resolve => setTimeout(resolve, 60));
        }

        finalBlob = bestBlob || selectedFile;
        finalQuality = bestQuality;
        finalScale = bestScale;
      }

      setProgress(95);
      setProcessingStatus('Saving rendering product outcomes...');
      await new Promise(resolve => setTimeout(resolve, 150));

      const outUrl = URL.createObjectURL(finalBlob);
      const diffBytes = originalSize - finalBlob.size;
      const savingsPercent = Math.round((diffBytes / originalSize) * 100);

      const computedW = Math.max(1, Math.round(originalWidth * finalScale));
      const computedH = Math.max(1, Math.round(originalHeight * finalScale));

      setCompressedResult({
        blob: finalBlob,
        url: outUrl,
        size: finalBlob.size,
        width: computedW,
        height: computedH,
        qualityUsed: Math.round(finalQuality * 100),
        scaleUsed: Math.round(finalScale * 100),
        percentageDiff: savingsPercent
      });

      // Register file to recently modified in local workspace manager
      try {
        const storedAllFiles = localStorage.getItem('filemanager_all_files');
        const workspaceFiles: any[] = storedAllFiles ? JSON.parse(storedAllFiles) : [];
        
        const fileExt = format;
        const cleanBase = selectedFile.name.replace(/\.[^/.]+$/, "");
        const outputFileName = `${cleanBase}_compressed.${fileExt}`;

        const newFileEntry = {
          id: 'comp-' + Math.random().toString(36).substr(2, 9),
          name: outputFileName,
          path: '/' + outputFileName,
          category: 'image',
          size: finalBlob.size,
          mimeType: finalBlob.type,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          isFavorite: false
        };

        localStorage.setItem('filemanager_all_files', JSON.stringify([newFileEntry, ...workspaceFiles]));
        ToolNotifications.notifyCompressionSuccess(outputFileName, originalSize - finalBlob.size);
      } catch (innerErr) {
        console.warn('Sync compressor file index failed', innerErr);
      }

      setProgress(100);
      setProcessingStatus('Compressed successfully!');

    } catch (err: any) {
      console.error(err);
      NotificationManager.error('Compression encountered an error: ' + err.message);
    } finally {
      setIsProcessing(false);
      setEstimatedSeconds(null);
    }
  };

  // File Interactions: downloads, open, shares
  const handleDownload = async () => {
    if (!selectedFile || !compressedResult) return;

    const fileExt = format;
    const cleanBase = selectedFile.name.replace(/\.[^/.]+$/, "");
    const outputFileName = `${cleanBase}_compressed.${fileExt}`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.requestPermissions();
        const reader = new FileReader();
        reader.readAsDataURL(compressedResult.blob);
        reader.onloadend = async () => {
          const rawBase = reader.result as string;
          const cleanBase64 = rawBase.split(',')[1];
          await Filesystem.writeFile({
            path: outputFileName,
            data: cleanBase64,
            // @ts-ignore
            directory: Directory.Downloads || 'DOWNLOADS'
          });
          NotificationManager.success('Saved directly into downloads folder!');
        };
      } catch (err) {
        console.error('Android native Downloads Save Failed', err);
        NotificationManager.error('Permission denied or storage error encountered while trying to write file.');
      }
    } else {
      const a = document.createElement('a');
      a.href = compressedResult.url;
      a.download = outputFileName;
      a.click();
    }
  };

  const handleOpen = () => {
    if (!compressedResult) return;
    window.open(compressedResult.url, '_blank');
  };

  const handleShare = async () => {
    if (!selectedFile || !compressedResult) return;

    const fileExt = format;
    const cleanBase = selectedFile.name.replace(/\.[^/.]+$/, "");
    const outputFileName = `${cleanBase}_compressed.${fileExt}`;

    if (Capacitor.isNativePlatform()) {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(compressedResult.blob);
        reader.onloadend = async () => {
          const rawBase = reader.result as string;
          const fileBase = rawBase.split(',')[1];
          const cacheFile = await Filesystem.writeFile({
            path: outputFileName,
            data: fileBase,
            directory: Directory.Cache
          });
          await Share.share({
            title: outputFileName,
            url: cacheFile.uri
          });
        };
      } catch (err) {
        console.error('Mobile share call failed', err);
      }
    } else if (navigator.share && File) {
      try {
        const fileObj = new File([compressedResult.blob], outputFileName, { type: compressedResult.blob.type });
        await navigator.share({
          files: [fileObj],
          title: outputFileName
        });
      } catch (e) {
        console.log('Web Share aborted', e);
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  const handleClear = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedResult) URL.revokeObjectURL(compressedResult.url);

    setSelectedFile(null);
    setOriginalUrl('');
    setOriginalSize(0);
    setCompressedResult(null);
    setProgress(0);
  };

  // Quality/Size estimation algorithm
  const estimatedSizeKb = () => {
    if (!originalSize) return 0;
    
    if (compressionMode === 'manual') {
      const scaleFactor = manualScale / 100;
      const pixelRatio = scaleFactor * scaleFactor;
      const formatMultiplier = format === 'png' ? 1.0 : (format === 'webp' ? 0.45 : 0.65);
      const qualityFactor = manualQuality / 100;

      // basic size model heuristic
      return Math.round((originalSize / 1024) * pixelRatio * formatMultiplier * (0.3 + 0.7 * qualityFactor));
    } else {
      if (targetSizePreset !== null) {
        return targetSizePreset * 1024;
      }
      return customTargetSlider;
    }
  };

  return (
    <div className={`p-4 md:p-6 min-h-full flex flex-col font-sans transition-colors duration-200 ${isDark ? 'bg-[#202124] text-[#E3E3E3]' : 'bg-white text-[#202124]'}`}>
      
      {/* Title block */}
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#303134]' : 'bg-[#E8F0FE]'}`}>
          <Sliders className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-[#1A73E8]'}`} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Offline Image Compressor</h1>
          <p className={`text-xs ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
            Squeeze byte size, control quality targets offline with clean comparisons
          </p>
        </div>
      </div>

      {!selectedFile ? (
        /* Empty Picker state */
        <div 
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              setupImage(e.dataTransfer.files[0]);
            }
          }}
          className={`cursor-pointer hover:scale-[1.002] duration-200 border-2 border-dashed rounded-3xl p-12 text-center flex-1 flex flex-col items-center justify-center ${isDark ? 'border-[#3C4043] bg-[#303134] hover:border-blue-400' : 'border-[#DADCE0] bg-[#F8F9FA] hover:border-[#1A73E8]'}`}
        >
          <input
            id="compressor-picker"
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="compressor-picker" className="cursor-pointer flex flex-col items-center justify-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-[#202124] text-blue-400' : 'bg-[#E8F0FE] text-[#1A73E8]'}`}>
              <ImageIcon className="w-8 h-8" />
            </div>
            <p className="text-base font-semibold mb-1">Select Image to Compress</p>
            <p className={`text-xs mb-6 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              Supports PNG, JPG, and WEBP files up to 50MB
            </p>
            <span className="px-6 py-3 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              Browse Files
            </span>
          </label>
        </div>
      ) : (
        /* Editing Workspace state */
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          
          {/* Main Comparison/Viewer Box */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Visual View Frame */}
            <div className={`p-4 rounded-3xl border shadow-sm flex-1 flex flex-col items-center justify-center overflow-hidden min-h-[350px] relative ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
              
              {!compressedResult ? (
                /* Original image only preview */
                <div className="w-full h-full flex items-center justify-center relative select-none">
                  <img 
                    src={originalUrl} 
                    alt="Original visual preview" 
                    className="max-w-full max-h-[380px] object-contain rounded-xl"
                  />
                  <span className="absolute bottom-3 right-3 bg-black/60 text-white font-mono text-[10px] px-2.5 py-1 rounded-md backdrop-blur-xs">
                    Original dimensions: {originalWidth} × {originalHeight}
                  </span>
                </div>
              ) : (
                /* Double Comparison Interactive Sliding Pane (Premium widget) */
                <div 
                  ref={sliderContainerRef}
                  onMouseMove={e => isDraggingSlider && handleSliderMove(e.clientX)}
                  onTouchMove={handleTouchMove}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onTouchEnd={() => setIsDraggingSlider(false)}
                  className="w-full h-full max-w-[500px] max-h-[380px] aspect-auto relative rounded-2xl overflow-hidden select-none border border-neutral-200 dark:border-neutral-800 bg-[#121212] flex items-center justify-center cursor-ew-resize"
                >
                  {/* Container representing dimensions of images */}
                  <div className="w-full h-full flex items-center justify-center relative">
                    
                    {/* Left base image (Original version) */}
                    <img 
                      src={originalUrl} 
                      alt="Original snapshot background" 
                      draggable="false"
                      className="max-w-full max-h-full object-contain pointer-events-none rounded-xl"
                    />

                    {/* Right absolute overlapping node (Compressed version with sliding clipping boundary) */}
                    <div 
                      className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none flex items-center justify-start bg-[#121212]"
                      style={{ left: `${sliderPosition}%` }}
                    >
                      <img 
                        src={compressedResult.url} 
                        alt="Compressed overlay target" 
                        draggable="false"
                        className="absolute right-0 max-h-full object-contain pointer-events-none rounded-xl"
                        style={{ 
                          width: sliderContainerRef.current?.getBoundingClientRect().width || '100%',
                          maxWidth: 'none'
                        }}
                      />
                    </div>

                    {/* Floating Labels pointing left and right */}
                    <div className="absolute top-3 left-3 bg-black/65 text-white font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-xs">
                      Before (Original)
                    </div>
                    <div className="absolute top-3 right-3 bg-blue-600/80 text-white font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-xs">
                      After (Compressed)
                    </div>

                    {/* Interactive dragging pole sliding handle divider */}
                    <div 
                      className="absolute inset-y-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-lg"
                      style={{ left: `${sliderPosition}%` }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDraggingSlider(true);
                      }}
                      onTouchStart={() => setIsDraggingSlider(true)}
                    >
                      <div className="w-8 h-8 rounded-full bg-white text-blue-600 shadow-xl border border-neutral-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                        <Maximize2 className="w-4 h-4 transform rotate-45" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Micro Details panel */}
            <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#303134] border-transparent' : 'bg-white border-[#E8EAED]'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div>
                  <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#80868B]'}`}>
                    Original Size
                  </span>
                  <p className="text-base font-bold font-mono">
                    {formatBytes(originalSize)}
                  </p>
                </div>

                <div>
                  <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#80868B]'}`}>
                    Input Format
                  </span>
                  <p className="text-sm font-semibold uppercase font-mono">
                    {selectedFile.type.split('/')[1] || 'Unknown'}
                  </p>
                </div>

                {compressedResult ? (
                  <>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5">
                        Compressed Size
                      </span>
                      <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatBytes(compressedResult.size)}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8] mb-0.5">
                        Size Difference
                      </span>
                      <p className="text-base font-bold font-mono text-[#1A73E8] dark:text-[#8AB4F8]">
                        -{compressedResult.percentageDiff}%
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-[#9AA0A6]' : 'text-[#80868B]'}`}>
                        Estimated Size (Approx)
                      </span>
                      <p className="text-base font-bold font-mono text-[#1A73E8] dark:text-[#8AB4F8]">
                        ~ {formatBytes(estimatedSizeKb() * 1024)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Sizing Controls Panel */}
          <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
            
            <div className={`p-5 rounded-3xl border shadow-sm flex flex-col gap-4 ${isDark ? 'bg-[#303134] border-transparent' : 'bg-[#F8F9FA] border-[#E8EAED]'}`}>
              
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-700">
                <Sliders className="w-4 h-4 text-[#1A73E8] dark:text-[#8AB4F8]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1A73E8] dark:text-[#8AB4F8]">
                  Compression Configs
                </h3>
              </div>

              {/* Toggle switch between Mode Types */}
              <div className="grid grid-cols-2 bg-neutral-100 dark:bg-[#202124] p-1 rounded-2xl">
                <button
                  onClick={() => setCompressionMode('target')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    compressionMode === 'target' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-300'
                  }`}
                >
                  Smart Fit Target
                </button>
                <button
                  onClick={() => setCompressionMode('manual')}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    compressionMode === 'manual' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-neutral-300'
                  }`}
                >
                  Manual Controls
                </button>
              </div>

              {/* Compression Mode Renderers */}
              {compressionMode === 'target' ? (
                <div className="space-y-4 pt-1">
                  
                  {/* Presets Chips */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Standard Size Limits
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1, 2, 3, 4, 5].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setTargetSizePreset(preset)}
                          className={`py-2 px-1 rounded-xl text-xs border font-mono font-bold transition-all ${
                            targetSizePreset === preset
                              ? 'bg-blue-600 border-transparent text-white shadow-sm'
                              : (isDark ? 'bg-[#202124] border-transparent text-[#9AA0A6] hover:bg-[#3C4043]' : 'bg-white border-[#DADCE0] text-[#5F6368] hover:bg-[#F8F9FA]')
                          }`}
                        >
                          {preset} MB
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Limits line separator */}
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest shrink-0">Or Custom Target Limit</span>
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-700" />
                  </div>

                  {/* Slider parameters */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Target Size Limit</span>
                      <span className="text-xs font-bold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">
                        {customTargetSlider >= 1000 
                          ? `${(customTargetSlider / 1024).toFixed(1)} MB` 
                          : `${customTargetSlider} KB`
                        }
                      </span>
                    </div>

                    <input
                      type="range"
                      min="50"
                      max="10000"
                      step="50"
                      value={customTargetSlider}
                      onChange={e => {
                        setTargetSizePreset(null);
                        setCustomTargetSlider(parseInt(e.target.value, 10));
                      }}
                      className="w-full h-1.5 accent-blue-600 bg-neutral-200 dark:bg-[#202124] rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>50 KB (High compress)</span>
                      <span>10 MB (Large size)</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  
                  {/* Quality rating slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Quality Compression</span>
                      <span className="text-xs font-bold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">{manualQuality}%</span>
                    </div>
                    
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={manualQuality}
                      onChange={e => setManualQuality(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 accent-blue-600 bg-neutral-200 dark:bg-[#202124] rounded-lg cursor-pointer animate-none"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Small Size (5%)</span>
                      <span>Original Quality (100%)</span>
                    </div>
                  </div>

                  {/* Dimensions Scale slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Resolution Scale</span>
                      <span className="text-xs font-bold text-[#1A73E8] dark:text-[#8AB4F8] font-mono">{manualScale}%</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={manualScale}
                      onChange={e => setManualScale(parseInt(e.target.value, 10))}
                      className="w-full h-1.5 accent-blue-600 bg-neutral-200 dark:bg-[#202124] rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>Scale Down 10%</span>
                      <span>Full Grid (100%)</span>
                    </div>
                  </div>

                </div>
              )}

              {/* Format selection toggles */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Format Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['jpg', 'png', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all uppercase ${
                        format === fmt
                          ? 'bg-blue-600/10 text-[#1A73E8] dark:text-[#8AB4F8] font-extrabold ring-1 ring-blue-500'
                          : (isDark ? 'bg-[#202124] text-neutral-400 hover:bg-[#3C4043]' : 'bg-white border border-[#DADCE0] text-gray-600 hover:bg-[#F8F9FA]')
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Process Trigger Button */}
              <button
                onClick={runCompressionMode}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 tracking-wider text-xs cursor-pointer mt-2"
              >
                <Sparkles className="w-4 h-4" />
                Compress Image File
              </button>
            </div>

            {/* Results interaction overlay if finished */}
            {compressedResult && (
              <div className={`p-5 rounded-3xl border shadow-sm flex flex-col gap-3.5 ${isDark ? 'bg-[#303134] border-transparent' : 'bg-white border-[#E8EAED]'}`}>
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-neutral-700">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Squeezed Completed!
                  </h4>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                >
                  <Download className="w-4.5 h-4.5" />
                  Save / Download
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShare}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-neutral-700 text-[#8AB4F8] hover:bg-neutral-800' : 'border-neutral-200 text-[#1A73E8] hover:bg-neutral-50'
                    }`}
                  >
                    <Share2 className="w-4 h-4" /> Share File
                  </button>
                  <button
                    onClick={handleOpen}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border ${
                      isDark ? 'border-neutral-700 text-[#8AB4F8] hover:bg-neutral-800' : 'border-neutral-200 text-[#1A73E8] hover:bg-neutral-50'
                    }`}
                  >
                    <Eye className="w-4 h-4" /> View Large
                  </button>
                </div>

                <button
                  onClick={handleClear}
                  className={`text-center text-[11px] font-bold uppercase tracking-wide cursor-pointer hover:underline ${
                    isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-black'
                  }`}
                >
                  Choose Another Image
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Modern Google Style Processing Mask */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className={`p-6 md:p-8 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center ${isDark ? 'bg-[#303134]' : 'bg-white'}`}>
            
            {/* Circular Progress Ring */}
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

            {/* Slider tracking loader */}
            <div className="w-full bg-neutral-150 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden mb-5">
              <div 
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <h3 className="text-base font-bold mb-1">
              Squeezing Image Bytes
            </h3>

            <p className={`text-xs mb-3 font-medium min-h-8 px-4 ${isDark ? 'text-[#9AA0A6]' : 'text-[#5F6368]'}`}>
              {processingStatus}
            </p>

            {estimatedSeconds !== null && estimatedSeconds > 0 && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${isDark ? 'bg-[#202124] text-neutral-400' : 'bg-neutral-50 text-neutral-600'}`}>
                {estimatedSeconds}s remaining
              </span>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default ImageCompressor;
